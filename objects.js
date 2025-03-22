import * as THREE from 'https://unpkg.com/three@0.149.0/build/three.module.js';
import { CONFIG } from './config.js';

// Object cache for geometry reuse
const geometryCache = {};
const materialCache = {};

// Object instance pools for better performance
const instancedMeshes = new Map();

// Create object of specified type at position with scale
export function createObject(type, position, scale, rotation) {
  // Choose the appropriate creation method based on type
  let mesh;
  
  switch (type) {
    // Tiny objects (paperclips, coins, etc.)
    case 'paperclip':
      mesh = createPaperclip(scale);
      break;
    case 'coin':
      mesh = createCoin(scale);
      break;
    case 'pencil':
      mesh = createPencil(scale);
      break;
    case 'eraser':
      mesh = createEraser(scale);
      break;
    case 'thumbtack':
      mesh = createThumbtack(scale);
      break;
    case 'candy':
      mesh = createCandy(scale);
      break;
    
    // Small objects (cups, books, etc.)
    case 'book':
      mesh = createBook(scale);
      break;
    case 'cup':
      mesh = createCup(scale);
      break;
    case 'plate':
      mesh = createPlate(scale);
      break;
    case 'phone':
      mesh = createPhone(scale);
      break;
    case 'toy':
      mesh = createToy(scale);
      break;
    case 'plant':
      mesh = createPlant(scale);
      break;
    
    // Medium objects (chairs, lamps, etc.)
    case 'chair':
      mesh = createChair(scale);
      break;
    case 'lamp':
      mesh = createLamp(scale);
      break;
    case 'box':
      mesh = createBox(scale);
      break;
    case 'trashcan':
      mesh = createTrashcan(scale);
      break;
    case 'stool':
      mesh = createStool(scale);
      break;
    case 'endtable':
      mesh = createEndtable(scale);
      break;
    
    // Large objects (desks, bicycles, etc.)
    case 'desk':
      mesh = createDesk(scale);
      break;
    case 'table':
      mesh = createTable(scale);
      break;
    case 'bicycle':
      mesh = createBicycle(scale);
      break;
    case 'mailbox':
      mesh = createMailbox(scale);
      break;
    case 'bench':
      mesh = createBench(scale);
      break;
    case 'doghouse':
      mesh = createDoghouse(scale);
      break;
    
    // XL objects (cars, trees, etc.)
    case 'car':
      mesh = createCar(scale);
      break;
    case 'tree':
      mesh = createTree(scale);
      break;
    case 'streetlight':
      mesh = createStreetlight(scale);
      break;
    case 'shed':
      mesh = createShed(scale);
      break;
    case 'statue':
      mesh = createStatue(scale);
      break;
    case 'fountain':
      mesh = createFountain(scale);
      break;
    
    // XXL objects (houses, buildings, etc.)
    case 'house':
      mesh = createHouse(scale);
      break;
    case 'building':
      mesh = createBuilding(scale);
      break;
    case 'skyscraper':
      mesh = createSkyscraper(scale);
      break;
    
    // Default fallback
    default:
      mesh = createGenericObject(scale);
  }
  
  if (mesh) {
    // Set position
    mesh.position.copy(position);
    
    // Apply rotation
    if (rotation) {
      mesh.rotation.x = rotation.x;
      mesh.rotation.y = rotation.y;
      mesh.rotation.z = rotation.z;
    }
    
    // Add metadata for collision detection and physics
    mesh.userData = {
      type,
      scale,
      collectable: true,
      originalPosition: position.clone(),
      originalRotation: new THREE.Euler(
        rotation ? rotation.x : 0,
        rotation ? rotation.y : 0,
        rotation ? rotation.z : 0
      ),
      velocity: new THREE.Vector3(0, 0, 0),
      isGrounded: true
    };
    
    // Add shadow casting/receiving
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  }
  
  return mesh;
}

// Helper to get cached geometry
function getGeometry(key, createFunc) {
  if (!geometryCache[key]) {
    geometryCache[key] = createFunc();
  }
  return geometryCache[key];
}

// Helper to get cached material
function getMaterial(key, params) {
  if (!materialCache[key]) {
    materialCache[key] = new THREE.MeshStandardMaterial(params);
  }
  return materialCache[key];
}

// Create a lower detail version of geometry for LOD
function createSimplifiedGeometry(geometry, detail) {
  // For now, just return the original - we can improve later
  return geometry;
}

// Generic object for fallback
function createGenericObject(scale) {
  const geometry = getGeometry('cube', () => new THREE.BoxGeometry(1, 1, 1));
  const material = getMaterial('generic', { color: 0xffffff * Math.random() });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.set(scale, scale, scale);
  return mesh;
}

// ---------- TINY OBJECTS ----------

function createPaperclip(scale) {
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0.5, 0),
    new THREE.Vector3(0.3, 0.5, 0),
    new THREE.Vector3(0.3, 0, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.3, 0, 0),
    new THREE.Vector3(-0.3, 0.5, 0),
    new THREE.Vector3(0, 0.5, 0)
  ]);

  const geometry = getGeometry('paperclip', () => new THREE.TubeGeometry(path, 32, 0.03, 8, false));

  const material = getMaterial('metal', { color: 0xcccccc, metalness: 0.8, roughness: 0.2 });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.set(scale, scale, scale);
  return mesh;
}

function createCoin(scale) {
  const geometry = getGeometry('coin', () => {
    const coinGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.05, 32);
    return coinGeo;
  });

  const material = getMaterial('coin', { color: 0xd4af37, metalness: 1.0, roughness: 0.3 });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI / 2; 
  mesh.scale.set(scale, scale, scale);
  return mesh;
}

function createPencil(scale) {
  const group = new THREE.Group();

  const bodyGeometry = getGeometry('pencilBody', () => new THREE.CylinderGeometry(0.1, 0.1, 1, 6));

  const bodyMaterial = getMaterial('pencilBody', { color: 0xffdd00, roughness: 0.8 });

  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.5;
  group.add(body);

  const tipGeometry = getGeometry('pencilTip', () => new THREE.ConeGeometry(0.1, 0.2, 6));

  const tipMaterial = getMaterial('pencilTip', { color: 0x333333, roughness: 0.7 });

  const tip = new THREE.Mesh(tipGeometry, tipMaterial);
  tip.position.y = 0;
  group.add(tip);

  group.rotation.z = Math.PI / 2; 
  group.scale.set(scale, scale, scale);
  return group;
}

function createEraser(scale) {
  const geometry = getGeometry('eraser', () => new THREE.BoxGeometry(0.6, 0.2, 0.3));

  const material = getMaterial('eraser', { color: 0xff9999, roughness: 0.9 });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.set(scale, scale, scale);
  return mesh;
}

function createThumbtack(scale) {
  const group = new THREE.Group();

  const headGeometry = getGeometry('tackHead', () => new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16));

  const headMaterial = getMaterial('tackHead', { color: 0xff0000, roughness: 0.5 });

  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 0.05;
  group.add(head);

  const pointGeometry = getGeometry('tackPoint', () => new THREE.ConeGeometry(0.05, 0.3, 8));

  const pointMaterial = getMaterial('tackPoint', { color: 0xcccccc, metalness: 0.8, roughness: 0.2 });

  const point = new THREE.Mesh(pointGeometry, pointMaterial);
  point.position.y = -0.1;
  point.rotation.x = Math.PI; 
  group.add(point);

  group.scale.set(scale, scale, scale);
  return group;
}

function createCandy(scale) {
  const group = new THREE.Group();

  const centerGeometry = getGeometry('candyCenter', () => new THREE.SphereGeometry(0.2, 16, 16));

  const centerMaterial = getMaterial('candy', { color: Math.random() > 0.5 ? 0xff0000 : 0x00ff00, roughness: 0.2 });

  const center = new THREE.Mesh(centerGeometry, centerMaterial);
  group.add(center);

  const wrapperGeometry = getGeometry('wrapper', () => new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8));

  const wrapperMaterial = getMaterial('wrapper', { color: 0xffffff, roughness: 0.8 });

  const wrapper1 = new THREE.Mesh(wrapperGeometry, wrapperMaterial);
  wrapper1.position.x = 0.3;
  wrapper1.rotation.z = Math.PI / 2; 
  group.add(wrapper1);

  const wrapper2 = new THREE.Mesh(wrapperGeometry, wrapperMaterial);
  wrapper2.position.x = -0.3;
  wrapper2.rotation.z = Math.PI / 2; 
  group.add(wrapper2);

  group.scale.set(scale, scale, scale);
  return group;
}

// ---------- SMALL OBJECTS ----------

function createBook(scale) {
  const group = new THREE.Group();

  const bodyGeometry = getGeometry('bookBody', () => new THREE.BoxGeometry(0.8, 0.1, 1.2));

  const bodyMaterial = getMaterial('bookCover', { color: [0x8B4513, 0x654321, 0x8B0000, 0x006400, 0x00008B][Math.floor(Math.random() * 5)], roughness: 0.9 });

  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  group.add(body);

  const pagesGeometry = getGeometry('bookPages', () => new THREE.BoxGeometry(0.75, 0.08, 1.15));

  const pagesMaterial = getMaterial('bookPages', { color: 0xf5f5dc, roughness: 1.0 });

  const pages = new THREE.Mesh(pagesGeometry, pagesMaterial);
  pages.position.y = 0.01;
  group.add(pages);

  group.scale.set(scale, scale, scale);
  return group;
}

function createCup(scale) {
  const group = new THREE.Group();

  const bodyGeometry = getGeometry('cupBody', () => {
    const cupGeo = new THREE.CylinderGeometry(0.4, 0.3, 0.8, 16, 1, false);
    return cupGeo;
  });

  const bodyMaterial = getMaterial('cup', { color: [0xffffff, 0xffcccc, 0xccffcc, 0xccccff][Math.floor(Math.random() * 4)], roughness: 0.3 });

  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  group.add(body);

  const handlePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.4, 0.2, 0),
    new THREE.Vector3(0.6, 0.2, 0),
    new THREE.Vector3(0.6, -0.2, 0),
    new THREE.Vector3(0.4, -0.2, 0),
  ]);

  const handleGeometry = getGeometry('cupHandle', () => new THREE.TubeGeometry(handlePath, 16, 0.05, 8, false));

  const handle = new THREE.Mesh(handleGeometry, bodyMaterial);
  group.add(handle);

  group.scale.set(scale, scale, scale);
  return group;
}

function createPlate(scale) {
  const geometry = getGeometry('plate', () => {
    const plateGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.05, 32);
    return plateGeo;
  });

  const material = getMaterial('plate', { color: [0xffffff, 0xf0f0f0, 0xf5f5f5][Math.floor(Math.random() * 3)], roughness: 0.2 });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.set(scale, scale, scale);
  return mesh;
}

function createPhone(scale) {
  const group = new THREE.Group();

  const bodyGeometry = getGeometry('phoneBody', () => new THREE.BoxGeometry(0.6, 0.1, 1.2));

  const bodyMaterial = getMaterial('phone', { color: [0x000000, 0x333333, 0x444444][Math.floor(Math.random() * 3)], roughness: 0.2 });

  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  group.add(body);

  const screenGeometry = getGeometry('phoneScreen', () => new THREE.BoxGeometry(0.55, 0.02, 1.1));

  const screenMaterial = getMaterial('phoneScreen', { color: 0x88ccff, roughness: 0.1, emissive: 0x88ccff, emissiveIntensity: 0.2 });

  const screen = new THREE.Mesh(screenGeometry, screenMaterial);
  screen.position.y = 0.06;
  group.add(screen);

  group.scale.set(scale, scale, scale);
  return group;
}

