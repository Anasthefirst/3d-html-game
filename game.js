import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a1424);
scene.fog = new THREE.Fog(0x0a1424, 18, 80);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 250);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const clock = new THREE.Clock();

const ambientLight = new THREE.HemisphereLight(0xcfe8ff, 0x18314d, 1.5);
scene.add(ambientLight);

const sun = new THREE.DirectionalLight(0xffffff, 1.4);
sun.position.set(8, 18, 10);
scene.add(sun);

const world = new THREE.Group();
scene.add(world);

const floorPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 80),
  new THREE.MeshStandardMaterial({ color: 0x1b2d31, roughness: 0.9, metalness: 0.1 })
);
floorPlane.rotation.x = -Math.PI / 2;
floorPlane.position.y = -1;
world.add(floorPlane);

const grid = new THREE.GridHelper(80, 80, 0x5dc7ff, 0x2d4d5b);
grid.position.y = -0.98;
world.add(grid);

const wallMaterial = new THREE.MeshStandardMaterial({
  color: 0x6bb9ff,
  emissive: 0x0f2445,
  roughness: 0.55,
  metalness: 0.35
});

const obstacleData = [
  { position: new THREE.Vector3(0, 1.5, 0), size: new THREE.Vector3(4, 3, 4) },
  { position: new THREE.Vector3(-7, 1.25, 4.5), size: new THREE.Vector3(3, 2.5, 2.5) },
  { position: new THREE.Vector3(9, 1.1, -6), size: new THREE.Vector3(2.5, 2.2, 6) },
  { position: new THREE.Vector3(-10, 0.9, -8), size: new THREE.Vector3(5, 1.8, 3) },
  { position: new THREE.Vector3(6, 2.2, 8), size: new THREE.Vector3(4, 4.4, 2) },
  { position: new THREE.Vector3(-3, 0.7, 10), size: new THREE.Vector3(6, 1.4, 2.5) },
  { position: new THREE.Vector3(-14, 3, -1), size: new THREE.Vector3(2.5, 6, 2.5) },
  { position: new THREE.Vector3(14, 1.3, 2), size: new THREE.Vector3(3, 2.6, 4) }
];

const obstacles = [];
for (const obstacle of obstacleData) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), wallMaterial);
  mesh.scale.copy(obstacle.size);
  mesh.position.copy(obstacle.position);
  world.add(mesh);
  obstacles.push({
    min: new THREE.Vector3().copy(obstacle.position).sub(obstacle.size.clone().multiplyScalar(0.5)),
    max: new THREE.Vector3().copy(obstacle.position).add(obstacle.size.clone().multiplyScalar(0.5))
  });
}

const goal = new THREE.Mesh(
  new THREE.OctahedronGeometry(0.8, 0),
  new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0x4d400d, roughness: 0.4, metalness: 0.6 })
);
goal.position.set(15, 3.5, 15);
world.add(goal);

const finishRing = new THREE.Mesh(
  new THREE.TorusGeometry(2.2, 0.18, 12, 32),
  new THREE.MeshStandardMaterial({ color: 0x9ae66e, emissive: 0x123d10, roughness: 0.25, metalness: 0.6 })
);
finishRing.rotation.x = Math.PI / 2;
finishRing.position.copy(goal.position);
world.add(finishRing);

const player = {
  position: new THREE.Vector3(0, 2.4, 18),
  velocity: new THREE.Vector3(),
  halfSize: new THREE.Vector3(0.5, 0.9, 0.5),
  onGround: false,
  speed: 9,
  jumpStrength: 7.5
};

const playerMesh = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1.8, 1),
  new THREE.MeshStandardMaterial({ color: 0xf2f7ff, emissive: 0x1b2c42, roughness: 0.4, metalness: 0.3 })
);
playerMesh.position.copy(player.position);
scene.add(playerMesh);

const cameraOffset = new THREE.Vector3(0, 3.4, 6.8);
const input = { forward: false, back: false, left: false, right: false, jump: false };

window.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'KeyW':
      input.forward = true;
      break;
    case 'KeyS':
      input.back = true;
      break;
    case 'KeyA':
      input.left = true;
      break;
    case 'KeyD':
      input.right = true;
      break;
    case 'Space':
      input.jump = true;
      break;
  }
});

