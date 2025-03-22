import { CONFIG } from './config.js';
import { createObject } from './objects.js';
import * as THREE from 'https://unpkg.com/three@0.149.0/build/three.module.js';

// Simplex noise for terrain and object generation
let simplex;

// Initialize with seeded simplex-noise
async function initNoise() {
  const { createNoise2D, createNoise3D } = await import('https://unpkg.com/simplex-noise@4.0.1/dist/esm/simplex-noise.js');
  
  // Seeded random function
  const seed = CONFIG.WORLD.SEED;
  const seedRandom = function(a) {
    return function() {
      const t = a += 0x6D2B79F5;
      const u = (t ^ (t >>> 15)) * (t | 1);
      const v = (u ^ (u >>> 7)) * (u | 61);
      return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
    };
  }(seed);
  
  simplex = {
    noise2D: createNoise2D(seedRandom),
    noise3D: createNoise3D(seedRandom)
  };
  
  return simplex;
}

// ChunkSystem manages loading, unloading, and persistence of world chunks
export class ChunkSystem {
  constructor(scene, katamari) {
    this.scene = scene;
    this.katamari = katamari;
    this.chunks = new Map(); // Map of loaded chunks using "x,y,z" as key
    this.loadQueue = [];     // Queue of chunks to load
    this.saveQueue = [];     // Queue of chunks to save
    this.loadedChunks = 0;   // Counter for loaded chunks
    
    // Initialize noise
    initNoise().then(() => {
      console.log("Noise initialized with seed:", CONFIG.WORLD.SEED);
    });
    
    // Set up room connection for persistence
    this.room = new WebsimSocket();
    this.room.onopen = () => this.onRoomConnected();
    
    // Ground mesh for basic terrain
    this.setupGround();
  }
  
