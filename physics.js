import * as THREE from 'https://unpkg.com/three@0.149.0/build/three.module.js';
import { CONFIG } from './config.js';

export class PhysicsSystem {
  constructor() {
    this.gravity = CONFIG.PHYSICS.GRAVITY;
    this.friction = CONFIG.PHYSICS.FRICTION;
    this.bounce = CONFIG.PHYSICS.BOUNCE;
    this.step = CONFIG.PHYSICS.SIMULATION_STEP;
  }
  
  // Add more physics methods as needed
}
