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
    const groundGeometry = new THREE.PlaneGeometry(2000, 2000, 50, 50);
    groundGeometry.rotateX(-Math.PI / 2);
    
    // Apply height displacement to vertices based on noise
    const vertices = groundGeometry.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i);
      const z = vertices.getZ(i);
      const height = this.getHeightAt(x, z) * 0.5; // Smoother ground
      vertices.setY(i, height);
    }
    
    groundGeometry.computeVertexNormals();
    
    // Ground material with simple terrain texture
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a7335,
      roughness: 0.9,
      metalness: 0.0,
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.receiveShadow = true;
    ground.name = "ground";
    this.scene.add(ground);
  }
  
  // Get height at a specific world coordinate
  getHeightAt(x, z) {
    if (!simplex) return 0;
    
    // Use multiple octaves of noise for more natural terrain
    const scale1 = 0.01;
    const scale2 = 0.05;
    const scale3 = 0.2;
    
    const y1 = simplex.noise2D(x * scale1, z * scale1) * 0.5 + 0.5;
    const y2 = simplex.noise2D(x * scale2, z * scale2) * 0.25 + 0.25;
    const y3 = simplex.noise2D(x * scale3, z * scale3) * 0.125 + 0.125;
    
    return (y1 + y2 + y3) * CONFIG.WORLD.MAX_HEIGHT;
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
    const random = new Math.seedrandom(chunkSeed.toString());
    
    // Determine number of objects to create in this chunk
    const baseObjectCount = Math.floor(random() * 15) + 5;
    const objectCount = Math.min(30, baseObjectCount);
    
    // Generate objects for the chunk
    for (let i = 0; i < objectCount; i++) {
      // Random position within chunk
      const posX = x * chunkSize + random() * chunkSize;
      const posZ = z * chunkSize + random() * chunkSize;
      const posY = this.getHeightAt(posX, posZ);
      
      // Determine object size tier
      const tierRandom = random();
      let tierIndex = 0;
      
      // Weighted size distribution - more small objects, fewer large ones
      if (tierRandom > 0.98) tierIndex = 6;      // Huge (0.5%)
      else if (tierRandom > 0.95) tierIndex = 5; // XXL (3%)
      else if (tierRandom > 0.90) tierIndex = 4; // XL (5%)
      else if (tierRandom > 0.80) tierIndex = 3; // Large (10%)
      else if (tierRandom > 0.65) tierIndex = 2; // Medium (15%)
      else if (tierRandom > 0.35) tierIndex = 1; // Small (30%)
      else tierIndex = 0;                        // Tiny (35%)
      
      const tier = CONFIG.OBJECTS.SIZE_TIERS[tierIndex];
      const minSize = tierIndex > 0 ? CONFIG.OBJECTS.SIZE_TIERS[tierIndex-1].max : CONFIG.OBJECTS.MIN_SIZE;
      const maxSize = tier.max;
      
      // Random scale within the tier's range
      const scale = minSize + random() * (maxSize - minSize);
      
      // Random rotation
      const rotation = {
        x: random() * Math.PI * 2,
        y: random() * Math.PI * 2,
        z: random() * Math.PI * 2
      };
      
      // Determine object type based on size
      let type;
      if (tierIndex <= 1) {
        type = ['paperclip', 'coin', 'pencil', 'eraser', 'thumbtack', 'candy'][Math.floor(random() * 6)];
      } else if (tierIndex <= 2) {
        type = ['book', 'cup', 'plate', 'phone', 'toy', 'plant'][Math.floor(random() * 6)];
      } else if (tierIndex <= 3) {
        type = ['chair', 'lamp', 'box', 'trashcan', 'stool', 'endtable'][Math.floor(random() * 6)];
      } else if (tierIndex <= 4) {
        type = ['desk', 'table', 'bicycle', 'mailbox', 'bench', 'doghouse'][Math.floor(random() * 6)];
      } else if (tierIndex <= 5) {
        type = ['car', 'tree', 'streetlight', 'shed', 'statue', 'fountain'][Math.floor(random() * 6)];
      } else {
        type = ['house', 'building', 'skyscraper'][Math.floor(random() * 3)];
      }
      
      // Create the object
      const position = new THREE.Vector3(posX, posY + scale * 0.5, posZ);
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
    
    // Store the chunk and add it to the scene
    this.chunks.set(key, chunk);
    this.scene.add(chunk.group);
    this.loadedChunks++;
    
    // Mark chunk for saving to database
    this.saveChunk(chunk);
    
    return chunk;
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
    
    // Process load queue
    if (this.loadQueue.length > 0) {
      const key = this.loadQueue.shift();
      const [x, y, z] = key.split(',').map(Number);
      
      // Try to load from database first
      this.room.collection('chunk')
        .filter({ x, y, z })
        .getList()
        .then(chunks => {
          if (chunks.length > 0) {
            this.loadChunkFromData(chunks[0]);
          } else {
            this.generateChunk(x, y, z);
          }
        })
        .catch(error => {
          console.error('Error loading chunk from database:', error);
          this.generateChunk(x, y, z);
        });
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