function createToy(scale) {
  const type = Math.floor(Math.random() * 3);
  let mesh;

  if (type === 0) {
    const group = new THREE.Group();

    const bodyGeometry = getGeometry('teddyBody', () => new THREE.SphereGeometry(0.5, 16, 16));

    const bodyMaterial = getMaterial('teddy', { color: [0x8B4513, 0xA0522D, 0xCD853F][Math.floor(Math.random() * 3)], roughness: 1.0 });

    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    group.add(body);

    const headGeometry = getGeometry('teddyHead', () => new THREE.SphereGeometry(0.3, 16, 16));

    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.y = 1.1;
    group.add(head);

    const earGeometry = getGeometry('teddyEar', () => new THREE.SphereGeometry(0.1, 8, 8));

    const leftEar = new THREE.Mesh(earGeometry, bodyMaterial);
    leftEar.position.set(-0.2, 1.3, 0);
    group.add(leftEar);

    const rightEar = new THREE.Mesh(earGeometry, bodyMaterial);
    rightEar.position.set(0.2, 1.3, 0);
    group.add(rightEar);

    const limbGeometry = getGeometry('teddyLimb', () => new THREE.CylinderGeometry(0.15, 0.15, 0.5, 8));

    const leftArm = new THREE.Mesh(limbGeometry, bodyMaterial);
    leftArm.position.set(-0.6, 0.5, 0);
    leftArm.rotation.z = Math.PI / 2; 
    group.add(leftArm);

    const rightArm = new THREE.Mesh(limbGeometry, bodyMaterial);
    rightArm.position.set(0.6, 0.5, 0);
    rightArm.rotation.z = -Math.PI / 2; 
    group.add(rightArm);

    const leftLeg = new THREE.Mesh(limbGeometry, bodyMaterial);
    leftLeg.position.set(-0.2, 0, 0);
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(limbGeometry, bodyMaterial);
    rightLeg.position.set(0.2, 0, 0);
    group.add(rightLeg);

    mesh = group;
  } else if (type === 1) {
    const geometry = getGeometry('toyBall', () => new THREE.SphereGeometry(0.5, 16, 16));

    const material = getMaterial('ball', { color: 0xff0000, roughness: 0.2 });

    mesh = new THREE.Mesh(geometry, material);
  } else {
    const group = new THREE.Group();

    const bodyGeometry = getGeometry('toyCarBody', () => new THREE.BoxGeometry(0.6, 0.3, 1.0));

    const bodyMaterial = getMaterial('toyCar', { color: [0xff0000, 0x0000ff, 0x00ff00, 0xffff00][Math.floor(Math.random() * 4)], roughness: 0.2 });

    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.3;
    group.add(body);

    const wheelGeometry = getGeometry('toyCarWheel', () => new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16));

    const wheelMaterial = getMaterial('toyCarWheel', { color: 0x111111, roughness: 0.7 });

    const frontLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontLeftWheel.position.set(-0.35, 0.15, 0.3);
    frontLeftWheel.rotation.z = Math.PI / 2; 
    group.add(frontLeftWheel);

    const frontRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontRightWheel.position.set(0.35, 0.15, 0.3);
    frontRightWheel.rotation.z = Math.PI / 2; 
    group.add(frontRightWheel);

    const backLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    backLeftWheel.position.set(-0.35, 0.15, -0.3);
    backLeftWheel.rotation.z = Math.PI / 2; 
    group.add(backLeftWheel);

    const backRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    backRightWheel.position.set(0.35, 0.15, -0.3);
    backRightWheel.rotation.z = Math.PI / 2; 
    group.add(backRightWheel);

    mesh = group;
  }

  mesh.scale.set(scale, scale, scale);
  return mesh;
}

function createPlant(scale) {
  const group = new THREE.Group();

  const potGeometry = getGeometry('plantPot', () => new THREE.CylinderGeometry(0.4, 0.3, 0.5, 16));

  const potMaterial = getMaterial('pot', { color: 0x8B4513, roughness: 0.8 });

  const pot = new THREE.Mesh(potGeometry, potMaterial);
  pot.position.y = 0.25;
  group.add(pot);

  const soilGeometry = getGeometry('plantSoil', () => new THREE.CylinderGeometry(0.38, 0.38, 0.05, 16));

  const soilMaterial = getMaterial('soil', { color: 0x3D2817, roughness: 1.0 });

  const soil = new THREE.Mesh(soilGeometry, soilMaterial);
  soil.position.y = 0.5;
  group.add(soil);

  const stemMaterial = getMaterial('plantStem', { color: 0x228B22, roughness: 0.8 });

  const leafMaterial = getMaterial('plantLeaf', { color: 0x00FF00, roughness: 0.8 });

  const stemCount = Math.floor(Math.random() * 3) + 3;

  for (let i = 0; i < stemCount; i++) {
    const stemHeight = 0.5 + Math.random() * 0.5;
    const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, stemHeight, 8);

    const stem = new THREE.Mesh(stemGeometry, stemMaterial);

    const angle = (i / stemCount) * Math.PI * 2;
    const distance = Math.random() * 0.2;
    stem.position.x = Math.cos(angle) * distance;
    stem.position.z = Math.sin(angle) * distance;
    stem.position.y = 0.5 + stemHeight / 2;

    stem.rotation.x = (Math.random() - 0.5) * 0.3;
    stem.rotation.z = (Math.random() - 0.5) * 0.3;

    group.add(stem);

    const leafCount = Math.floor(Math.random() * 2) + 2;

    for (let j = 0; j < leafCount; j++) {
      const leafGeometry = new THREE.SphereGeometry(0.1, 8, 8);
      leafGeometry.scale(1, 0.2, 0.5);

      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);

      const leafHeight = 0.5 + (j / leafCount) * stemHeight;
      leaf.position.x = stem.position.x;
      leaf.position.z = stem.position.z;
      leaf.position.y = leafHeight;

      leaf.rotation.y = Math.random() * Math.PI * 2;

      leaf.rotation.x = stem.rotation.x;
      leaf.rotation.z = stem.rotation.z;

      group.add(leaf);
    }
  }

  group.scale.set(scale, scale, scale);
  return group;
}

// ---------- MEDIUM OBJECTS ----------

function createChair(scale) {
  const group = new THREE.Group();

  const seatGeometry = getGeometry('chairSeat', () => new THREE.BoxGeometry(1.0, 0.1, 1.0));

  const chairMaterial = getMaterial('chair', { color: [0x8B4513, 0xA0522D, 0x654321][Math.floor(Math.random() * 3)], roughness: 0.7 });

  const seat = new THREE.Mesh(seatGeometry, chairMaterial);
  seat.position.y = 0.5;
  group.add(seat);

  const backGeometry = getGeometry('chairBack', () => new THREE.BoxGeometry(1.0, 1.0, 0.1));

  const back = new THREE.Mesh(backGeometry, chairMaterial);
  back.position.set(0, 1.0, -0.45);
  group.add(back);

  const legGeometry = getGeometry('chairLeg', () => new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8));

  const frontLeftLeg = new THREE.Mesh(legGeometry, chairMaterial);
  frontLeftLeg.position.set(-0.4, 0.25, 0.4);
  group.add(frontLeftLeg);

  const frontRightLeg = new THREE.Mesh(legGeometry, chairMaterial);
  frontRightLeg.position.set(0.4, 0.25, 0.4);
  group.add(frontRightLeg);

  const backLeftLeg = new THREE.Mesh(legGeometry, chairMaterial);
  backLeftLeg.position.set(-0.4, 0.25, -0.4);
  group.add(backLeftLeg);

  const backRightLeg = new THREE.Mesh(legGeometry, chairMaterial);
  backRightLeg.position.set(0.4, 0.25, -0.4);
  group.add(backRightLeg);

  group.scale.set(scale, scale, scale);
  return group;
}

function createLamp(scale) {
  const group = new THREE.Group();

  const baseGeometry = getGeometry('lampBase', () => new THREE.CylinderGeometry(0.3, 0.4, 0.1, 16));

  const baseMaterial = getMaterial('lampBase', { color: 0x555555, roughness: 0.5 });

  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.y = 0.05;
  group.add(base);

  const poleGeometry = getGeometry('lampPole', () => new THREE.CylinderGeometry(0.05, 0.05, 1.0, 8));

  const poleMaterial = getMaterial('lampPole', { color: 0x888888, metalness: 0.5, roughness: 0.5 });

  const pole = new THREE.Mesh(poleGeometry, poleMaterial);
  pole.position.y = 0.6;
  group.add(pole);

  const shadeGeometry = getGeometry('lampShade', () => new THREE.ConeGeometry(0.4, 0.6, 16, 1, true));

  const shadeMaterial = getMaterial('lampShade', { color: [0xFFFFCC, 0xFAFAD2, 0xFFF8DC][Math.floor(Math.random() * 3)], roughness: 0.7, side: THREE.DoubleSide });

  const shade = new THREE.Mesh(shadeGeometry, shadeMaterial);
  shade.position.y = 1.3;
  shade.rotation.x = Math.PI; 
  group.add(shade);

  const bulbGeometry = getGeometry('lampBulb', () => new THREE.SphereGeometry(0.1, 8, 8));

  const bulbMaterial = getMaterial('lampBulb', { color: 0xFFFFDD, emissive: 0xFFFFDD, emissiveIntensity: 1.0 });

  const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
  bulb.position.y = 1.1;
  group.add(bulb);

  const light = new THREE.PointLight(0xFFFFDD, 0.5, 5);
  light.position.set(0, 1.1, 0);
  group.add(light);

  group.scale.set(scale, scale, scale);
  return group;
}

function createBox(scale) {
  const group = new THREE.Group();

  const boxGeometry = getGeometry('boxBody', () => new THREE.BoxGeometry(1.0, 0.8, 1.2));

  const boxMaterial = getMaterial('box', { color: 0xD2B48C, roughness: 0.8 });

  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.position.y = 0.4;
  group.add(box);

  const lidGeometry = getGeometry('boxLid', () => new THREE.BoxGeometry(1.0, 0.1, 1.2));

  const lidMaterial = getMaterial('boxLid', { color: 0xC3A579, roughness: 0.8 });

  const lid = new THREE.Mesh(lidGeometry, lidMaterial);
  lid.position.y = 0.85;
  group.add(lid);

  const tapeGeometry = getGeometry('boxTape', () => new THREE.BoxGeometry(0.8, 0.01, 0.1));

  const tapeMaterial = getMaterial('boxTape', { color: 0xAAAAAA, roughness: 0.5 });

  const tapeCross1 = new THREE.Mesh(tapeGeometry, tapeMaterial);
  tapeCross1.position.y = 0.86;
  tapeCross1.rotation.y = Math.PI / 4; 
  group.add(tapeCross1);

  const tapeCross2 = new THREE.Mesh(tapeGeometry, tapeMaterial);
  tapeCross2.position.y = 0.86;
  tapeCross2.rotation.y = -Math.PI / 4; 
  group.add(tapeCross2);

  group.scale.set(scale, scale, scale);
  return group;
}

function createTrashcan(scale) {
  const group = new THREE.Group();

  const bodyGeometry = getGeometry('trashcanBody', () => new THREE.CylinderGeometry(0.3, 0.25, 0.8, 16));

  const bodyMaterial = getMaterial('trashcan', { color: [0x555555, 0x777777, 0x2E8B57][Math.floor(Math.random() * 3)], roughness: 0.7 });

  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.4;
  group.add(body);

  if (Math.random() > 0.5) {
    const lidGeometry = getGeometry('trashcanLid', () => new THREE.CylinderGeometry(0.32, 0.32, 0.05, 16));

    const lid = new THREE.Mesh(lidGeometry, bodyMaterial);
    lid.position.y = 0.825;
    group.add(lid);
  }

  group.scale.set(scale, scale, scale);
  return group;
}

function createStool(scale) {
  const group = new THREE.Group();

  const seatGeometry = getGeometry('stoolSeat', () => new THREE.CylinderGeometry(0.4, 0.4, 0.05, 16));

  const stoolMaterial = getMaterial('stool', { color: [0x8B4513, 0xA0522D, 0x654321][Math.floor(Math.random() * 3)], roughness: 0.7 });

  const seat = new THREE.Mesh(seatGeometry, stoolMaterial);
  seat.position.y = 0.6;
  group.add(seat);

  const legGeometry = getGeometry('stoolLeg', () => new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8));

  const legCount = Math.random() > 0.5 ? 4 : 3;

  for (let i = 0; i < legCount; i++) {
    const angle = (i / legCount) * Math.PI * 2;
    const leg = new THREE.Mesh(legGeometry, stoolMaterial);

    leg.position.x = Math.cos(angle) * 0.3;
    leg.position.z = Math.sin(angle) * 0.3;
    leg.position.y = 0.3;

    leg.rotation.x = Math.sin(angle) * 0.2;
    leg.rotation.z = -Math.cos(angle) * 0.2;

    group.add(leg);
  }

  group.scale.set(scale, scale, scale);
  return group;
}