  // Create a basic ground plane
  setupGround() {
    // Create a higher resolution ground for better appearance
    const groundGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
    groundGeometry.rotateX(-Math.PI / 2);
    
    // Apply height displacement to vertices based on noise
    const vertices = groundGeometry.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i);
      const z = vertices.getZ(i);
      const height = this.getHeightAt(x, z);
      vertices.setY(i, height);
    }
    
    groundGeometry.computeVertexNormals();
    
    // Create detailed ground texture
    const groundTexture = this.createTerrainTexture();
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(50, 50);
    
    // Ground material with normal mapping for better detail
    const groundMaterial = new THREE.MeshStandardMaterial({
      map: groundTexture,
      roughness: 0.9,
      metalness: 0.0,
      vertexColors: false
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.receiveShadow = true;
    ground.name = "ground";
    this.scene.add(ground);
    
    // Add LOD support for ground
    if (CONFIG.PERFORMANCE.ADAPTIVE_LOD) {
      this.setupGroundLOD(ground);
    }
  }
  
  // Create a procedural terrain texture
  createTerrainTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Base green color
    ctx.fillStyle = '#3a7335';
    ctx.fillRect(0, 0, 512, 512);
    
    // Add noise patterns for detail
    for (let y = 0; y < 512; y += 4) {
      for (let x = 0; x < 512; x += 4) {
        const noise = Math.random();
        const color = noise > 0.6 ? '#2d5d29' : 
                     noise > 0.3 ? '#458339' : 
                     '#3a7335';
        
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 4, 4);
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
  
  // Setup LOD for ground
  setupGroundLOD(ground) {
    // We'll implement this later if needed
  }
  
  // Get height at a specific world coordinate
  getHeightAt(x, z) {
    if (!simplex) return 0;
    
    // Use multiple octaves of noise for more natural terrain
    let amplitude = 1.0;
    let frequency = CONFIG.WORLD.TERRAIN_SCALE;
    let maxHeight = 0;
    let height = 0;
    
    // Apply multiple octaves for more natural, detailed terrain
    for (let i = 0; i < CONFIG.WORLD.TERRAIN_OCTAVES; i++) {
      // Get noise value between -1 and 1
      const noiseValue = simplex.noise2D(x * frequency, z * frequency);
      
      // Add weighted noise to height
      height += noiseValue * amplitude;
      
      // Track total possible height for normalization
      maxHeight += amplitude;
      
      // Next octave has higher frequency but lower amplitude
      amplitude *= CONFIG.WORLD.TERRAIN_PERSISTENCE;
      frequency *= 2;
    }
    
    // Normalize and scale to MAX_HEIGHT
    height = (height / maxHeight) * 0.5 + 0.5;
    
    // Apply some terrain features
    const mountainNoise = Math.pow(simplex.noise2D(x * 0.003, z * 0.003) * 0.5 + 0.5, 2);
    const flatteningFactor = Math.pow(simplex.noise2D(x * 0.002, z * 0.002) * 0.5 + 0.5, 3);
    
    // Blend between flat areas and mountains
    height = height * (1 - flatteningFactor) + mountainNoise * flatteningFactor;
    
    return height * CONFIG.WORLD.MAX_HEIGHT;
  }
  
  // Called when websocket connection is established
  onRoomConnected() {
    console.log("Room connected, ready to persist chunks");
    
    // Load any existing chunks from the database
    this.loadPersistedChunks();
    
    // Set up subscription to chunk updates
    this.room.collection('chunk').subscribe(chunks => {
      console.log("Got chunks from database:", chunks.length);
      this.processPersistedChunks(chunks);
    });
  }
  
  // Load chunks from the database
  async loadPersistedChunks() {
    const chunks = await this.room.collection('chunk').getList();
    this.processPersistedChunks(chunks);
  }
  
  // Process chunks loaded from the database
  processPersistedChunks(chunks) {
    for (const chunkData of chunks) {
      const key = `${chunkData.x},${chunkData.y},${chunkData.z}`;
      
      // Only load if not already loaded
      if (!this.chunks.has(key)) {
        this.loadChunkFromData(chunkData);
      }
    }
  }
  
  // Load a chunk from persisted data
  loadChunkFromData(chunkData) {
    const key = `${chunkData.x},${chunkData.y},${chunkData.z}`;
    const chunk = {
      x: chunkData.x,
      y: chunkData.y,
      z: chunkData.z,
      objects: [],
      group: new THREE.Group(),
      modified: false
    };
    
    // Create all objects in the chunk from saved data
    if (chunkData.objects && Array.isArray(chunkData.objects)) {
      for (const objData of chunkData.objects) {
        const object = createObject(
          objData.type,
          new THREE.Vector3(objData.position.x, objData.position.y, objData.position.z),
          objData.scale,
          objData.rotation
        );
        
        if (object) {
          chunk.objects.push({
            mesh: object,
            data: objData,
            collected: objData.collected || false
          });
          
          // Only add to scene if not already collected
          if (!objData.collected) {
            chunk.group.add(object);
          }
        }
      }
    }
    
    this.chunks.set(key, chunk);
    this.scene.add(chunk.group);
    this.loadedChunks++;
  }
  
  // Generate a new chunk at specified coordinates
  generateChunk(x, y, z) {
    const key = `${x},${y},${z}`;
    const chunkSize = CONFIG.WORLD.CHUNK_SIZE;
    
    const chunk = {
      x, y, z,
      objects: [],
      group: new THREE.Group(),
      modified: false
    };
    
    // Use seeded random based on chunk position for consistent generation
    const chunkSeed = x * 73856093 ^ y * 19349663 ^ z * 83492791;
    let seed = chunkSeed;
    const seededRandom = function() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    
    // Determine terrain characteristics in this chunk
    const chunkCenterX = x * chunkSize + chunkSize / 2;
    const chunkCenterZ = z * chunkSize + chunkSize / 2;
    const avgHeight = this.getHeightAt(chunkCenterX, chunkCenterZ);
    const heightSamples = [];
    
    // Sample heights for object placement
    const sampleCount = 16;
    for (let sx = 0; sx < sampleCount; sx++) {
      for (let sz = 0; sz < sampleCount; sz++) {
        const sampleX = x * chunkSize + (sx / sampleCount) * chunkSize;
        const sampleZ = z * chunkSize + (sz / sampleCount) * chunkSize;
        heightSamples.push({
          x: sampleX,
          z: sampleZ,
          height: this.getHeightAt(sampleX, sampleZ)
        });
      }
    }
    
    // Sort samples by height to place objects more appropriately
    heightSamples.sort((a, b) => a.height - b.height);
    
    // Determine environmental zone based on average height
    const isWater = avgHeight < 15;
    const isPlain = avgHeight >= 15 && avgHeight < 30;
    const isHills = avgHeight >= 30 && avgHeight < 60;
    const isMountain = avgHeight >= 60;
    
    // Adjust object density and types based on terrain
    let objectDensity = CONFIG.OBJECTS.DENSITY;
    if (isWater) objectDensity *= 0.3;
    if (isPlain) objectDensity *= 1.2;
    if (isHills) objectDensity *= 0.8;
    if (isMountain) objectDensity *= 0.5;
    
    // Determine number of objects to create in this chunk
    const baseObjectCount = Math.floor(seededRandom() * 15 * objectDensity) + 5;
    const objectCount = Math.min(30, baseObjectCount);
    
    // Generate objects for the chunk with smart placement
    for (let i = 0; i < objectCount; i++) {
      // Select a height sample biased by object type
      const sampleIndex = Math.floor(Math.pow(seededRandom(), 2) * heightSamples.length);
      const sample = heightSamples[sampleIndex];
      
      // Add some randomness to the exact position
      const posX = sample.x + (seededRandom() - 0.5) * (chunkSize / 8);
      const posZ = sample.z + (seededRandom() - 0.5) * (chunkSize / 8);
      const posY = this.getHeightAt(posX, posZ);
      
      // Determine object size tier
      const tierRandom = seededRandom();
      let tierIndex = 0;
      
      // Terrain-dependent size distribution
      let tierDistribution;
      
      if (isWater) {
        tierDistribution = [0.7, 0.9, 0.97, 0.99, 0.995, 1.0]; // Mostly small objects in water
      } else if (isPlain) {
        tierDistribution = [0.4, 0.7, 0.85, 0.95, 0.98, 1.0]; // Mix of sizes on plains
      } else if (isHills) {
        tierDistribution = [0.3, 0.5, 0.75, 0.9, 0.98, 1.0]; // More medium/large in hills
      } else { // Mountains
        tierDistribution = [0.2, 0.4, 0.6, 0.85, 0.95, 1.0]; // Larger objects on mountains
      }
      
      // Select tier based on distribution
      for (let t = 0; t < tierDistribution.length; t++) {
        if (tierRandom <= tierDistribution[t]) {
          tierIndex = t;
          break;
        }
      }
      
      const tier = CONFIG.OBJECTS.SIZE_TIERS[tierIndex];
      const minSize = tierIndex > 0 ? CONFIG.OBJECTS.SIZE_TIERS[tierIndex-1].max : CONFIG.OBJECTS.MIN_SIZE;
      const maxSize = tier.max;
      
      // Random scale within the tier's range
      const scale = minSize + seededRandom() * (maxSize - minSize);
      
      // Align rotation with terrain slope for larger objects
      let rotationX = 0, rotationZ = 0;
      
      if (tierIndex >= 3) { // For larger objects, align to terrain
        // Sample nearby points to determine slope
        const d = 1.0;
        const heightN = this.getHeightAt(posX, posZ - d);
        const heightS = this.getHeightAt(posX, posZ + d);
        const heightE = this.getHeightAt(posX + d, posZ);
        const heightW = this.getHeightAt(posX - d, posZ);
        
        // Calculate rotation to match terrain slope
        rotationX = Math.atan2(heightS - heightN, 2 * d);
        rotationZ = Math.atan2(heightW - heightE, 2 * d);
        
        // Limit extreme rotations
        rotationX = Math.max(Math.min(rotationX, Math.PI/8), -Math.PI/8);
        rotationZ = Math.max(Math.min(rotationZ, Math.PI/8), -Math.PI/8);
      }
      
      // Random Y rotation
      const rotationY = seededRandom() * Math.PI * 2;
      
      // Determine object type based on tier and terrain
      let typePool;
      if (tierIndex <= 1) { // Tiny/small objects
        if (isWater) {
          typePool = ['paperclip', 'coin', 'eraser', 'candy'];
        } else {
          typePool = ['paperclip', 'coin', 'pencil', 'eraser', 'thumbtack', 'candy'];
        }
      } else if (tierIndex <= 2) { // Medium objects
        if (isWater) {
          typePool = ['cup', 'plate', 'toy'];
        } else {
          typePool = ['book', 'cup', 'plate', 'phone', 'toy', 'plant'];
        }
      } else if (tierIndex <= 3) { // Large objects
        if (isWater) {
          typePool = ['box', 'trashcan'];
        } else if (isMountain) {
          typePool = ['chair', 'box', 'stool'];
        } else {
          typePool = ['chair', 'lamp', 'box', 'trashcan', 'stool', 'endtable'];
        }
      } else if (tierIndex <= 4) { // XL objects
        if (isWater) {
          typePool = ['mailbox'];
        } else if (isMountain) {
          typePool = ['bench', 'doghouse'];
        } else {
          typePool = ['desk', 'table', 'bicycle', 'mailbox', 'bench', 'doghouse'];
        }
      } else if (tierIndex <= 5) { // XXL objects
        if (isWater) {
          typePool = [];
        } else if (isMountain) {
          typePool = ['statue'];
        } else if (isPlain) {
          typePool = ['car', 'tree', 'streetlight', 'shed', 'statue', 'fountain'];
        } else {
          typePool = ['tree', 'statue'];
        }
      } else { // Huge objects
        if (isWater || isMountain) {
          typePool = [];
        } else if (isPlain) {
          typePool = ['house', 'building', 'skyscraper'];
        } else {
          typePool = ['house'];
        }
      }
      
      // Skip if no suitable types for this location
      if (typePool.length === 0) continue;
      
      // Select random type from the pool
      const type = typePool[Math.floor(seededRandom() * typePool.length)];
      
      // Create the object
      const position = new THREE.Vector3(posX, posY + scale * 0.5, posZ);
      const rotation = { x: rotationX, y: rotationY, z: rotationZ };
      const object = createObject(type, position, scale, rotation);
      
      if (object) {
        const objectData = {
          type,
          position: { x: position.x, y: position.y, z: position.z },
          scale,
          rotation,
          collected: false,
          collectable: tier.collectable
        };
        
        chunk.objects.push({
          mesh: object,
          data: objectData,
          collected: false
        });
        
        chunk.group.add(object);
      }
    }
    
    // Add instancing for similar objects if enabled
    if (CONFIG.PERFORMANCE.USE_INSTANCING) {
      this.applyInstancing(chunk);
    }
    
    // Store the chunk and add it to the scene
    this.chunks.set(key, chunk);
    this.scene.add(chunk.group);
    this.loadedChunks++;
    
    // Mark chunk for saving to database
    this.saveChunk(chunk);
    
    return chunk;
  }

  // Apply instanced rendering for similar objects
  applyInstancing(chunk) {
    // Group objects by type for instancing
    const instanceGroups = {};
    
    // First pass: categorize objects
    chunk.objects.forEach(obj => {
      if (!obj.data.collected) {
        const key = `${obj.data.type}_${Math.floor(obj.data.scale * 10)}`;
        if (!instanceGroups[key]) {
          instanceGroups[key] = {
            type: obj.data.type,
            baseScale: obj.data.scale,
            objects: []
          };
        }
        instanceGroups[key].objects.push(obj);
      }
    });
    
    // Only apply instancing to groups with multiple objects
    for (const key in instanceGroups) {
      const group = instanceGroups[key];
      if (group.objects.length <= 2) continue; // Skip small groups
      
      // Use the first object as template
      const template = group.objects[0].mesh;
      
      // Extract geometry
      const geometry = template.geometry.clone();
      
      // Create instanced mesh
      const instancedMesh = new THREE.InstancedMesh(
        geometry,
        template.material,
        group.objects.length
      );
      
      // Set transforms for each instance
      const matrix = new THREE.Matrix4();
      group.objects.forEach((obj, i) => {
        const mesh = obj.mesh;
        matrix.compose(
          mesh.position,
          mesh.quaternion,
          mesh.scale
        );
        instancedMesh.setMatrixAt(i, matrix);
        
        // Update object reference to use the instanced mesh
        obj.instanced = true;
        obj.instanceIndex = i;
      });
      
      // Add instanced mesh to chunk and remove individual meshes
      chunk.group.add(instancedMesh);
      group.objects.forEach(obj => {
        chunk.group.remove(obj.mesh);
      });
      
      // Store the instanced mesh in the chunk
      if (!chunk.instancedMeshes) chunk.instancedMeshes = [];
      chunk.instancedMeshes.push({
        mesh: instancedMesh,
        objects: group.objects
      });
    }
  }
  
  // Get or create chunk at specified coordinates
  getChunk(x, y, z) {
    const key = `${x},${y},${z}`;
    
    if (this.chunks.has(key)) {
      return this.chunks.get(key);
    } else {
      // Add to load queue if not already in progress
      if (!this.loadQueue.includes(key)) {
        this.loadQueue.push(key);
      }
      return null;
    }
  }
  
  // Save chunk to database
  async saveChunk(chunk) {
    // Only save if modified or new
    if (!chunk.modified && chunk.savedToDB) return;
    
    const chunkData = {
      x: chunk.x,
      y: chunk.y,
      z: chunk.z,
      objects: chunk.objects.map(obj => obj.data)
    };
    
    try {
      // Check if chunk already exists in database
      const existingChunks = await this.room.collection('chunk')
        .filter({ x: chunk.x, y: chunk.y, z: chunk.z })
        .getList();
      
      if (existingChunks.length > 0) {
        // Update existing chunk
        await this.room.collection('chunk').update(existingChunks[0].id, chunkData);
      } else {
        // Create new chunk
        await this.room.collection('chunk').create(chunkData);
      }
      
      chunk.modified = false;
      chunk.savedToDB = true;
      console.log(`Saved chunk ${chunk.x},${chunk.y},${chunk.z} to database`);
    } catch (error) {
      console.error('Error saving chunk:', error);
      // Add to save queue for retry
      this.saveQueue.push(chunk);
    }
  }
  
  // Mark an object as collected
  collectObject(object) {
    // Find the chunk and object
    for (const chunk of this.chunks.values()) {
      const objectEntry = chunk.objects.find(o => o.mesh === object);
      
      if (objectEntry && !objectEntry.collected) {
        // Mark as collected
        objectEntry.collected = true;
        objectEntry.data.collected = true;
        
        // Remove from scene
        chunk.group.remove(object);
        
        // Mark chunk as modified for saving
        chunk.modified = true;
        
        // Add to save queue
        if (!this.saveQueue.includes(chunk)) {
          this.saveQueue.push(chunk);
        }
        
        return objectEntry.data.collectable; // Return value for katamari growth
      }
    }
    
    return 0;
  }
  
  // Update chunks based on katamari position
  update() {
    if (!simplex) return;
    
    const position = this.katamari.getPosition();
    const chunkSize = CONFIG.WORLD.CHUNK_SIZE;
    const renderDistance = CONFIG.WORLD.RENDER_DISTANCE;
    
    // Calculate current chunk coordinates
    const centerX = Math.floor(position.x / chunkSize);
    const centerY = 0; // We're using a single layer of chunks for now
    const centerZ = Math.floor(position.z / chunkSize);
    
    // Use frustum culling if enabled
    let frustum;
    if (CONFIG.PERFORMANCE.FRUSTUM_CULLING) {
      const camera = this.katamari.camera;
      frustum = new THREE.Frustum();
      frustum.setFromProjectionMatrix(
        new THREE.Matrix4().multiplyMatrices(
          camera.projectionMatrix,
          camera.matrixWorldInverse
        )
      );
    }
    
    // Process load queue - prioritize nearby chunks
    if (this.loadQueue.length > 0) {
      // Sort load queue by distance to player
      this.loadQueue.sort((a, b) => {
        const [ax, ay, az] = a.split(',').map(Number);
        const [bx, by, bz] = b.split(',').map(Number);
        
        const distA = Math.sqrt(Math.pow(ax - centerX, 2) + Math.pow(az - centerZ, 2));
        const distB = Math.sqrt(Math.pow(bx - centerX, 2) + Math.pow(bz - centerZ, 2));
        
        return distA - distB;
      });
      
      const key = this.loadQueue.shift();
      const [x, y, z] = key.split(',').map(Number);
      
      // Try to load from database first
      const chunks = this.room.collection('chunk')
        .filter({ x, y, z })
        .getList();
      
      if (chunks && chunks.length > 0) {
        this.loadChunkFromData(chunks[0]);
      } else {
        this.generateChunk(x, y, z);
      }
    }
    
    // Process save queue
    if (this.saveQueue.length > 0) {
      const chunk = this.saveQueue.shift();
      this.saveChunk(chunk);
    }
    
    // Find chunks to load or unload
    for (let x = centerX - renderDistance; x <= centerX + renderDistance; x++) {
      for (let z = centerZ - renderDistance; z <= centerZ + renderDistance; z++) {
        const key = `${x},${centerY},${z}`;
        
        // Load chunks within render distance
        if (!this.chunks.has(key) && !this.loadQueue.includes(key)) {
          this.loadQueue.push(key);
        }
      }
    }
    
    // Apply frustum culling to chunk objects if enabled
    if (CONFIG.PERFORMANCE.FRUSTUM_CULLING && frustum) {
      for (const chunk of this.chunks.values()) {
        // First check if the whole chunk is visible
        const chunkCenterX = chunk.x * chunkSize + chunkSize / 2;
        const chunkCenterZ = chunk.z * chunkSize + chunkSize / 2;
        const chunkCenterY = this.getHeightAt(chunkCenterX, chunkCenterZ);
        
        const chunkSphere = new THREE.Sphere(
          new THREE.Vector3(chunkCenterX, chunkCenterY, chunkCenterZ),
          chunkSize * Math.SQRT2 / 2
        );
        
        // Skip detailed culling if whole chunk is outside frustum
        if (!frustum.intersectsSphere(chunkSphere)) {
          chunk.group.visible = false;
          continue;
        }
        
        // Show the chunk
        chunk.group.visible = true;
        
        // Detailed culling for large objects
        chunk.objects.forEach(obj => {
          if (obj.instanced) return; // Skip instanced objects
          if (obj.collected) return; // Skip collected objects
          
          const mesh = obj.mesh;
          if (!mesh) return;
          
          // For larger objects, do detailed culling
          if (obj.data.scale > 5) {
            const objectSphere = new THREE.Sphere(
              mesh.position.clone(),
              obj.data.scale * 1.5
            );
            
            mesh.visible = frustum.intersectsSphere(objectSphere);
          }
        });
      }
    }
    
    // Unload chunks outside render distance
    for (const [key, chunk] of this.chunks.entries()) {
      const dx = Math.abs(chunk.x - centerX);
      const dz = Math.abs(chunk.z - centerZ);
      
      if (dx > renderDistance + 1 || dz > renderDistance + 1) {
        // Save chunk before unloading if modified
        if (chunk.modified) {
          this.saveChunk(chunk);
        }
        
        // Remove from scene and delete
        this.scene.remove(chunk.group);
        this.chunks.delete(key);
        this.loadedChunks--;
      }
    }
  }
}