import * as THREE from 'https://unpkg.com/three@0.149.0/build/three.module.js';
import { CONFIG } from './config.js';
import { ChunkSystem } from './chunksystem.js';
import { Katamari } from './katamari.js';
import { PhysicsSystem } from './physicssystem.js';

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

// Initialize physics system
const physics = new PhysicsSystem();

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

let cameraTargetPosition = new THREE.Vector3(0, 0, 0);

// Global lastTime variable for delta time calculation
let lastTime = performance.now();

// Main update loop
function update() {
  // Calculate delta time for physics simulation
  const now = performance.now();
  const deltaTime = Math.min((now - (lastTime || now)) / 1000, 0.1); // Cap at 0.1s to prevent large jumps
  lastTime = now;
  
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
  moveDirection.normalize();
  
  // Calculate momentum-based velocity
  const currentSpeed = new THREE.Vector3(katamari.velocity.x, 0, katamari.velocity.z).length();
  const targetSpeed = moveDirection.length() > 0 ? 
                    CONFIG.KATAMARI.ROLL_SPEED * (1.0 / Math.sqrt(katamari.size)) : 0;
  
  // Smooth acceleration and deceleration
  let newSpeed;
  if (moveDirection.length() > 0) {
    // Accelerate
    newSpeed = currentSpeed + (targetSpeed - currentSpeed) * 0.1;
    
    // Blend current direction with input direction for smoother turning
    const currentDir = new THREE.Vector3(katamari.velocity.x, 0, katamari.velocity.z).normalize();
    const turnSpeed = CONFIG.KATAMARI.TURN_SPEED * (1.0 / Math.sqrt(katamari.size));
    
    if (currentDir.length() > 0) {
      moveDirection.lerp(currentDir, 1 - turnSpeed);
      moveDirection.normalize();
    }
  } else {
    // Decelerate with friction
    newSpeed = currentSpeed * CONFIG.KATAMARI.ROLL_MOMENTUM;
  }
  
  // Apply movement to katamari
  if (moveDirection.length() > 0) {
    katamari.velocity.x = moveDirection.x * newSpeed;
    katamari.velocity.z = moveDirection.z * newSpeed;
  } else if (katamari.velocity.length() > 0.01) {
    // Maintain direction when decelerating
    const currentDir = new THREE.Vector3(katamari.velocity.x, 0, katamari.velocity.z).normalize();
    katamari.velocity.x = currentDir.x * newSpeed;
    katamari.velocity.z = currentDir.z * newSpeed;
  } else {
    // Stop completely if very slow
    katamari.velocity.x = 0;
    katamari.velocity.z = 0;
  }
  
  // Apply jumping
  if (jump && katamari.isGrounded) {
    // Jump force reduced with size 
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
  
  // Improved ground collision with slope handling
  const groundHeight = chunkSystem.getHeightAt(katamari.position.x, katamari.position.z);
  
  if (katamari.position.y - katamari.size <= groundHeight) {
    // Set position at correct height
    katamari.position.y = groundHeight + katamari.size;
    
    // Only zero vertical velocity if falling
    if (katamari.velocity.y < 0) {
      katamari.velocity.y = 0;
    }
    
    // Handle slopes - calculate the normal of the terrain
    const slopeX = chunkSystem.getHeightAt(katamari.position.x + 1, katamari.position.z) - 
                  chunkSystem.getHeightAt(katamari.position.x - 1, katamari.position.z);
    const slopeZ = chunkSystem.getHeightAt(katamari.position.x, katamari.position.z + 1) - 
                  chunkSystem.getHeightAt(katamari.position.x, katamari.position.z - 1);
    
    // Apply slope forces - roll downhill
    if (Math.abs(slopeX) > 0.1 || Math.abs(slopeZ) > 0.1) {
      const slopeForce = 0.002 * katamari.size;
      katamari.velocity.x += slopeX * slopeForce;
      katamari.velocity.z += slopeZ * slopeForce;
    }
    
    katamari.isGrounded = true;
  }
  
  // Apply friction
  if (katamari.isGrounded) {
    katamari.velocity.x *= CONFIG.PHYSICS.FRICTION;
    katamari.velocity.z *= CONFIG.PHYSICS.FRICTION;
  }
  
  // Check for collisions with objects
  checkCollisions();
  
  // Apply physics to all objects in the scene
  scene.traverse((object) => {
    if (object.userData && object.userData.collectable && !object.userData.collected) {
      // Get height at object position
      const heightAtPosition = chunkSystem.getHeightAt(object.position.x, object.position.z);
      
      // Apply gravity physics to objects
      physics.applyGravity(object, heightAtPosition, deltaTime);
      
      // Apply slope physics for rolling objects
      if (object.userData.isGrounded) {
        // Calculate the normal of the terrain
        const slopeX = chunkSystem.getHeightAt(object.position.x + 1, object.position.z) - 
                      chunkSystem.getHeightAt(object.position.x - 1, object.position.z);
        const slopeZ = chunkSystem.getHeightAt(object.position.x, object.position.z + 1) - 
                      chunkSystem.getHeightAt(object.position.x, object.position.z - 1);
        
        // Apply slope forces for round objects
        if ((Math.abs(slopeX) > 0.2 || Math.abs(slopeZ) > 0.2) && 
            object.userData.type && 
            ['ball', 'coin', 'paperclip'].includes(object.userData.type)) {
          
          const slopeForce = 0.5 * deltaTime;
          object.userData.velocity.x += slopeX * slopeForce;
          object.userData.velocity.z += slopeZ * slopeForce;
          object.userData.isGrounded = false;
        }
      }
      
      // Apply velocity
      object.position.x += object.userData.velocity.x * deltaTime;
      object.position.z += object.userData.velocity.z * deltaTime;
    }
  });
  
  // Update katamari and chunk system
  katamari.update();
  chunkSystem.update();
  
  // Track camera target position for smoother following
  cameraTargetPosition.lerp(katamari.position, 0.1);
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  update();
  renderer.render(scene, camera);
}

// Start the animation loop
animate();