function createEndtable(scale) {
  const group = new THREE.Group();

  const topGeometry = getGeometry('endtableTop', () => new THREE.BoxGeometry(0.8, 0.05, 0.8));

  const tableMaterial = getMaterial('endtable', { color: [0x8B4513, 0xA0522D, 0x654321][Math.floor(Math.random() * 3)], roughness: 0.7 });

  const top = new THREE.Mesh(topGeometry, tableMaterial);
  top.position.y = 0.6;
  group.add(top);

  const legGeometry = getGeometry('endtableLeg', () => new THREE.BoxGeometry(0.05, 0.6, 0.05));

  const leg1 = new THREE.Mesh(legGeometry, tableMaterial);
  leg1.position.set(-0.35, 0.3, -0.35);
  group.add(leg1);

  const leg2 = new THREE.Mesh(legGeometry, tableMaterial);
  leg2.position.set(0.35, 0.3, -0.35);
  group.add(leg2);

  const leg3 = new THREE.Mesh(legGeometry, tableMaterial);
  leg3.position.set(-0.35, 0.3, 0.35);
  group.add(leg3);

  const leg4 = new THREE.Mesh(legGeometry, tableMaterial);
  leg4.position.set(0.35, 0.3, 0.35);
  group.add(leg4);

  group.scale.set(scale, scale, scale);
  return group;
}

// ---------- LARGE OBJECTS ----------

function createDesk(scale) {
  const group = new THREE.Group();

  const topGeometry = getGeometry('deskTop', () => new THREE.BoxGeometry(2.0, 0.05, 1.0));

  const deskMaterial = getMaterial('desk', { color: [0x8B4513, 0xA0522D, 0x654321][Math.floor(Math.random() * 3)], roughness: 0.7 });

  const top = new THREE.Mesh(topGeometry, deskMaterial);
  top.position.y = 0.75;
  group.add(top);

  const leftSideGeometry = getGeometry('deskSide', () => new THREE.BoxGeometry(0.05, 0.7, 0.9));

  const leftSide = new THREE.Mesh(leftSideGeometry, deskMaterial);
  leftSide.position.set(-0.9, 0.35, 0);
  group.add(leftSide);

  const rightSideGeometry = getGeometry('deskSide', () => new THREE.BoxGeometry(0.05, 0.7, 0.9));

  const rightSide = new THREE.Mesh(rightSideGeometry, deskMaterial);
  rightSide.position.set(0.9, 0.35, 0);
  group.add(rightSide);

  const backGeometry = getGeometry('deskBack', () => new THREE.BoxGeometry(1.9, 0.7, 0.05));

  const back = new THREE.Mesh(backGeometry, deskMaterial);
  back.position.set(0, 0.35, -0.45);
  group.add(back);

  if (Math.random() > 0.3) {
    const drawerGeometry = getGeometry('deskDrawer', () => new THREE.BoxGeometry(0.6, 0.2, 0.8));

    const drawerMaterial = getMaterial('deskDrawer', { color: deskMaterial.color.getHex() * 0.9, roughness: 0.7 });

    const drawer = new THREE.Mesh(drawerGeometry, drawerMaterial);
    drawer.position.set(0, 0.55, 0.05);
    group.add(drawer);

    const handleGeometry = getGeometry('deskHandle', () => new THREE.BoxGeometry(0.2, 0.03, 0.02));

    const handleMaterial = getMaterial('deskHandle', { color: 0xc0c0c0, metalness: 0.5, roughness: 0.5 });

    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(0, 0.55, 0.46);
    group.add(handle);
  }

  group.scale.set(scale, scale, scale);
  return group;
}

function createTable(scale) {
  const group = new THREE.Group();

  const topGeometry = getGeometry('tableTop', () => new THREE.BoxGeometry(2.2, 0.1, 1.2));

  const tableMaterial = getMaterial('table', { color: [0x8B4513, 0xA0522D, 0x654321][Math.floor(Math.random() * 3)], roughness: 0.7 });

  const top = new THREE.Mesh(topGeometry, tableMaterial);
  top.position.y = 0.75;
  group.add(top);

  const legGeometry = getGeometry('tableLeg', () => new THREE.CylinderGeometry(0.05, 0.05, 0.7, 8));

  const leg1 = new THREE.Mesh(legGeometry, tableMaterial);
  leg1.position.set(-1.0, 0.35, -0.5);
  group.add(leg1);

  const leg2 = new THREE.Mesh(legGeometry, tableMaterial);
  leg2.position.set(1.0, 0.35, -0.5);
  group.add(leg2);

  const leg3 = new THREE.Mesh(legGeometry, tableMaterial);
  leg3.position.set(-1.0, 0.35, 0.5);
  group.add(leg3);

  const leg4 = new THREE.Mesh(legGeometry, tableMaterial);
  leg4.position.set(1.0, 0.35, 0.5);
  group.add(leg4);

  group.scale.set(scale, scale, scale);
  return group;
}

function createBicycle(scale) {
  const group = new THREE.Group();

  const frameMaterial = getMaterial('bicycleFrame', { color: [0xFF0000, 0x0000FF, 0x00FF00, 0xFFFF00][Math.floor(Math.random() * 4)], metalness: 0.5, roughness: 0.5 });

  const wheelMaterial = getMaterial('bicycleWheel', { color: 0x111111, roughness: 0.7 });

  const frameGroup = new THREE.Group();

  const mainTubeGeometry = getGeometry('bicycleMainTube', () => new THREE.CylinderGeometry(0.03, 0.03, 1.2, 8));

  const mainTube = new THREE.Mesh(mainTubeGeometry, frameMaterial);
  mainTube.position.set(0, 0.5, 0);
  mainTube.rotation.z = Math.PI / 4; 
  frameGroup.add(mainTube);

  const seatTubeGeometry = getGeometry('bicycleSeatTube', () => new THREE.CylinderGeometry(0.03, 0.03, 0.7, 8));

  const seatTube = new THREE.Mesh(seatTubeGeometry, frameMaterial);
  seatTube.position.set(-0.3, 0.5, 0);
  frameGroup.add(seatTube);

  const handlebarTubeGeometry = getGeometry('bicycleHandlebarTube', () => new THREE.CylinderGeometry(0.03, 0.03, 0.7, 8));

  const handlebarTube = new THREE.Mesh(handlebarTubeGeometry, frameMaterial);
  handlebarTube.position.set(0.4, 0.5, 0);
  frameGroup.add(handlebarTube);

  const bottomTubeGeometry = getGeometry('bicycleBottomTube', () => new THREE.CylinderGeometry(0.03, 0.03, 0.7, 8));

  const bottomTube = new THREE.Mesh(bottomTubeGeometry, frameMaterial);
  bottomTube.position.set(0, 0.2, 0);
  bottomTube.rotation.z = -Math.PI / 6; 
  frameGroup.add(bottomTube);

  group.add(frameGroup);

  const wheelGeometry = getGeometry('bicycleWheel', () => new THREE.TorusGeometry(0.3, 0.03, 8, 24));

  const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  frontWheel.position.set(0.5, 0.3, 0);
  frontWheel.rotation.y = Math.PI / 2; 
  group.add(frontWheel);

  const backWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  backWheel.position.set(-0.5, 0.3, 0);
  backWheel.rotation.y = Math.PI / 2; 
  group.add(backWheel);

  const handlebarGeometry = getGeometry('bicycleHandlebar', () => new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8));

  const handlebar = new THREE.Mesh(handlebarGeometry, frameMaterial);
  handlebar.position.set(0.5, 0.8, 0);
  handlebar.rotation.z = Math.PI / 2; 
  group.add(handlebar);

  const seatGeometry = getGeometry('bicycleSeat', () => new THREE.BoxGeometry(0.2, 0.05, 0.15));

  const seatMaterial = getMaterial('bicycleSeat', { color: 0x111111, roughness: 0.7 });

  const seat = new THREE.Mesh(seatGeometry, seatMaterial);
  seat.position.set(-0.3, 0.85, 0);
  group.add(seat);

  const pedalGeometry = getGeometry('bicyclePedal', () => new THREE.BoxGeometry(0.1, 0.02, 0.05));

  const pedalMaterial = getMaterial('bicyclePedal', { color: 0x555555, roughness: 0.5 });

  const pedal1 = new THREE.Mesh(pedalGeometry, pedalMaterial);
  pedal1.position.set(0, 0.2, 0.15);
  group.add(pedal1);

  const pedal2 = new THREE.Mesh(pedalGeometry, pedalMaterial);
  pedal2.position.set(0, 0.2, -0.15);
  group.add(pedal2);

  const chainGeometry = getGeometry('bicycleChain', () => new THREE.TorusGeometry(0.15, 0.01, 8, 16));

  const chainMaterial = getMaterial('bicycleChain', { color: 0x333333, roughness: 0.5 });

  const chain = new THREE.Mesh(chainGeometry, chainMaterial);
  chain.position.set(-0.2, 0.2, 0);
  chain.rotation.y = Math.PI / 2; 
  group.add(chain);

  group.scale.set(scale, scale, scale);
  return group;
}

function createMailbox(scale) {
  const group = new THREE.Group();

  const postGeometry = getGeometry('mailboxPost', () => new THREE.BoxGeometry(0.1, 1.2, 0.1));

  const postMaterial = getMaterial('mailboxPost', { color: 0x8B4513, roughness: 0.8 });

  const post = new THREE.Mesh(postGeometry, postMaterial);
  post.position.y = 0.6;
  group.add(post);

  const bodyGeometry = getGeometry('mailboxBody', () => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.3, -0.15);
    shape.lineTo(0.3, -0.15);
    shape.lineTo(0.3, 0.15);
    shape.lineTo(-0.3, 0.15);
    shape.lineTo(-0.3, -0.15);

    const extrudeSettings = {
      steps: 1,
      depth: 0.6,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 3
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  });

  const bodyMaterial = getMaterial('mailboxBody', { color: [0x333333, 0x2E8B57, 0x8B0000][Math.floor(Math.random() * 3)], roughness: 0.7 });

  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.set(0, 1, -0.3);
  body.rotation.x = Math.PI / 2; 
  group.add(body);

  const doorGeometry = getGeometry('mailboxDoor', () => new THREE.BoxGeometry(0.6, 0.05, 0.3));

  const door = new THREE.Mesh(doorGeometry, bodyMaterial);
  door.position.set(0, 1, 0.35);
  group.add(door);

  const flagGeometry = getGeometry('mailboxFlag', () => new THREE.BoxGeometry(0.05, 0.15, 0.01));

  const flagMaterial = getMaterial('mailboxFlag', { color: 0xFF0000, roughness: 0.7 });

  const flag = new THREE.Mesh(flagGeometry, flagMaterial);
  flag.position.set(0.35, 1.1, 0);
  group.add(flag);

  group.scale.set(scale, scale, scale);
  return group;
}