window.addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'KeyW':
      input.forward = false;
      break;
    case 'KeyS':
      input.back = false;
      break;
    case 'KeyA':
      input.left = false;
      break;
    case 'KeyD':
      input.right = false;
      break;
    case 'Space':
      input.jump = false;
      break;
  }
});

function getPlayerMin() {
  return new THREE.Vector3(
    player.position.x - player.halfSize.x,
    player.position.y - player.halfSize.y,
    player.position.z - player.halfSize.z
  );
}

function getPlayerMax() {
  return new THREE.Vector3(
    player.position.x + player.halfSize.x,
    player.position.y + player.halfSize.y,
    player.position.z + player.halfSize.z
  );
}

function resolveAxis(axis, delta) {
  if (delta === 0) return;

  const previous = player.position[axis];
  player.position[axis] += delta;

  const min = getPlayerMin();
  const max = getPlayerMax();

  for (const obstacle of obstacles) {
    const intersects = max.x > obstacle.min.x && min.x < obstacle.max.x &&
      max.y > obstacle.min.y && min.y < obstacle.max.y &&
      max.z > obstacle.min.z && min.z < obstacle.max.z;

    if (!intersects) continue;

    if (delta > 0) {
      player.position[axis] = obstacle.min[axis] - player.halfSize[axis] - 0.001;
    } else {
      player.position[axis] = obstacle.max[axis] + player.halfSize[axis] + 0.001;
    }

    player.velocity[axis] = 0;
    if (axis === 'y' && delta < 0) {
      player.onGround = true;
    }
    break;
  }

  if (axis === 'y' && player.position.y < -0.9) {
    player.position.y = 0.6;
    player.velocity.y = 0;
    player.onGround = true;
  }

  if (axis === 'y' && player.position.y > 18) {
    player.position.y = 18;
    player.velocity.y = Math.min(player.velocity.y, 0);
  }

  if (axis !== 'y' && player.position[axis] !== previous && Math.abs(player.position[axis] - previous) > 0.5) {
    player.position[axis] = previous;
  }
}

function updatePlayer(dt) {
  const move = new THREE.Vector3();
  const forward = new THREE.Vector3(0, 0, -1);
  const right = new THREE.Vector3(1, 0, 0);

  if (input.forward) move.add(forward);
  if (input.back) move.sub(forward);
  if (input.left) move.sub(right);
  if (input.right) move.add(right);

  if (move.lengthSq() > 0) {
    move.normalize().multiplyScalar(player.speed);
  }

  player.velocity.x = THREE.MathUtils.lerp(player.velocity.x, move.x, 0.15);
  player.velocity.z = THREE.MathUtils.lerp(player.velocity.z, move.z, 0.15);

  if (input.jump && player.onGround) {
    player.velocity.y = player.jumpStrength;
    player.onGround = false;
  }

  player.velocity.y += -18 * dt;

  const stepX = player.velocity.x * dt;
  const stepY = player.velocity.y * dt;
  const stepZ = player.velocity.z * dt;

  resolveAxis('x', stepX);
  resolveAxis('y', stepY);
  resolveAxis('z', stepZ);

  if (player.position.y <= -0.9) {
    player.position.y = 0.6;
    player.velocity.y = 0;
    player.onGround = true;
  }

  if (Math.abs(player.velocity.x) < 0.01) player.velocity.x = 0;
  if (Math.abs(player.velocity.z) < 0.01) player.velocity.z = 0;

  playerMesh.position.copy(player.position);
}

function updateCamera() {
  const cameraTarget = player.position.clone();
  const lookTarget = new THREE.Vector3(player.position.x, player.position.y + 1.2, player.position.z);
  const offset = cameraOffset.clone();

  camera.position.lerp(cameraTarget.clone().add(offset), 0.08);
  camera.lookAt(lookTarget);
}

function animate() {
  const dt = Math.min(clock.getDelta(), 0.033);
  updatePlayer(dt);
  updateCamera();

  goal.rotation.y += dt * 1.5;
  finishRing.rotation.z += dt * 1.2;

  const goalDistance = goal.position.distanceTo(player.position);
  if (goalDistance < 2.2) {
    goal.position.x = (Math.random() - 0.5) * 28;
    goal.position.z = (Math.random() - 0.5) * 28;
    goal.position.y = 1.5 + Math.random() * 4;
    finishRing.position.copy(goal.position);
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

camera.position.set(0, 6, 10);
camera.lookAt(0, 1.5, 0);
animate();
