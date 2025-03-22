import * as THREE from 'three';
import { CONFIG } from './config.js';
import { PhysicsSystem } from './physics.js';

export class Katamari {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.object = null;
    this.size = CONFIG.KATAMARI.START_SIZE;
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.position = new THREE.Vector3(0, 5, 0); // Start slightly above ground
    this.rotation = new THREE.Vector3(0, 0, 0);
    this.isGrounded = false;
    this.objectsCollected = 0;
    this.collectedObjects = [];
    this.createKatamari();
    
    // For keyboard controls
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.jump = false;
    
    // Camera values
    this.cameraDistance = CONFIG.KATAMARI.CAMERA_DISTANCE;
    this.cameraHeight = CONFIG.KATAMARI.CAMERA_HEIGHT;
    this.cameraLookAt = new THREE.Vector3();
    
    // Set up physics
    this.physics = new PhysicsSystem();
    
    // Set up UI
    this.updateUI();
  }
  
  createKatamari() {
    // Create the basic katamari ball
    const geometry = new THREE.SphereGeometry(this.size, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0x22CC22,
      roughness: 0.7,
      metalness: 0.2
    });
    
    this.object = new THREE.Mesh(geometry, material);
    this.object.castShadow = true;
    this.object.receiveShadow = true;
    this.object.userData.isKatamari = true;
    
    // Create "antenna" decorations
    const antennaGeometry = new THREE.CylinderGeometry(0.05 * this.size, 0.05 * this.size, 1.5 * this.size, 8);
    const antennaMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF5555,
      roughness: 0.7
    });
    
    const antenna1 = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna1.position.set(0, this.size, 0);
    antenna1.rotation.x = Math.PI / 6;
    antenna1.rotation.z = Math.PI / 6;
    this.object.add(antenna1);
    
    const antenna2 = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna2.position.set(0, this.size, 0);
    antenna2.rotation.x = -Math.PI / 6;
    antenna2.rotation.z = -Math.PI / 6;
    this.object.add(antenna2);
    
    // Add ball decorations
    const dotGeometry = new THREE.SphereGeometry(0.1 * this.size, 8, 8);
    const dotMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFF00,
      roughness: 0.5
    });
    
    // Add dots randomly over the surface
    for (let i = 0; i < 12; i++) {
      const dot = new THREE.Mesh(dotGeometry, dotMaterial);
      
      // Calculate random positions on sphere surface
      const phi = Math.acos(-1 + (2 * Math.random()));
      const theta = 2 * Math.PI * Math.random();
      
      dot.position.x = this.size * Math.sin(phi) * Math.cos(theta);
      dot.position.y = this.size * Math.sin(phi) * Math.sin(theta);
      dot.position.z = this.size * Math.cos(phi);
      
      this.object.add(dot);
    }
    
    // Position the ball
    this.object.position.copy(this.position);
    
    // Add to scene
    this.scene.add(this.object);
  }
  
  updateKatamari() {
    if (!this.object) return;
    
    // Update size
    this.object.scale.set(this.size / CONFIG.KATAMARI.START_SIZE, this.size / CONFIG.KATAMARI.START_SIZE, this.size / CONFIG.KATAMARI.START_SIZE);
    
    // Update position
    this.object.position.copy(this.position);
    
    // Rotate based on movement
    if (this.velocity.length() > 0.1) {
      const movementAxis = new THREE.Vector3(-this.velocity.z, 0, this.velocity.x).normalize();
      const angle = this.velocity.length() * 0.1;
      this.object.rotateOnAxis(movementAxis, angle);
    }
    
    // Update camera position and target
    this.updateCamera();
    
    // Update UI
    this.updateUI();
  }
  
  updateCamera() {
    const cameraDistance = this.cameraDistance * (this.size / CONFIG.KATAMARI.START_SIZE);
    const cameraHeight = this.cameraHeight * (this.size / CONFIG.KATAMARI.START_SIZE);
    
    // Calculate camera position
    const cameraDirection = new THREE.Vector3(0, 0, -1);
    cameraDirection.applyQuaternion(this.camera.quaternion);
    cameraDirection.y = 0; // Keep camera level horizontally
    cameraDirection.normalize();
    
    // Position camera behind the katamari
    const cameraPosition = new THREE.Vector3()
      .copy(this.position)
      .sub(cameraDirection.multiplyScalar(cameraDistance))
      .add(new THREE.Vector3(0, cameraHeight, 0));
    
    this.camera.position.copy(cameraPosition);
    
    // Look at the katamari
    this.cameraLookAt.copy(this.position);
    this.camera.lookAt(this.cameraLookAt);
  }
  
  update