function createBench(scale) {
  const group = new THREE.Group();

  const benchMaterial = getMaterial('bench', { color: [0x8B4513, 0xA0522D, 0x654321][Math.floor(Math.random() * 3)], roughness: 0.8 });

  const plankGeometry = getGeometry('benchPlank', () => new THREE.BoxGeometry(1.8, 0.05, 0.15));

  for (let i = 0; i < 5; i++) {
    const plank = new THREE.Mesh(plankGeometry, benchMaterial);
    plank.position.set(0, 0.45, -0.3 + i * 0.15);
    group.add(plank);
  }

  const backPlankGeometry = getGeometry('benchBackPlank', () => new THREE.BoxGeometry(1.8, 0.05, 0.15));

  for (let i = 0; i < 3; i++) {
    const backPlank = new THREE.Mesh(backPlankGeometry, benchMaterial);
    backPlank.position.set(0, 0.7 + i * 0.15, -0.35);
    backPlank.rotation.x = Math.PI / 12; 
    group.add(backPlank);
  }

  const legGeometry = getGeometry('benchLeg', () => new THREE.BoxGeometry(0.1, 0.4, 0.8));

  const legMaterial = getMaterial('benchLeg', { color: 0x333333, metalness: 0.5, roughness: 0.5 });

  const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
  leftLeg.position.set(-0.8, 0.2, 0);
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
  rightLeg.position.set(0.8, 0.2, 0);
  group.add(rightLeg);

  const armrestGeometry = getGeometry('benchArmrest', () => new THREE.BoxGeometry(0.1, 0.25, 0.7));

  const leftArmrest = new THREE.Mesh(armrestGeometry, benchMaterial);
  leftArmrest.position.set(-0.85, 0.6, 0);
  group.add(leftArmrest);

  const rightArmrest = new THREE.Mesh(armrestGeometry, benchMaterial);
  rightArmrest.position.set(0.85, 0.6, 0);
  group.add(rightArmrest);

  group.scale.set(scale, scale, scale);
  return group;
}

function createDoghouse(scale) {
  const group = new THREE.Group();

  const baseGeometry = getGeometry('doghouseBase', () => new THREE.BoxGeometry(1.2, 0.05, 1.5));

  const houseMaterial = getMaterial('doghouse', { color: [0x8B4513, 0xA0522D, 0x654321][Math.floor(Math.random() * 3)], roughness: 0.8 });

  const base = new THREE.Mesh(baseGeometry, houseMaterial);
  base.position.y = 0.025;
  group.add(base);

  const wallGeometry = getGeometry('doghouseWall', () => new THREE.BoxGeometry(1.2, 0.8, 0.05));

  const backWall = new THREE.Mesh(wallGeometry, houseMaterial);
  backWall.position.set(0, 0.4, -0.725);
  group.add(backWall);

  const leftWallGeometry = getGeometry('doghouseSideWall', () => new THREE.BoxGeometry(0.05, 0.8, 1.5));

  const leftWall = new THREE.Mesh(leftWallGeometry, houseMaterial);
  leftWall.position.set(-0.575, 0.4, 0);
  group.add(leftWall);

  const rightWall = new THREE.Mesh(leftWallGeometry, houseMaterial);
  rightWall.position.set(0.575, 0.4, 0);
  group.add(rightWall);

  const frontWallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.05), houseMaterial);
  frontWallLeft.position.set(-0.4, 0.4, 0.725);
  group.add(frontWallLeft);

  const frontWallRight = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.05), houseMaterial);
  frontWallRight.position.set(0.4, 0.4, 0.725);
  group.add(frontWallRight);

  const frontWallTop = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.05), houseMaterial);
  frontWallTop.position.set(0, 0.65, 0.725);
  group.add(frontWallTop);

  const roofGeometry = getGeometry('doghouseRoof', () => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.7, 0);
    shape.lineTo(0.7, 0);
    shape.lineTo(0, 0.4);
    shape.lineTo(-0.7, 0);

    const extrudeSettings = {
      steps: 1,
      depth: 1.6,
      bevelEnabled: false
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  });

  const roofMaterial = getMaterial('doghouseRoof', { color: 0x8B0000, roughness: 0.7 });

  const roof = new THREE.Mesh(roofGeometry, roofMaterial);
  roof.position.set(0, 0.8, -0.8);
  group.add(roof);

  group.scale.set(scale, scale, scale);
  return group;
}

// ---------- XL OBJECTS ----------

function createCar(scale) {
  const group = new THREE.Group();

  const carColor = [0xFF0000, 0x0000FF, 0x00FF00, 0xFFFF00, 0x000000, 0xFFFFFF, 0xFFA500][Math.floor(Math.random() * 7)];

  const bodyGeometry = getGeometry('carBody', () => {
    const shape = new THREE.Shape();
    shape.moveTo(-1.5, 0);
    shape.lineTo(1.5, 0);
    shape.lineTo(1.2, 0.5);
    shape.lineTo(-1.2, 0.5);
    shape.lineTo(-1.5, 0);

    const extrudeSettings = {
      steps: 1,
      depth: 1.0,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 3
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  });

  const bodyMaterial = getMaterial(`carBody${carColor}`, { color: carColor, metalness: 0.5, roughness: 0.3 });

  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.set(0, 0.4, -0.5);
  body.rotation.x = Math.PI / 2; 
  group.add(body);

  const cabinGeometry = getGeometry('carCabin', () => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.8, 0);
    shape.lineTo(0.8, 0);
    shape.lineTo(0.6, 0.4);
    shape.lineTo(-0.6, 0.4);
    shape.lineTo(-0.8, 0);

    const extrudeSettings = {
      steps: 1,
      depth: 0.8,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 3
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  });

  const cabin = new THREE.Mesh(cabinGeometry, bodyMaterial);
  cabin.position.set(0, 0.9, -0.4);
  cabin.rotation.x = Math.PI / 2; 
  group.add(cabin);

  const windshieldGeometry = getGeometry('carWindshield', () => new THREE.PlaneGeometry(1.0, 0.3));

  const glassMaterial = getMaterial('carGlass', { color: 0x88CCFF, transparent: true, opacity: 0.7, roughness: 0.1 });

  const windshield = new THREE.Mesh(windshieldGeometry, glassMaterial);
  windshield.position.set(0, 1.1, 0.2);
  windshield.rotation.x = Math.PI / 6; 
  group.add(windshield);

  const rearWindowGeometry = getGeometry('carRearWindow', () => new THREE.PlaneGeometry(1.0, 0.3));

  const rearWindow = new THREE.Mesh(rearWindowGeometry, glassMaterial);
  rearWindow.position.set(0, 1.1, -1.0);
  rearWindow.rotation.x = -Math.PI / 6; 
  group.add(rearWindow);

  const wheelGeometry = getGeometry('carWheel', () => new THREE.CylinderGeometry(0.25, 0.25, 0.15, 16));

  const wheelMaterial = getMaterial('carWheel', { color: 0x111111, roughness: 0.7 });

  const frontLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  frontLeftWheel.position.set(-0.8, 0.25, 0.7);
  frontLeftWheel.rotation.z = Math.PI / 2; 
  group.add(frontLeftWheel);

  const frontRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  frontRightWheel.position.set(0.8, 0.25, 0.7);
  frontRightWheel.rotation.z = Math.PI / 2; 
  group.add(frontRightWheel);

  const rearLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  rearLeftWheel.position.set(-0.8, 0.25, -0.7);
  rearLeftWheel.rotation.z = Math.PI / 2; 
  group.add(rearLeftWheel);

  const rearRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  rearRightWheel.position.set(0.8, 0.25, -0.7);
  rearRightWheel.rotation.z = Math.PI / 2; 
  group.add(rearRightWheel);

  const headlightGeometry = getGeometry('carHeadlight', () => new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16));

  const headlightMaterial = getMaterial('carHeadlight', { color: 0xFFFFCC, emissive: 0xFFFFCC, emissiveIntensity: 0.5 });

  const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
  leftHeadlight.position.set(-0.6, 0.5, 1.0);
  leftHeadlight.rotation.z = Math.PI / 2; 
  group.add(leftHeadlight);

  const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
  rightHeadlight.position.set(0.6, 0.5, 1.0);
  rightHeadlight.rotation.z = Math.PI / 2; 
  group.add(rightHeadlight);

  const taillightGeometry = getGeometry('carTaillight', () => new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16));

  const taillightMaterial = getMaterial('carTaillight', { color: 0xFF0000, emissive: 0xFF0000, emissiveIntensity: 0.5 });

  const leftTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
  leftTaillight.position.set(-0.6, 0.5, -1.0);
  leftTaillight.rotation.z = Math.PI / 2; 
  group.add(leftTaillight);

  const rightTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
  rightTaillight.position.set(0.6, 0.5, -1.0);
  rightTaillight.rotation.z = Math.PI / 2; 
  group.add(rightTaillight);

  group.scale.set(scale, scale, scale);
  return group;
}

function createTree(scale) {
  const group = new THREE.Group();

  const trunkGeometry = getGeometry('treeTrunk', () => new THREE.CylinderGeometry(0.2, 0.3, 2.0, 8));

  const trunkMaterial = getMaterial('treeTrunk', { color: 0x8B4513, roughness: 0.9 });

  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = 1.0;
  group.add(trunk);

  const foliageType = Math.floor(Math.random() * 3);

  if (foliageType === 0) {
    const foliageMaterial = getMaterial('treeFoliagePine', { color: 0x2E8B57, roughness: 0.8 });

    for (let i = 0; i < 3; i++) {
      const coneGeometry = getGeometry(`treeFoliagePine${i}`, () => new THREE.ConeGeometry(1.0 - i * 0.2, 1.5, 8));

      const cone = new THREE.Mesh(coneGeometry, foliageMaterial);
      cone.position.y = 2.0 + i * 0.8;
      group.add(cone);
    }
  } else if (foliageType === 1) {
    const foliageMaterial = getMaterial('treeFoliageRegular', { color: 0x4CBB17, roughness: 0.8 });

    const foliageGeometry = getGeometry('treeFoliageRegular', () => new THREE.SphereGeometry(1.2, 8, 8));

    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.y = 2.5;
    group.add(foliage);

    for (let i = 0; i < 5; i++) {
      const smallFoliageGeometry = getGeometry(`treeFoliageSmall${i}`, () => new THREE.SphereGeometry(0.8, 8, 8));

      const angle = i * Math.PI * 2 / 5;
      const smallFoliage = new THREE.Mesh(smallFoliageGeometry, foliageMaterial);
      smallFoliage.position.set(Math.cos(angle) * 0.8, 2.0 + Math.random() * 1.5, Math.sin(angle) * 0.8);
      group.add(smallFoliage);
    }
  } else {
    const foliageMaterial = getMaterial('treeFoliageOak', { color: 0x228B22, roughness: 0.8 });

    const foliageGeometry = getGeometry('treeFoliageOak', () => new THREE.SphereGeometry(1.5, 8, 8));
    foliageGeometry.scale(1.0, 0.7, 1.0); 

    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.y = 2.5;
    group.add(foliage);
  }

  group.scale.set(scale, scale, scale);
  return group;
}

function createStreetlight(scale) {
  const group = new THREE.Group();

  const poleGeometry = getGeometry('streetlightPole', () => new THREE.CylinderGeometry(0.1, 0.1, 4.0, 8));

  const poleMaterial = getMaterial('streetlightPole', { color: 0x333333, metalness: 0.7, roughness: 0.3 });

  const pole = new THREE.Mesh(poleGeometry, poleMaterial);
  pole.position.y = 2.0;
  group.add(pole);

  const baseGeometry = getGeometry('streetlightBase', () => new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8));

  const base = new THREE.Mesh(baseGeometry, poleMaterial);
  base.position.y = 0.05;
  group.add(base);

  const armGeometry = getGeometry('streetlightArm', () => new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8));

  const arm = new THREE.Mesh(armGeometry, poleMaterial);
  arm.position.set(0.6, 3.8, 0);
  arm.rotation.z = Math.PI / 2; 
  group.add(arm);

  const fixtureGeometry = getGeometry('streetlightFixture', () => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.2, -0.1);
    shape.lineTo(0.2, -0.1);
    shape.lineTo(0.15, 0.1);
    shape.lineTo(-0.15, 0.1);
    shape.lineTo(-0.2, -0.1);

    const extrudeSettings = {
      steps: 1,
      depth: 0.3,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 3
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  });

  const fixtureMaterial = getMaterial('streetlightFixture', { color: 0x333333, metalness: 0.7, roughness: 0.3 });

  const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
  fixture.position.set(1.2, 3.8, -0.15);
  fixture.rotation.y = Math.PI / 2; 
  group.add(fixture);

  const bulbGeometry = getGeometry('streetlightBulb', () => new THREE.SphereGeometry(0.1, 8, 8));

  const bulbMaterial = getMaterial('streetlightBulb', { color: 0xFFFFCC, emissive: 0xFFFFCC, emissiveIntensity: 1.0 });

  const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
  bulb.position.set(1.2, 3.7, 0);
  group.add(bulb);

  const light = new THREE.PointLight(0xFFFFCC, 1, 10);
  light.position.set(1.2, 3.7, 0);
  group.add(light);

  group.scale.set(scale, scale, scale);
  return group;
}

