import * as THREE from './vendor/three.module.js';

const canvas = document.getElementById('library3d');
const home = document.getElementById('home');
const storageKey = 'piano-library-visitor-3d-v1';
const colors = ['#e9b79d', '#d8bde5', '#e9d28f', '#a8c9b4', '#a9c8dc', '#dfadae', '#c8c4a7'];
const animals = ['rabbit', 'bear', 'cat'];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function saveVisitor(visitor) {
  try { localStorage.setItem(storageKey, JSON.stringify(visitor)); } catch (_) { /* Private browsing may block storage. */ }
}

function loadVisitor() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && colors.includes(saved.color) && animals.includes(saved.animal) &&
        Number.isFinite(saved.x) && Number.isFinite(saved.z)) {
      saved.x = clamp(saved.x, -4, 4);
      saved.z = clamp(saved.z, -3, 4);
      return saved;
    }
  } catch (_) { /* Start fresh if storage is unavailable. */ }
  const visitor = {
    color: colors[Math.floor(Math.random() * colors.length)],
    animal: animals[Math.floor(Math.random() * animals.length)],
    x: (Math.random() - .5) * 3,
    z: 1 + Math.random() * 1.5,
  };
  saveVisitor(visitor);
  return visitor;
}

const visitor = loadVisitor();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
camera.position.set(0, 6, 18);
camera.lookAt(0, 3.25, 0);

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.6;

scene.add(new THREE.HemisphereLight('#fff6e4', '#59453a', 2.6));
const lamp = new THREE.DirectionalLight('#fff1d1', 3.2);
lamp.position.set(-4, 8, 7);
scene.add(lamp);
const rim = new THREE.DirectionalLight('#e3c795', 1.5);
rim.position.set(4, 5, -4);
scene.add(rim);

const coat = new THREE.MeshStandardMaterial({ color: visitor.color, roughness: .86 });
const paw = new THREE.MeshStandardMaterial({ color: visitor.color, roughness: .93 });
const sphere = new THREE.SphereGeometry(1, 32, 24);
const animal = new THREE.Group();
scene.add(animal);

function ellipsoid(material, position, scale, parent = animal) {
  const mesh = new THREE.Mesh(sphere, material);
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  parent.add(mesh);
  return mesh;
}

ellipsoid(coat, [0, .69, 0], [.45, .57, .35]);
ellipsoid(coat, [0, 1.42, .03], [.59, .57, .49]);
ellipsoid(paw, [-.34, .58, .08], [.17, .31, .23]);
ellipsoid(paw, [.34, .58, .08], [.17, .31, .23]);
ellipsoid(paw, [-.23, .14, .18], [.22, .15, .31]);
ellipsoid(paw, [.23, .14, .18], [.22, .15, .31]);

if (visitor.animal === 'rabbit') {
  ellipsoid(coat, [-.36, 2.04, -.02], [.18, .48, .19]).rotation.z = .15;
  ellipsoid(coat, [.36, 2.04, -.02], [.18, .48, .19]).rotation.z = -.15;
  ellipsoid(paw, [0, .5, .38], [.19, .2, .19]);
} else if (visitor.animal === 'bear') {
  ellipsoid(coat, [-.46, 1.88, -.04], [.24, .24, .18]);
  ellipsoid(coat, [.46, 1.88, -.04], [.24, .24, .18]);
  ellipsoid(paw, [0, .47, .37], [.16, .17, .16]);
} else {
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(.25, .53, 4), coat);
    ear.position.set(side * .42, 1.99, -.03);
    ear.rotation.y = Math.PI / 4;
    ear.rotation.z = -side * .16;
    animal.add(ear);
  }
  const tail = ellipsoid(coat, [.49, .62, .28], [.12, .42, .13]);
  tail.rotation.z = -.56;
}

const shadow = new THREE.Mesh(
  new THREE.CircleGeometry(.68, 40),
  new THREE.MeshBasicMaterial({ color: '#160f0a', transparent: true, opacity: .42, depthWrite: false }),
);
shadow.rotation.x = -Math.PI / 2;
shadow.position.y = .01;
scene.add(shadow);

const pressed = new Set();
let facing = 0;
let pointer = null;
let previousTime = 0;
let lastSize = { width: 0, height: 0 };

function positionAnimal() {
  animal.position.set(visitor.x, 0, visitor.z);
  shadow.position.x = visitor.x;
  shadow.position.z = visitor.z;
}

function resize() {
  const { width, height } = canvas.getBoundingClientRect();
  const w = Math.round(width), h = Math.round(height);
  if (!w || !h || (w === lastSize.width && h === lastSize.height)) return;
  lastSize = { width: w, height: h };
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}

function move(dx, dz) {
  visitor.x = clamp(visitor.x + dx, -4, 4);
  visitor.z = clamp(visitor.z + dz, -3, 4);
  if (Math.abs(dx) + Math.abs(dz) > .001) facing = Math.atan2(dx, dz);
  positionAnimal();
}

const arrows = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);
window.addEventListener('keydown', event => {
  if (!arrows.has(event.key) || home.classList.contains('hidden') ||
      /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')) return;
  event.preventDefault();
  pressed.add(event.key);
});
window.addEventListener('keyup', event => {
  if (!arrows.has(event.key)) return;
  pressed.delete(event.key);
  saveVisitor(visitor);
});
window.addEventListener('blur', () => { pressed.clear(); saveVisitor(visitor); });

canvas.addEventListener('pointerdown', event => {
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
  canvas.setPointerCapture(event.pointerId);
  event.preventDefault();
});
canvas.addEventListener('pointermove', event => {
  if (!pointer || pointer.id !== event.pointerId) return;
  const rect = canvas.getBoundingClientRect();
  move((event.clientX - pointer.x) * 9 / rect.width, (event.clientY - pointer.y) * 7 / rect.height);
  pointer.x = event.clientX;
  pointer.y = event.clientY;
});
for (const type of ['pointerup', 'pointercancel']) {
  canvas.addEventListener(type, event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    pointer = null;
    saveVisitor(visitor);
  });
}

function frame(time) {
  const dt = Math.min((time - (previousTime || time)) / 1000, .05);
  previousTime = time;
  if (!home.classList.contains('hidden')) {
    const dx = (Number(pressed.has('ArrowRight')) - Number(pressed.has('ArrowLeft'))) * dt * 2.8;
    const dz = (Number(pressed.has('ArrowDown')) - Number(pressed.has('ArrowUp'))) * dt * 2.8;
    if (dx || dz) move(dx, dz);
    animal.rotation.y += (facing - animal.rotation.y) * Math.min(dt * 7, 1);
    animal.position.y = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : Math.sin(time / 430) * .035;
    resize();
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}

positionAnimal();
requestAnimationFrame(frame);
