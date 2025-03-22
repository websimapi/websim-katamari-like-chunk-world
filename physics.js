import * as THREE from 'https://unpkg.com/three@0.149.0/build/three.module.js';
import { CONFIG } from './config.js';

export class PhysicsSystem {
  constructor() {
    this.gravity = CONFIG.PHYSICS.GRAVITY;
    this.friction = CONFIG.PHYSICS.FRICTION;
    this.bounce = CONFIG.PHYSICS.BOUNCE;
    this.step = CONFIG.PHYSICS.SIMULATION_STEP;
  }
  
  // Apply gravity to an object
  applyGravity(object, height, deltaTime) {
    if (!object.userData.velocity) {
      object.userData.velocity = new THREE.Vector3(0, 0, 0);
      object.userData.isGrounded = false;
    }
    
    // Apply gravity if not grounded
    if (!object.userData.isGrounded) {
      object.userData.velocity.y -= this.gravity * deltaTime;
      object.position.y += object.userData.velocity.y * deltaTime;
    }
    
    // Check ground collision
    const objectHeight = object.position.y - (object.userData.scale || 1) * 0.5;
    if (objectHeight <= height) {
      // Place on ground
      object.position.y = height + (object.userData.scale || 1) * 0.5;
      
      // Only bounce if falling with enough velocity
      if (object.userData.velocity.y < -1) {
        object.userData.velocity.y = -object.userData.velocity.y * this.bounce;
      } else {
        object.userData.velocity.y = 0;
        object.userData.isGrounded = true;
      }
    }
    
    // Apply friction if grounded
    if (object.userData.isGrounded) {
      object.userData.velocity.x *= this.friction;
      object.userData.velocity.z *= this.friction;
    }
    
    return object.userData.isGrounded;
  }
}