function createShed(scale) {
  const group = new THREE.Group();

  const baseGeometry = getGeometry('shedBase', () => new THREE.BoxGeometry(3.0, 0.1, 2.5));

  const woodMaterial = getMaterial('shedWood', { color: 0x8B4513, roughness: 0.8 });

  const base = new THREE.Mesh(baseGeometry, woodMaterial);
  base.position.y = 0.05;
  group.add(base);

  const wallMaterial = getMaterial('shedWall', { color: [0x8B4513, 0xA0522D, 0xCD853F][Math.floor(Math.random() * 3)], roughness: 0.7 });

  const frontWallGeometry = getGeometry('shedFrontWall', () => new THREE.BoxGeometry(3.0, 2.0, 0.1));

  const frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
  frontWall.position.set(0, 1.0, 1.25);
  group.add(frontWall);

  const doorGeometry = getGeometry('shedDoor', () => new THREE.BoxGeometry(1.0, 1.8, 0.12));

  const doorMaterial = getMaterial('shedDoor', { color: 0x654321, roughness: 0.7 });

  const door = new THREE.Mesh(doorGeometry, doorMaterial);
  door.position.set(0, 0.9, 1.31);
  group.add(door);

  const handleGeometry = getGeometry('shedHandle', () => new THREE.CylinderGeometry(0.03, 0.03, 0.15, 8));

  const handleMaterial = getMaterial('shedHandle', { color: 0xC0C0C0, metalness: 0.7, roughness: 0.3 });

  const handle = new THREE.Mesh(handleGeometry, handleMaterial);
  handle.position.set(0.4, 0.9, 1.37);
  handle.rotation.z = Math.PI / 2; 
  group.add(handle);

  const backWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
  backWall.position.set(0, 1.0, -1.25);
  group.add(backWall);

  const sideWallGeometry = getGeometry('shedSideWall', () => new THREE.BoxGeometry(0.1, 2.0, 2.5));

  const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
  leftWall.position.set(-1.45, 1.0, 0);
  group.add(leftWall);

  const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
  rightWall.position.set(1.45, 1.0, 0);
  group.add(rightWall);

  const roofGeometry = getGeometry('shedRoof', () => {
    const shape = new THREE.Shape();
    shape.moveTo(-1.6, 0);
    shape.lineTo(1.6, 0);
    shape.lineTo(0, 0.8);
    shape.lineTo(-1.6, 0);

    const extrudeSettings = {
      steps: 1,
      depth: 2.7,
      bevelEnabled: false
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  });

  const roofMaterial = getMaterial('shedRoof', { color: 0x8B0000, roughness: 0.7 });

  const roof = new THREE.Mesh(roofGeometry, roofMaterial);
  roof.position.set(0, 2.0, -1.35);
  group.add(roof);

  if (Math.random() > 0.5) {
    const windowGeometry = getGeometry('shedWindow', () => new THREE.PlaneGeometry(0.5, 0.5));

    const windowMaterial = getMaterial('shedWindow', { color: 0x88CCFF, transparent: true, opacity: 0.7, roughness: 0.1 });

    const window = new THREE.Mesh(windowGeometry, windowMaterial);
    window.position.set(0, 1.5, -1.26);
    group.add(window);

    const frameGeometry = getGeometry('shedWindowFrame', () => new THREE.BoxGeometry(0.6, 0.6, 0.05));

    const frameMaterial = getMaterial('shedWindowFrame', { color: 0xFFFFFF, roughness: 0.7 });

    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(0, 1.5, -1.28);
    group.add(frame);
  }

  group.scale.set(scale, scale, scale);
  return group;
}

function createStatue(scale) {
  const group = new THREE.Group();

  const baseGeometry = getGeometry('statueBase', () => new THREE.BoxGeometry(1.5, 0.5, 1.5));

  const stoneMaterial = getMaterial('statueStone', { color: 0xCCCCCC, roughness: 0.7 });

  const base = new THREE.Mesh(baseGeometry, stoneMaterial);
  base.position.y = 0.25;
  group.add(base);

  const middleGeometry = getGeometry('statueMiddle', () => new THREE.BoxGeometry(1.2, 0.3, 1.2));

  const middle = new THREE.Mesh(middleGeometry, stoneMaterial);
  middle.position.y = 0.65;
  group.add(middle);

  const statueType = Math.floor(Math.random() * 3);

  if (statueType === 0) {
    const bodyGeometry = getGeometry('statueBody', () => new THREE.CylinderGeometry(0.2, 0.15, 1.0, 8));

    const body = new THREE.Mesh(bodyGeometry, stoneMaterial);
    body.position.y = 1.3;
    group.add(body);

    const headGeometry = getGeometry('statueHead', () => new THREE.SphereGeometry(0.15, 8, 8));

    const head = new THREE.Mesh(headGeometry, stoneMaterial);
    head.position.y = 1.9;
    group.add(head);

    const armGeometry = getGeometry('statueArm', () => new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8));

    const leftArm = new THREE.Mesh(armGeometry, stoneMaterial);
    leftArm.position.set(-0.3, 1.5, 0);
    leftArm.rotation.z = Math.PI / 4; 
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, stoneMaterial);
    rightArm.position.set(0.3, 1.5, 0);
    rightArm.rotation.z = -Math.PI / 4; 
    group.add(rightArm);

    const legGeometry = getGeometry('statueLeg', () => new THREE.CylinderGeometry(0.07, 0.07, 0.5, 8));

    const leftLeg = new THREE.Mesh(legGeometry, stoneMaterial);
    leftLeg.position.set(-0.1, 0.9, 0);
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, stoneMaterial);
    rightLeg.position.set(0.1, 0.9, 0);
    group.add(rightLeg);
  } else if (statueType === 1) {
    const shapes = [];

    for (let i = 0; i < 5; i++) {
      const shapeType = Math.floor(Math.random() * 3);
      let geometry;

      if (shapeType === 0) {
        geometry = new THREE.BoxGeometry(0.2 + Math.random() * 0.4, 0.2 + Math.random() * 0.4, 0.2 + Math.random() * 0.4);
      } else if (shapeType === 1) {
        geometry = new THREE.SphereGeometry(0.1 + Math.random() * 0.2, 8, 8);
      } else {
        geometry = new THREE.CylinderGeometry(0.1 + Math.random() * 0.2, 0.1 + Math.random() * 0.2, 0.2 + Math.random() * 0.6, 8);
      }

      const shape = new THREE.Mesh(geometry, stoneMaterial);
      shape.position.set((Math.random() - 0.5) * 0.6, 1.0 + i * 0.3, (Math.random() - 0.5) * 0.6);

      shape.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

      group.add(shape);
      shapes.push(shape);
    }
  } else {
    const animalType = Math.floor(Math.random() * 3);

    if (animalType === 0) {
      const bodyGeometry = getGeometry('statueLionBody', () => new THREE.BoxGeometry(0.6, 0.4, 1.0));

      const body = new THREE.Mesh(bodyGeometry, stoneMaterial);
      body.position.y = 1.0;
      group.add(body);

      const headGeometry = getGeometry('statueLionHead', () => new THREE.SphereGeometry(0.25, 8, 8));

      const head = new THREE.Mesh(headGeometry, stoneMaterial);
      head.position.set(0, 1.3, 0.4);
      group.add(head);

      const legGeometry = getGeometry('statueLionLeg', () => new THREE.CylinderGeometry(0.07, 0.07, 0.3, 8));

      const positions = [
        [-0.2, 0.8, 0.3], 
        [0.2, 0.8, 0.3], 
        [-0.2, 0.8, -0.3], 
        [0.2, 0.8, -0.3] 
      ];

      for (const pos of positions) {
        const leg = new THREE.Mesh(legGeometry, stoneMaterial);
        leg.position.set(...pos);
        group.add(leg);
      }

      const tailGeometry = getGeometry('statueLionTail', () => {
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0.2, -0.2),
          new THREE.Vector3(0, 0.4, -0.1)
        ]);

        return new THREE.TubeGeometry(curve, 8, 0.05, 8, false);
      });

      const tail = new THREE.Mesh(tailGeometry, stoneMaterial);
      tail.position.set(0, 1.0, -0.5);
      group.add(tail);
    } else if (animalType === 1) {
      const bodyGeometry = getGeometry('statueHorseBody', () => new THREE.BoxGeometry(0.4, 0.5, 1.0));

      const body = new THREE.Mesh(bodyGeometry, stoneMaterial);
      body.position.y = 1.2;
      group.add(body);

      const neckGeometry = getGeometry('statueHorseNeck', () => new THREE.CylinderGeometry(0.12, 0.15, 0.5, 8));

      const neck = new THREE.Mesh(neckGeometry, stoneMaterial);
      neck.position.set(0, 1.5, 0.3);
      neck.rotation.x = -Math.PI / 4; 
      group.add(neck);

      const headGeometry = getGeometry('statueHorseHead', () => new THREE.BoxGeometry(0.15, 0.3, 0.2));

      const head = new THREE.Mesh(headGeometry, stoneMaterial);
      head.position.set(0, 1.7, 0.5);
      head.rotation.x = -Math.PI / 6; 
      group.add(head);

      const legGeometry = getGeometry('statueHorseLeg', () => new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8));

      const positions = [
        [-0.15, 0.95, 0.3], 
        [0.15, 0.95, 0.3], 
        [-0.15, 0.95, -0.3], 
        [0.15, 0.95, -0.3] 
      ];

      for (const pos of positions) {
        const leg = new THREE.Mesh(legGeometry, stoneMaterial);
        leg.position.set(...pos);
        group.add(leg);
      }

      const tailGeometry = getGeometry('statueHorseTail', () => {
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, -0.2, -0.1),
          new THREE.Vector3(0, -0.4, -0.05)
        ]);

        return new THREE.TubeGeometry(curve, 8, 0.05, 8, false);
      });

      const tail = new THREE.Mesh(tailGeometry, stoneMaterial);
      tail.position.set(0, 1.4, -0.5);
      group.add(tail);
    } else {
      const bodyGeometry = getGeometry('statueEagleBody', () => new THREE.SphereGeometry(0.3, 8, 8));
      bodyGeometry.scale(1.0, 0.7, 1.3); 

      const body = new THREE.Mesh(bodyGeometry, stoneMaterial);
      body.position.y = 1.2;
      group.add(body);

      const headGeometry = getGeometry('statueEagleHead', () => new THREE.SphereGeometry(0.15, 8, 8));

      const head = new THREE.Mesh(headGeometry, stoneMaterial);
      head.position.set(0, 1.5, 0.3);
      group.add(head);

      const beakGeometry = getGeometry('statueEagleBeak', () => new THREE.ConeGeometry(0.05, 0.2, 8));

      const beak = new THREE.Mesh(beakGeometry, stoneMaterial);
      beak.position.set(0, 1.5, 0.45);
      beak.rotation.x = -Math.PI / 2; 
      group.add(beak);

      const wingGeometry = getGeometry('statueEagleWing', () => {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.lineTo(0.6, 0.2);
        shape.lineTo(0.8, 0.5);
        shape.lineTo(0.6, 0.7);
        shape.lineTo(0.2, 0.6);
        shape.lineTo(0, 0.4);
        shape.lineTo(0, 0);

        const extrudeSettings = {
          steps: 1,
          depth: 0.05,
          bevelEnabled: false
        };

        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
      });

      const leftWing = new THREE.Mesh(wingGeometry, stoneMaterial);
      leftWing.position.set(-0.3, 1.2, 0);
      leftWing.rotation.set(Math.PI / 2, 0, -Math.PI / 6); 
      group.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeometry, stoneMaterial);
      rightWing.position.set(0.3, 1.2, 0);
      rightWing.rotation.set(Math.PI / 2, 0, Math.PI + Math.PI / 6); 
      group.add(rightWing);

      const footGeometry = getGeometry('statueEagleFoot', () => new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8));

      const leftFoot = new THREE.Mesh(footGeometry, stoneMaterial);
      leftFoot.position.set(-0.1, 0.9, 0);
      group.add(leftFoot);

      const rightFoot = new THREE.Mesh(footGeometry, stoneMaterial);
      rightFoot.position.set(0.1, 0.9, 0);
      group.add(rightFoot);
    }
  }

  group.scale.set(scale, scale, scale);
  return group;
}

