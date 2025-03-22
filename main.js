import * as THREE from 'https://unpkg.com/three@0.149.0/build/three.module.js';
import { CONFIG } from './config.js';
import { ChunkSystem } from './chunksystem.js';
import { Katamari } from './katamari.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue background

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 20);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
directionalLight.position.set(100, 100, 50);
directionalLight.castShadow = true;
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Initialize katamari
const katamari = new Katamari(scene, camera);

// Initialize chunk system
const chunkSystem = new ChunkSystem(scene, katamari);

// Setup controls
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let jump = false;

// Event listeners for keyboard controls
document.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'KeyW': moveForward = true; break;
    case 'KeyS': moveBackward = true; break;
    case 'KeyA': moveLeft = true; break;
    case 'KeyD': moveRight = true; break;
    case 'Space': jump = true; break;
  }
});

document.addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'KeyW': moveForward = false; break;
    case 'KeyS': moveBackward = false; break;
    case 'KeyA': moveLeft = false; break;
    case 'KeyD': moveRight = false; break;
    case 'Space': jump = false; break;
  }
});

// Mouse movement for camera control
document.addEventListener('mousemove', (event) => {
  if (document.pointerLockElement === document.body) {
    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;
    
    // Rotate camera based on mouse movement
    const rotationSpeed = 0.002;
    camera.rotation.y -= movementX * rotationSpeed;
    
    // Limit vertical camera rotation
    const verticalRotation = camera.rotation.x - movementY * rotationSpeed;
    camera.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, verticalRotation));
  }
});

// Pointer lock for mouse controls
renderer.domElement.addEventListener('click', () => {
  document.body.requestPointerLock();
});

// Window resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Collision detection for katamari with objects
function checkCollisions() {
  // Get all objects in the scene
  scene.traverse((object) => {
    if (object.userData && object.userData.collectable && !object.userData.collected) {
      const katamariPos = katamari.getPosition();
      const objectPos = object.position;
      
      // Calculate distance between katamari and object
      const dx = katamariPos.x - objectPos.x;
      const dy = katamariPos.y - objectPos.y;
      const dz = katamariPos.z - objectPos.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      // Check if within collection range based on sizes
      const collectionRange = katamari.size + object.userData.scale * 0.5;
      
      if (distance < collectionRange) {
        // Only collect if katamari is big enough (at least 30% of object size)
        if (katamari.size >= object.userData.scale * 0.3) {
          // Collect the object
          const growthAmount = chunkSystem.collectObject(object);
          
          // Grow the katamari
          if (growthAmount > 0) {
            katamari.size += growthAmount * CONFIG.KATAMARI.GROWTH_FACTOR;
            katamari.size = Math.min(katamari.size, CONFIG.KATAMARI.MAX_SIZE);
            
            // Scale the katamari mesh
            katamari.object.scale.set(katamari.size, katamari.size, katamari.size);
            
            // Increment the counter
            katamari.objectsCollected++;
          }
        }
      }
    }
  });
}

// Main update loop
function update() {
  // Calculate move direction based on camera orientation
  const moveDirection = new THREE.Vector3(0, 0, 0);
  
  if (moveForward) {
    moveDirection.z -= 1;
  }
  if (moveBackward) {
    moveDirection.z += 1;
  }
  if (moveLeft) {
    moveDirection.x -= 1;
  }
  if (moveRight) {
    moveDirection.x += 1;
  }
  
  // Normalize direction vector
  if (moveDirection.length() > 0) {
    moveDirection.normalize();
  }
  
  // Apply camera rotation to movement direction
  moveDirection.applyQuaternion(camera.quaternion);
  moveDirection.y = 0; // Keep movement in horizontal plane
  
  // Apply movement to katamari
  const moveSpeed = CONFIG.KATAMARI.ROLL_SPEED * (1.0 / Math.sqrt(katamari.size)); // Bigger katamari moves slower
  
  katamari.velocity.x = moveDirection.x * moveSpeed;
  katamari.velocity.z = moveDirection.z * moveSpeed;
  
  // Apply jumping
  if (jump && katamari.isGrounded) {
    katamari.velocity.y = CONFIG.KATAMARI.JUMP_FORCE * (1.0 / Math.sqrt(katamari.size));
    katamari.isGrounded = false;
  }
  
  // Apply gravity
  if (!katamari.isGrounded) {
    katamari.velocity.y -= CONFIG.KATAMARI.GRAVITY * 0.01;
  }
  
  // Update position
  katamari.position.x += katamari.velocity.x;
  katamari.position.y += katamari.velocity.y;
  katamari.position.z += katamari.velocity.z;
  
  // Simple ground collision
  const groundHeight = chunkSystem.getHeightAt(katamari.position.x, katamari.position.z);
  if (katamari.position.y - katamari.size <= groundHeight) {
    katamari.position.y = groundHeight + katamari.size;
    katamari.velocity.y = 0;
    katamari.isGrounded = true;
  }
  
  // Apply friction
  if (katamari.isGrounded) {
    katamari.velocity.x *= CONFIG.PHYSICS.FRICTION;
    katamari.velocity.z *= CONFIG.PHYSICS.FRICTION;
  }
  
  // Check for collisions with objects
  checkCollisions();
  
  // Update katamari and chunk system
  katamari.update();
  chunkSystem.update();
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  update();
  renderer.render(scene, camera);
}

// Start the animation loop
animate();