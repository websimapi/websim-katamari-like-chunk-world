export const CONFIG = {
  // World generation settings
  WORLD: {
    CHUNK_SIZE: 50,           // Size of each chunk
    RENDER_DISTANCE: 3,       // Number of chunks to render in each direction
    MAX_HEIGHT: 100,          // Maximum terrain height
    SEED: 12345,              // Seed for random generation
  },
  
  // Katamari settings
  KATAMARI: {
    START_SIZE: 1.0,          // Starting size of the katamari
    GROWTH_FACTOR: 0.05,      // How much the katamari grows per object
    MAX_SIZE: 50.0,           // Maximum size the katamari can grow to
    ROLL_SPEED: 0.5,          // Base rolling speed
    CAMERA_DISTANCE: 10,      // Distance of camera from katamari
    CAMERA_HEIGHT: 5,         // Height of camera above katamari
    JUMP_FORCE: 10,           // Force applied when jumping
    GRAVITY: 20,              // Gravity strength
  },
  
  // Object settings
  OBJECTS: {
    MIN_SIZE: 0.2,            // Smallest objects (paper clips, etc)
    MAX_SIZE: 200,            // Largest objects (skyscrapers)
    DENSITY: 0.8,             // Object density in chunks (0-1)
    SIZE_TIERS: [
      { max: 0.5, collectable: 0.1 },   // Tiny (paperclips, thumbtacks)
      { max: 1.0, collectable: 0.3 },   // Small (cups, books)
      { max: 2.0, collectable: 0.5 },   // Medium (chairs, plants)
      { max: 5.0, collectable: 0.7 },   // Large (desks, bicycles)
      { max: 10.0, collectable: 1.5 },  // XL (cars, trees)
      { max: 30.0, collectable: 3.0 },  // XXL (buses, small buildings)
      { max: 200.0, collectable: 8.0 }, // Huge (skyscrapers)
    ],
  },

  // Physics settings
  PHYSICS: {
    GRAVITY: 9.8,             // Gravity force
    FRICTION: 0.95,           // Surface friction
    BOUNCE: 0.3,              // Bounciness factor
    SIMULATION_STEP: 1/60,    // Physics simulation step size
  },
  
  // Performance settings
  PERFORMANCE: {
    USE_INSTANCING: true,     // Use instanced meshes for similar objects
    LOD_DISTANCES: [50, 100, 200], // Distances for level of detail changes
    CULLING_DISTANCE: 300,    // Distance at which to cull objects
  }
};