function createFountain(scale) {
  const group = new THREE.Group();

  const poolGeometry = getGeometry('fountainPool', () => new THREE.CylinderGeometry(2.0, 2.0, 0.3, 32));

  const stoneMaterial = getMaterial('fountainStone', { color: 0xCCCCCC, roughness: 0.7 });

  const pool = new THREE.Mesh(poolGeometry, stoneMaterial);
  pool.position.y = 0.15;
  group.add(pool);

  const waterGeometry = getGeometry('fountainWater', () => new THREE.CylinderGeometry(1.9, 1.9, 0.1, 32));

  const waterMaterial = getMaterial('fountainWater', { color: 0x88CCFF, transparent: true, opacity: 0.8, roughness: 0.3 });

  const water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.position.y = 0.25;
  group.add(water);

  const middleTierGeometry = getGeometry('fountainMiddleTier', () => new THREE.CylinderGeometry(1.0, 1.2, 0.2, 16));

  const middleTier = new THREE.Mesh(middleTierGeometry, stoneMaterial);
  middleTier.position.y = 0.7;
  group.add(middleTier);

  const secondWaterGeometry = getGeometry('fountainSecondWater', () => new THREE.CylinderGeometry(0.9, 0.9, 0.1, 16));

  const secondWater = new THREE.Mesh(secondWaterGeometry, waterMaterial);
  secondWater.position.y = 0.8;
  group.add(secondWater);

  const centerColumnGeometry = getGeometry('fountainCenterColumn', () => new THREE.CylinderGeometry(0.2, 0.2, 1.0, 16));

  const centerColumn = new THREE.Mesh(centerColumnGeometry, stoneMaterial);
  centerColumn.position.y = 1.3;
  group.add(centerColumn);

  const topTierGeometry = getGeometry('fountainTopTier', () => new THREE.CylinderGeometry(0.5, 0.6, 0.2, 16));

  const topTier = new THREE.Mesh(topTierGeometry, stoneMaterial);
  topTier.position.y = 1.9;
  group.add(topTier);

  const topWaterGeometry = getGeometry('fountainTopWater', () => new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16));

  const topWater = new THREE.Mesh(topWaterGeometry, waterMaterial);
  topWater.position.y = 2.0;
  group.add(topWater);

  const createWaterJet = (x, y, z, height, radius) => {
    const jetGeometry = new THREE.CylinderGeometry(0, radius, height, 8);
    const jet = new THREE.Mesh(jetGeometry, waterMaterial);
    jet.position.set(x, y + height/2, z);
    return jet;
  };

  const centerJet = createWaterJet(0, 2.1, 0, 0.8, 0.15);
  group.add(centerJet);

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const radius = 0.7;

    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    const jet = createWaterJet(x, 0.9, z, 0.4, 0.05);
    jet.rotation.x = Math.atan2(radius, 0.4) * Math.random();
    jet.rotation.y = angle;
    group.add(jet);
  }

  for (let i = 0; i < 6; i++) {
    const angle = i * Math.PI / 4;

    const x = Math.cos(angle) * 1.5;
    const z = Math.sin(angle) * 1.5;

    const jet = createWaterJet(x, 0.3, z, 0.6, 0.08);
    jet.rotation.x = Math.atan2(1.5, 0.6);
    jet.rotation.y = angle + Math.PI;
    group.add(jet);
  }

  const addLight = (x, y, z, intensity = 0.5, distance = 5) => {
    const light = new THREE.PointLight(0x88CCFF, intensity, distance);
    light.position.set(x, y, z);
    group.add(light);
  };

  addLight(0, 2.0, 0, 0.7);
  addLight(0, 0.8, 0, 0.5);

  group.scale.set(scale, scale, scale);
  return group;
}

// ---------- XXL OBJECTS ----------

function createHouse(scale) {
  const group = new THREE.Group();

  const houseStyle = Math.floor(Math.random() * 3);
  let wallColor, roofColor;

  if (houseStyle === 0) {
    wallColor = 0xF5F5DC; 
    roofColor = 0x8B4513; 
  } else if (houseStyle === 1) {
    wallColor = 0xA52A2A; 
    roofColor = 0x708090; 
  } else {
    wallColor = 0xFFFFFF; 
    roofColor = 0x333333; 
  }

  const foundationGeometry = getGeometry('houseFoundation', () => new THREE.BoxGeometry(6.0, 0.5, 8.0));

  const foundationMaterial = getMaterial('houseFoundation', { color: 0x888888, roughness: 0.9 });

  const foundation = new THREE.Mesh(foundationGeometry, foundationMaterial);
  foundation.position.y = 0.25;
  group.add(foundation);

  const wallMaterial = getMaterial(`houseWall${wallColor}`, { color: wallColor, roughness: 0.8 });

  const bodyGeometry = getGeometry('houseBody', () => new THREE.BoxGeometry(5.0, 3.0, 7.0));

  const body = new THREE.Mesh(bodyGeometry, wallMaterial);
  body.position.y = 2.0;
  group.add(body);

  if (houseStyle === 2) {
    const flatRoofGeometry = getGeometry('houseFlatRoof', () => new THREE.BoxGeometry(5.5, 0.2, 7.5));

    const flatRoof = new THREE.Mesh(flatRoofGeometry, getMaterial(`houseRoof${roofColor}`, { color: roofColor, roughness: 0.7 }));
    flatRoof.position.y = 3.6;
    group.add(flatRoof);
  } else {
    const roofGeometry = getGeometry('housePitchedRoof', () => {
      const shape = new THREE.Shape();
      shape.moveTo(-2.75, 0);
      shape.lineTo(2.75, 0);
      shape.lineTo(0, 1.5);
      shape.lineTo(-2.75, 0);

      const extrudeSettings = {
        steps: 1,
        depth: 8.0,
        bevelEnabled: false
      };

      return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    });

    const roof = new THREE.Mesh(roofGeometry, getMaterial(`houseRoof${roofColor}`, { color: roofColor, roughness: 0.7 }));
    roof.position.set(0, 3.5, -4.0);
    roof.rotation.y = Math.PI / 2; 
    group.add(roof);
  }

  const windowMaterial = getMaterial('houseWindow', { color: 0x88CCFF, transparent: true, opacity: 0.7, roughness: 0.1 });

  const windowFrameMaterial = getMaterial('houseWindowFrame', { color: houseStyle === 2 ? 0x333333 : 0xFFFFFF, roughness: 0.5 });

  const createWindow = (x, y, z, width, height) => {
    const windowGroup = new THREE.Group();

    const windowGeometry = new THREE.PlaneGeometry(width - 0.1, height - 0.1);
    const window = new THREE.Mesh(windowGeometry, windowMaterial);
    window.position.z = 0.01;
    windowGroup.add(window);

    const frameGeometry = new THREE.BoxGeometry(width, height, 0.1);
    const frame = new THREE.Mesh(frameGeometry, windowFrameMaterial);
    windowGroup.add(frame);

    windowGroup.position.set(x, y, z);
    return windowGroup;
  };

  group.add(createWindow(-1.5, 2.0, 3.51, 1.0, 1.0));
  group.add(createWindow(1.5, 2.0, 3.51, 1.0, 1.0));

  group.add(createWindow(-2.51, 2.0, 1.0, 1.0, 1.0));
  group.add(createWindow(-2.51, 2.0, -1.0, 1.0, 1.0));
  group.add(createWindow(2.51, 2.0, 1.0, 1.0, 1.0));
  group.add(createWindow(2.51, 2.0, -1.0, 1.0, 1.0));

  group.add(createWindow(-1.5, 2.0, -3.51, 1.0, 1.0));
  group.add(createWindow(1.5, 2.0, -3.51, 1.0, 1.0));

  const doorGeometry = getGeometry('houseDoor', () => new THREE.BoxGeometry(1.0, 2.0, 0.1));

  const doorMaterial = getMaterial('houseDoor', { color: houseStyle === 0 ? 0x8B0000 : (houseStyle === 1 ? 0x8B4513 : 0x333333), roughness: 0.7 });

  const door = new THREE.Mesh(doorGeometry, doorMaterial);
  door.position.set(0, 1.0, 3.55);
  group.add(door);

  const handleGeometry = getGeometry('houseDoorHandle', () => new THREE.SphereGeometry(0.05, 8, 8));

  const handleMaterial = getMaterial('houseDoorHandle', { color: 0xC0C0C0, metalness: 0.8, roughness: 0.2 });

  const handle = new THREE.Mesh(handleGeometry, handleMaterial);
  handle.position.set(0.3, 1.0, 3.61);
  group.add(handle);

  if (houseStyle !== 2) {
    const chimneyGeometry = getGeometry('houseChimney', () => new THREE.BoxGeometry(0.6, 1.5, 0.6));

    const chimneyMaterial = getMaterial('houseChimney', { color: houseStyle === 0 ? 0x8B4513 : 0xA52A2A, roughness: 0.8 });

    const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
    chimney.position.set(1.5, 4.0, -2.0);
    group.add(chimney);

    if (Math.random() > 0.5) {
      const smokeGeometry = getGeometry('houseSmoke', () => new THREE.SphereGeometry(0.3, 8, 8));

      const smokeMaterial = getMaterial('houseSmoke', { color: 0xDDDDDD, transparent: true, opacity: 0.7, roughness: 1.0 });

      for (let i = 0; i < 3; i++) {
        const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
        smoke.position.set(1.5, 4.8 + i * 0.4, -2.0);
        smoke.scale.set(0.8 + i * 0.4, 0.8 + i * 0.4, 0.8 + i * 0.4);
        group.add(smoke);
      }
    }
  }

  const yardGeometry = getGeometry('houseYard', () => new THREE.PlaneGeometry(10.0, 12.0));

  const yardMaterial = getMaterial('houseYard', { color: 0x7CFC00, roughness: 1.0 });

  const yard = new THREE.Mesh(yardGeometry, yardMaterial);
  yard.rotation.x = -Math.PI / 2; 
  yard.position.y = 0.01;
  group.add(yard);

  const drivewayGeometry = getGeometry('houseDriveway', () => new THREE.PlaneGeometry(3.0, 5.0));

  const drivewayMaterial = getMaterial('houseDriveway', { color: 0x888888, roughness: 0.9 });

  const driveway = new THREE.Mesh(drivewayGeometry, drivewayMaterial);
  driveway.rotation.x = -Math.PI / 2; 
  driveway.position.set(-1.5, 0.015, 3.5);
  group.add(driveway);

  if (houseStyle === 0) {
    const mailboxBase = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 0.1), new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 }));
    mailboxBase.position.set(2.5, 0.5, 5.0);
    group.add(mailboxBase);

    const mailbox = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.5), new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.7 }));
    mailbox.position.set(2.5, 1.0, 5.0);
    group.add(mailbox);
  } else if (houseStyle === 1) {
    const flowerBedGeometry = new THREE.BoxGeometry(4.0, 0.2, 1.0);
    const flowerBedMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });

    const flowerBed = new THREE.Mesh(flowerBedGeometry, flowerBedMaterial);
    flowerBed.position.set(0, 0.1, 2.5);
    group.add(flowerBed);

    const flowerColors = [0xFF0000, 0xFFFF00, 0xFF69B4, 0x9932CC, 0xFFA500];

    for (let i = 0; i < 12; i++) {
      const flowerGeometry = new THREE.SphereGeometry(0.1, 8, 8);
      const flowerMaterial = new THREE.MeshStandardMaterial({ color: flowerColors[Math.floor(Math.random() * flowerColors.length)], roughness: 0.7 });

      const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
      flower.position.set(-1.5 + i * 0.3, 0.3, 2.5 + (Math.random() - 0.5) * 0.5);
      group.add(flower);

      const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8);
      const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.8 });

      const stem = new THREE.Mesh(stemGeometry, stemMaterial);
      stem.position.set(flower.position.x, 0.25, flower.position.z);
      group.add(stem);
    }
  } else {
    const decorGeometry = new THREE.BoxGeometry(0.2, 0.2, 3.0);
    const decorMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });

    const decor = new THREE.Mesh(decorGeometry, decorMaterial);
    decor.position.set(-2.0, 0.1, 1.0);
    group.add(decor);

    const featureGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const featureMaterial = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, metalness: 0.8, roughness: 0.2 });

    const feature = new THREE.Mesh(featureGeometry, featureMaterial);
    feature.position.set(2.0, 0.5, 2.0);
    group.add(feature);
  }

  group.scale.set(scale, scale, scale);
  return group;
}

function createBuilding(scale) {
  const group = new THREE.Group();

  const buildingStyle = Math.floor(Math.random() * 3);
  let buildingHeight, wallColor, windowPattern;

  if (buildingStyle === 0) {
    buildingHeight = 5 + Math.floor(Math.random() * 3);
    wallColor = [0xCCCCCC, 0xDDDDDD, 0x888888][Math.floor(Math.random() * 3)];
    windowPattern = 'grid';
  } else if (buildingStyle === 1) {
    buildingHeight = 4 + Math.floor(Math.random() * 3);
    wallColor = [0xA52A2A, 0xCD853F, 0xF5F5DC][Math.floor(Math.random() * 3)];
    windowPattern = 'rows';
  } else {
    buildingHeight = 2;
    wallColor = [0xF5F5DC, 0xFFFFFF, 0xCCCCCC][Math.floor(Math.random() * 3)];
    windowPattern = 'storefront';
  }

  const foundationGeometry = getGeometry('buildingFoundation', () => new THREE.BoxGeometry(10.0, 0.5, 10.0));

  const foundationMaterial = getMaterial('buildingFoundation', { color: 0x888888, roughness: 0.9 });

  const foundation = new THREE.Mesh(foundationGeometry, foundationMaterial);
  foundation.position.y = 0.25;
  group.add(foundation);

  const wallMaterial = getMaterial(`buildingWall${wallColor}`, { color: wallColor, roughness: 0.7 });

  const bodyGeometry = getGeometry('buildingBody', () => new THREE.BoxGeometry(9.0, buildingHeight * 3.0, 9.0));

  const body = new THREE.Mesh(bodyGeometry, wallMaterial);
  body.position.y = (buildingHeight * 3.0) / 2 + 0.5;
  group.add(body);

  if (windowPattern === 'grid') {
    const windowSize = 0.8;
    const windowSpacing = 1.2;

    for (let floor = 0; floor < buildingHeight; floor++) {
      for (let col = 0; col < 6; col++) {
        const frontWindow = new THREE.Mesh(new THREE.PlaneGeometry(windowSize, windowSize), getMaterial('buildingWindow', { color: 0x88CCFF, transparent: true, opacity: 0.7, roughness: 0.1 }));
        frontWindow.position.set(-2.5 + col * windowSpacing, 1.5 + floor * 3.0, 4.51);
        group.add(frontWindow);

        const backWindow = new THREE.Mesh(new THREE.PlaneGeometry(windowSize, windowSize), getMaterial('buildingWindow', { color: 0x88CCFF, transparent: true, opacity: 0.7, roughness: 0.1 }));
        backWindow.position.set(2.5 - col * windowSpacing, 1.5 + floor * 3.0, -4.51);
        backWindow.rotation.y = Math.PI;
        group.add(backWindow);

        if (col < 4) {
          const leftWindow = new THREE.Mesh(new THREE.PlaneGeometry(windowSize, windowSize), getMaterial('buildingWindow', { color: 0x88CCFF, transparent: true, opacity: 0.7, roughness: 0.1 }));
          leftWindow.position.set(-4.51, 1.5 + floor * 3.0, 2.0 - col * windowSpacing);
          leftWindow.rotation.y = -Math.PI / 2; 
          group.add(leftWindow);

          const rightWindow = new THREE.Mesh(new THREE.PlaneGeometry(windowSize, windowSize), getMaterial('buildingWindow', { color: 0x88CCFF, transparent: true, opacity: 0.7, roughness: 0.1 }));
          rightWindow.position.set(4.51, 1.5 + floor * 3.0, -2.0 + col * windowSpacing);
          rightWindow.rotation.y = Math.PI / 2; 
          group.add(rightWindow);
        }
      }
    }
  } else if (windowPattern === 'rows') {
    const windowWidth = 0.8;
    const windowHeight = 1.2;
    const windowSpacing = 1.8;

    for (let floor = 0; floor < buildingHeight; floor++) {
      for (let col = 0; col < 4; col++) {
        const frontWindow = new THREE.Mesh(new THREE.PlaneGeometry(windowWidth, windowHeight), getMaterial('buildingWindow', { color: 0x88CCFF, transparent: true, opacity: 0.7, roughness: 0.1 }));
        frontWindow.position.set(-3.0 + col * windowSpacing, 1.5 + floor * 3.0, 4.51);
        group.add(frontWindow);

        const backWindow = new THREE.Mesh(new THREE.PlaneGeometry(windowWidth, windowHeight), getMaterial('buildingWindow', { color: 0x88CCFF, transparent: true, opacity: 0.7, roughness: 0.1 }));
        backWindow.position.set(3.0 - col * windowSpacing, 1.5 + floor * 3.0, -4.51);
        backWindow.rotation.y = Math.PI;
        group.add(backWindow);

        if (col < 3) {
          const leftWindow = new THREE.Mesh(new THREE.PlaneGeometry(windowWidth, windowHeight), getMaterial('buildingWindow', { color: 0x88CCFF, transparent: true, opacity: 0.7, roughness: 0.1 }));
          leftWindow.position.set(-4.51, 1.5 + floor * 3.0, 1.5 - col * windowSpacing);
          leftWindow.rotation.y = -Math.PI / 2; 
          group.add(leftWindow);

          const rightWindow = new THREE.Mesh(new THREE.PlaneGeometry(windowWidth, windowHeight), getMaterial('buildingWindow', { color: 0x88CCFF, transparent: true, opacity: 0.7, roughness: 0.1 }));
          rightWindow.position.set(4.51, 1.5 + floor * 3.0, -1.5 + col * windowSpacing);
          rightWindow.rotation.y = Math.PI / 2; 
          group.add(rightWindow);
        }
      }
    }
  } else if (windowPattern === 'storefront') {
    const displayGeometry = new THREE.PlaneGeometry(7.0, 2.0);
    const display = new THREE.Mesh(displayGeometry, getMaterial('buildingWindow', { color: 0x88CCFF, transparent: true, opacity: 0.7, roughness: 0.1 }));
    display.position.set(0, 1.5, 4.51);
    group.add(display);

    const doorGeometry = new THREE.PlaneGeometry(1.0, 2.0);
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });

    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 1.0, 4.52);
    group.add(door);

    const signGeometry = new THREE.BoxGeometry(5.0, 0.8, 0.2);
    const signMaterial = new THREE.MeshStandardMaterial({ color: [0xFF0000, 0x0000FF, 0x00FF00, 0xFFFF00][Math.floor(Math.random() * 4)], roughness: 0.5 });

    const sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.set(0, 3.0, 4.6);
    group.add(sign);

    for (let i = 0; i < 5; i++) {
      const productGeometry = new THREE.BoxGeometry(0.3 + Math.random() * 0.3, 0.3 + Math.random() * 0.3, 0.3 + Math.random() * 0.3);

      const productMaterial = new THREE.MeshStandardMaterial({ color: Math.random() * 0xFFFFFF, roughness: 0.5 });

      const product = new THREE.Mesh(productGeometry, productMaterial);
      product.position.set(-3.0 + i * 1.5, 0.8, 4.0);
      group.add(product);
    }
  }

  const roofGeometry = getGeometry('buildingRoof', () => new THREE.BoxGeometry(9.0, 0.3, 9.0));

  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 });

  const roof = new THREE.Mesh(roofGeometry, roofMaterial);
  roof.position.y = buildingHeight * 3.0 + 0.65;
  group.add(roof);

  const hvacGeometry = new THREE.BoxGeometry(1.0, 0.8, 1.5);
  const hvacMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.7 });

  const hvac1 = new THREE.Mesh(hvacGeometry, hvacMaterial);
  hvac1.position.set(-3.0, buildingHeight * 3.0 + 1.2, -2.0);
  group.add(hvac1);

  const hvac2 = new THREE.Mesh(hvacGeometry, hvacMaterial);
  hvac2.position.set(2.0, buildingHeight * 3.0 + 1.2, 3.0);
  group.add(hvac2);

  const accessGeometry = new THREE.BoxGeometry(2.0, 1.5, 2.0);

  const access = new THREE.Mesh(accessGeometry, wallMaterial);
  access.position.set(0, buildingHeight * 3.0 + 1.55, 0);
  group.add(access);

  const sidewalkGeometry = new THREE.BoxGeometry(12.0, 0.2, 12.0);
  const sidewalkMaterial = new THREE.MeshStandardMaterial({ color: 0xCCCCCC, roughness: 0.9 });

  const sidewalk = new THREE.Mesh(sidewalkGeometry, sidewalkMaterial);
  sidewalk.position.y = 0.1;
  group.add(sidewalk);

  group.scale.set(scale, scale, scale);
  return group;
}

function createSkyscraper(scale) {
  const group = new THREE.Group();

  const skyscraperStyle = Math.floor(Math.random() * 3);
  let wallColor, windowPattern, height;

  if (skyscraperStyle === 0) {
    wallColor = [0x88CCFF, 0x444444, 0x222222][Math.floor(Math.random() * 3)];
    windowPattern = 'glass';
    height = 20 + Math.floor(Math.random() * 10);
  } else if (skyscraperStyle === 1) {
    wallColor = [0xDDDDDD, 0xCCCCCC, 0xBBBBBB][Math.floor(Math.random() * 3)];
    windowPattern = 'deco';
    height = 15 + Math.floor(Math.random() * 10);
  } else {
    wallColor = [0xFFFFFF, 0xF5F5DC, 0xDDDDDD][Math.floor(Math.random() * 3)];
    windowPattern = 'postmodern';
    height = 10 + Math.floor(Math.random() * 15);
  }

  const foundationGeometry = getGeometry('skyscraperFoundation', () => new THREE.BoxGeometry(16.0, 1.0, 16.0));

  const foundationMaterial = getMaterial('skyscraperFoundation', { color: 0x888888, roughness: 0.9 });

  const foundation = new THREE.Mesh(foundationGeometry, foundationMaterial);
  foundation.position.y = 0.5;
  group.add(foundation);

  let mainBody;

  if (skyscraperStyle === 0) {
    if (Math.random() > 0.5) {
      const bodyGeometry = getGeometry('modernSkyscraper', () => new THREE.BoxGeometry(12.0, height * 3.0, 12.0));

      mainBody = new THREE.Mesh(bodyGeometry, new THREE.MeshStandardMaterial({ color: wallColor, metalness: 0.8, roughness: 0.2 }));
    } else {
      const bodyGeometry = getGeometry('taperedSkyscraper', () => new THREE.BoxGeometry(12.0, height * 3.0, 12.0));

      mainBody = new THREE.Mesh(bodyGeometry, new THREE.MeshStandardMaterial({ color: wallColor, metalness: 0.8, roughness: 0.2 }));
    }
  } else if (skyscraperStyle === 1) {
    const segments = Math.floor(Math.random() * 3) + 3;
    const bodyGroup = new THREE.Group();

    for (let i = 0; i < segments; i++) {
      const segmentSize = 12.0 - (i * 1.5);
      const segmentHeight = (i === segments - 1) ? height * 3.0 * 0.4 : height * 3.0 * (0.6 / (segments - 1));

      const segmentGeometry = new THREE.BoxGeometry(segmentSize, segmentHeight, segmentSize);
      const segment = new THREE.Mesh(segmentGeometry, new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.7 }));

      const previousHeight = i === 0 ? 0 : bodyGroup.children.reduce((sum, child, index) => {
        return sum + (index < i ? child.geometry.parameters.height : 0);
      }, 0);

      segment.position.y = previousHeight + segmentHeight / 2;
      bodyGroup.add(segment);
    }

    const spireGeometry = getGeometry('skyscraperSpire', () => new THREE.CylinderGeometry(0.5, 1.0, height * 3.0 * 0.2, 8));

    const spire = new THREE.Mesh(spireGeometry, new THREE.MeshStandardMaterial({ color: 0xCCCCCC, metalness: 0.8, roughness: 0.2 }));

    spire.position.y = bodyGroup.children.reduce((sum, child) => sum + child.geometry.parameters.height, 0) + height * 3.0 * 0.1;
    bodyGroup.add(spire);

    mainBody = bodyGroup;
  } else {
    const randomShape = Math.floor(Math.random() * 3);

    if (randomShape === 0) {
      const bodyGeometry = getGeometry('twistedSkyscraper', () => new THREE.BoxGeometry(12.0, height * 3.0, 12.0));

      mainBody = new THREE.Mesh(bodyGeometry, new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.5 }));
    } else if (randomShape === 1) {
      const bodyGeometry = getGeometry('cylindricalSkyscraper', () => new THREE.CylinderGeometry(6.0, 6.0, height * 3.0, 24));

      mainBody = new THREE.Mesh(bodyGeometry, new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.5 }));
    } else {
      const bodyGroup = new THREE.Group();

      const mainTowerGeometry = getGeometry('skyscraperMainTower', () => new THREE.BoxGeometry(8.0, height * 3.0, 8.0));

      const mainTower = new THREE.Mesh(mainTowerGeometry, new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.5 }));
      mainTower.position.y = height * 1.5;
      bodyGroup.add(mainTower);

      const secondaryHeight = height * 0.7;
      const secondaryTowerGeometry = getGeometry('skyscraperSecondaryTower', () => new THREE.BoxGeometry(6.0, secondaryHeight * 3.0, 6.0));

      const secondaryTower = new THREE.Mesh(secondaryTowerGeometry, new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.5 }));
      secondaryTower.position.set(7.0, secondaryHeight * 1.5, 0);
      bodyGroup.add(secondaryTower);

      const connectionGeometry = getGeometry('skyscraperConnection', () => new THREE.BoxGeometry(5.0, 2.0, 6.0));

      const connection = new THREE.Mesh(connectionGeometry, new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.5 }));
      connection.position.set(3.5, height * 3.0 * 0.4, 0);
      bodyGroup.add(connection);

      mainBody = bodyGroup;
    }
  }

  mainBody.position.y = height * 1.5 + 1.0;
  group.add(mainBody);

  if (windowPattern === 'glass') {
    const dividerHeight = 0.1;
    const floorHeight = 3.0;
    const dividerCount = Math.floor(height) - 1;

    for (let i = 1; i <= dividerCount; i++) {
      const dividerGeometry = new THREE.BoxGeometry(12.2, dividerHeight, 12.2);
      const dividerMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 });

      const divider = new THREE.Mesh(dividerGeometry, dividerMaterial);
      divider.position.y = i * floorHeight + 1.0;
      group.add(divider);
    }
  } else if (windowPattern === 'deco') {
    const windowMaterial = getMaterial('skyscraperWindow', { color: 0x88CCFF, transparent: true, opacity: 0.7, roughness: 0.1 });

    for (let face = 0; face < 4; face++) {
      const rotation = face * Math.PI / 2;

      for (let i = 0; i < 5; i++) {
        const windowStripGeometry = new THREE.BoxGeometry(0.5, height * 2.5, 0.1);
        const windowStrip = new THREE.Mesh(windowStripGeometry, windowMaterial);

        const offset = -4 + i * 2;
        windowStrip.position.set(Math.sin(rotation) * 6.01, height * 1.5 + 1.0, Math.cos(rotation) * 6.01);

        if (face === 0 || face === 2) {
          windowStrip.position.x += offset;
        } else {
          windowStrip.position.z += offset;
        }

        windowStrip.rotation.y = rotation;
        group.add(windowStrip);
      }

      const decorGeometry = new THREE.BoxGeometry(10.0, 1.0, 0.2);
      const decorMaterial = new THREE.MeshStandardMaterial({ color: 0xA0A0A0, roughness: 0.7 });

      const topDecor = new THREE.Mesh(decorGeometry, decorMaterial);
      topDecor.position.set(Math.sin(rotation) * 6.01, height * 2.9 + 1.0, Math.cos(rotation) * 6.01);
      topDecor.rotation.y = rotation;
      group.add(topDecor);

      const midDecor = new THREE.Mesh(decorGeometry, decorMaterial);
      midDecor.position.set(Math.sin(rotation) * 6.01, height * 1.5 + 1.0, Math.cos(rotation) * 6.01);
      midDecor.rotation.y = rotation;
      group.add(midDecor);

      const bottomDecor = new THREE.Mesh(decorGeometry, decorMaterial);
      bottomDecor.position.set(Math.sin(rotation) * 6.01, height * 0.1 + 1.0, Math.cos(rotation) * 6.01);
      bottomDecor.rotation.y = rotation;
      group.add(bottomDecor);
    }
  } else if (windowPattern === 'postmodern') {
    const windowMaterial = getMaterial('skyscraperWindow', { color: 0x88CCFF, transparent: true, opacity: 0.7, roughness: 0.1 });

    const windowCount = height * 20;

    for (let i = 0; i < windowCount; i++) {
      const windowSize = 0.3 + Math.random() * 0.7;
      const windowGeometry = new THREE.PlaneGeometry(windowSize, windowSize);
      const window = new THREE.Mesh(windowGeometry, windowMaterial);

      const face = Math.floor(Math.random() * 4);
      const rotation = face * Math.PI / 2;

      const xOffset = (Math.random() - 0.5) * 10;
      const yOffset = 1.0 + Math.random() * (height * 3.0 - 2.0);

      window.position.set(Math.sin(rotation) * 6.01, yOffset, Math.cos(rotation) * 6.01);

      if (face === 0 || face === 2) {
        window.position.x += xOffset;
      } else {
        window.position.z += xOffset;
      }

      window.rotation.y = rotation;
      group.add(window);
    }
  }

  const helipadGeometry = getGeometry('skyscraperHelipad', () => new THREE.CylinderGeometry(3.0, 3.0, 0.2, 16));

  const helipadMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 });

  const helipad = new THREE.Mesh(helipadGeometry, helipadMaterial);
  helipad.position.y = height * 3.0 + 1.1;
  group.add(helipad);

  const markingGeometry = new THREE.PlaneGeometry(5.0, 5.0);
  const markingMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.7, map: createHelipadTexture() });

  const marking = new THREE.Mesh(markingGeometry, markingMaterial);
  marking.position.y = height * 3.0 + 1.21;
  marking.rotation.x = -Math.PI / 2; 
  group.add(marking);

  for (let i = 0; i < 3; i++) {
    const antennaGeometry = getGeometry('skyscraperAntenna', () => new THREE.CylinderGeometry(0.1, 0.1, 2.0, 8));

    const antennaMaterial = getMaterial('skyscraperAntenna', { color: 0xCCCCCC, metalness: 0.8, roughness: 0.2 });

    const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);

    const angle = i * Math.PI * 2 / 3; 
    antenna.position.set(Math.cos(angle) * 4.0, height * 3.0 + 2.1, Math.sin(angle) * 4.0);

    group.add(antenna);

    const lightGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const lightMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000, emissive: 0xFF0000, emissiveIntensity: 1.0 });

    const light = new THREE.Mesh(lightGeometry, lightMaterial);
    light.position.y = 1.0;
    antenna.add(light);
  }

  const plazaGeometry = getGeometry('skyscraperPlaza', () => new THREE.CircleGeometry(20.0, 32));

  const plazaMaterial = new THREE.MeshStandardMaterial({ color: 0xAAAAAA, roughness: 0.9 });

  const plaza = new THREE.Mesh(plazaGeometry, plazaMaterial);
  plaza.rotation.x = -Math.PI / 2; 
  plaza.position.y = 0.02;
  group.add(plaza);

  const entranceWidth = 6.0;
  const entranceHeight = 4.0;
  const entranceDepth = 2.0;

  const entranceGeometry = new THREE.BoxGeometry(entranceWidth, entranceHeight, entranceDepth);
  const entrance = new THREE.Mesh(entranceGeometry, new THREE.MeshStandardMaterial({ color: 0x000000 }));
  entrance.position.set(0, entranceHeight / 2 + 1.0, 8.0 - entranceDepth / 2);
  group.add(entrance);

  const glassGeometry = new THREE.PlaneGeometry(entranceWidth - 0.5, entranceHeight - 0.5);
  const glassMaterial = new THREE.MeshStandardMaterial({ color: 0x88CCFF, transparent: true, opacity: 0.7, roughness: 0.1 });

  const glass = new THREE.Mesh(glassGeometry, glassMaterial);
  glass.position.set(0, entranceHeight / 2 + 1.0, 8.01);
  group.add(glass);

  const doorGeometry = new THREE.PlaneGeometry(1.0, 2.0);
  const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.2 });

  const leftDoor = new THREE.Mesh(doorGeometry, doorMaterial);
  leftDoor.position.set(-entranceWidth/2 + 0.5, entranceHeight / 2 + 1.0, 8.02);
  group.add(leftDoor);

  const rightDoor = new THREE.Mesh(doorGeometry, doorMaterial);
  rightDoor.position.set(entranceWidth/2 - 0.5, entranceHeight / 2 + 1.0, 8.02);
  group.add(rightDoor);

  for (let i = 0; i < 4; i++) {
    const angle = i * Math.PI / 2 + Math.PI / 4;

    const benchGeometry = new THREE.BoxGeometry(3.0, 0.5, 0.8);
    const benchMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });

    const bench = new THREE.Mesh(benchGeometry, benchMaterial);
    bench.position.set(Math.cos(angle) * 12.0, 0.25, Math.sin(angle) * 12.0);
    bench.rotation.y = angle + Math.PI / 2; 
    group.add(bench);
  }

  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;

    const planterGeometry = new THREE.CylinderGeometry(1.0, 1.0, 0.8, 16);
    const planterMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });

    const planter = new THREE.Mesh(planterGeometry, planterMaterial);
    planter.position.set(Math.cos(angle) * 15.0, 0.4, Math.sin(angle) * 15.0);

    if (Math.random() > 0.3) {
      const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2.0, 8);
      const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });

      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 1.4;
      planter.add(trunk);

      const foliageGeometry = new THREE.SphereGeometry(1.0, 8, 8);
      const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.8 });

      const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
      foliage.position.y = 2.5;
      planter.add(foliage);
    } else {
      const sculptureGeometry = new THREE.TorusKnotGeometry(0.6, 0.2, 64, 8, 2, 3);
      const sculptureMaterial = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, metalness: 0.8, roughness: 0.2 });

      const sculpture = new THREE.Mesh(sculptureGeometry, sculptureMaterial);
      sculpture.position.y = 1.5;
      sculpture.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      planter.add(sculpture);
    }
  }

  group.scale.set(scale, scale, scale);
  return group;
}

function createHelipadTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');

  context.fillStyle = '#333';
  context.fillRect(0, 0, 256, 256);

  context.fillStyle = '#FFF';

  context.fillRect(90, 80, 20, 96);
  context.fillRect(146, 80, 20, 96);

  context.fillRect(90, 118, 76, 20);

  context.strokeStyle = '#FFF';
  context.lineWidth = 10;
  context.beginPath();
  context.arc(128, 128, 100, 0, Math.PI * 2);
  context.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}