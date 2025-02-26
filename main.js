import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Stats from 'stats.js';
import fragmentShader from './shaders/fragment.glsl';
import vertexShader from './shaders/vertex.glsl';
import fishFragmentShader from './shaders/fish-fragment.glsl';
import fishVertexShader from './shaders/fish-vertex.glsl';
import waterFragmentShader from './shaders/water-fragment.glsl';
import waterVertexShader from './shaders/water-vertex.glsl';

// Performance monitoring
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
  canvas: document.getElementById("three-canvas"), 
  alpha: true,
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
camera.position.z = 5;

// Water effect setup
const waterGeometry = new THREE.PlaneGeometry(50, 50, 100, 100);
const waterMaterial = new THREE.ShaderMaterial({
  vertexShader: waterVertexShader,
  fragmentShader: waterFragmentShader,
  uniforms: {
    uTime: { value: 0 },
    uBigWavesElevation: { value: 0.2 },
    uBigWavesFrequency: { value: new THREE.Vector2(4, 1.5) },
    uBigWavesSpeed: { value: 0.75 },
    uSmallWavesElevation: { value: 0.15 },
    uSmallWavesFrequency: { value: 3 },
    uSmallWavesSpeed: { value: 0.2 },
    uSmallWavesIterations: { value: 4 },
    uDepthColor: { value: new THREE.Color('#1e4d40') },
    uSurfaceColor: { value: new THREE.Color('#4d9aaa') },
    uColorOffset: { value: 0.08 },
    uColorMultiplier: { value: 5 }
  },
  transparent: true,
  side: THREE.DoubleSide
});

const water = new THREE.Mesh(waterGeometry, waterMaterial);
water.rotation.x = -Math.PI * 0.5;
water.position.y = -5;
scene.add(water);

// Fish class with improved physics
class Fish {
  constructor(texture, size = 1) {
    const geometry = new THREE.PlaneGeometry(size, size * 0.6);
    
    this.material = new THREE.ShaderMaterial({
      vertexShader: fishVertexShader,
      fragmentShader: fishFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uTexture: { value: texture },
        uWaveAmplitude: { value: 0.1 },
        uWaveFrequency: { value: 3.0 },
        uDistortion: { value: 0.0 },
        uProgress: { value: 0.0 }
      },
      transparent: true,
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02,
      0
    );
    this.acceleration = new THREE.Vector3();
    this.maxSpeed = 0.05;
    this.maxForce = 0.002;
    this.targetRotation = 0;
    this.rotationSpeed = 0.1;
    
    // Add trail effect
    this.trail = new THREE.Points(
      new THREE.BufferGeometry(),
      new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: 30.0 },
          uColor: { value: new THREE.Color(0xffffff) }
        },
        transparent: true,
        blending: THREE.AdditiveBlending
      })
    );
    
    this.trailPoints = [];
    this.maxTrailLength = 20;
    scene.add(this.trail);
  }

  update(time, bounds, fishes) {
    // Update shader uniforms
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uDistortion.value = Math.sin(time) * 0.1;
    
    // Apply flocking behavior
    const separation = this.separate(fishes);
    const alignment = this.align(fishes);
    const cohesion = this.cohesion(fishes);
    
    separation.multiplyScalar(1.5);
    alignment.multiplyScalar(1.0);
    cohesion.multiplyScalar(1.0);
    
    this.acceleration.add(separation);
    this.acceleration.add(alignment);
    this.acceleration.add(cohesion);
    
    // Add wave motion
    this.acceleration.y += Math.sin(time * 2 + this.mesh.position.x) * 0.0005;
    
    // Update velocity with smooth acceleration
    this.velocity.add(this.acceleration);
    this.velocity.clampLength(0, this.maxSpeed);
    
    // Update position
    this.mesh.position.add(this.velocity);
    
    // Update rotation with smooth interpolation
    this.targetRotation = Math.atan2(this.velocity.y, this.velocity.x);
    this.mesh.rotation.z += (this.targetRotation - this.mesh.rotation.z) * this.rotationSpeed;
    
    // Reset acceleration
    this.acceleration.multiplyScalar(0);
    
    // Update trail
    this.updateTrail();
    
    // Wrap around bounds
    this.wrap(bounds);
  }

  updateTrail() {
    // Add current position to trail
    this.trailPoints.unshift(this.mesh.position.clone());
    
    // Limit trail length
    if (this.trailPoints.length > this.maxTrailLength) {
      this.trailPoints.pop();
    }
    
    // Update trail geometry
    const positions = new Float32Array(this.trailPoints.length * 3);
    const sizes = new Float32Array(this.trailPoints.length);
    
    for (let i = 0; i < this.trailPoints.length; i++) {
      positions[i * 3] = this.trailPoints[i].x;
      positions[i * 3 + 1] = this.trailPoints[i].y;
      positions[i * 3 + 2] = this.trailPoints[i].z;
      
      sizes[i] = (1 - i / this.trailPoints.length) * 2;
    }
    
    this.trail.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.trail.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  }

  // ... (기존 separate, align, cohesion, seek, wrap 메서드는 유지)
}

// Load fish textures with improved quality
const textureLoader = new THREE.TextureLoader();
const fishTextures = [
  'fish1.png',
  'fish2.png',
  'fish3.png'
].map(url => {
  const texture = textureLoader.load(url);
  texture.minFilter = THREE.LinearMipMapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
});

// Create fish schools with optimized parameters
const fishSchools = [];
const bounds = new THREE.Vector2(5, 3);

fishTextures.forEach((texture, i) => {
  const school = [];
  const count = Math.min(10 + i * 5, 15); // Limit maximum fish per school
  
  for (let j = 0; j < count; j++) {
    const fish = new Fish(texture, 0.3 + i * 0.2);
    fish.mesh.position.set(
      (Math.random() - 0.5) * bounds.x * 2,
      (Math.random() - 0.5) * bounds.y * 2,
      i * -0.1
    );
    scene.add(fish.mesh);
    school.push(fish);
  }
  
  fishSchools.push(school);
});

// Background particles with improved performance
const particlesGeometry = new THREE.BufferGeometry();
const particleCount = window.innerWidth < 768 ? 1500 : 2500; // Reduced count for better performance
const positions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);
const sizes = new Float32Array(particleCount);

for (let i = 0; i < particleCount * 3; i += 3) {
  positions[i] = (Math.random() - 0.5) * 10;
  positions[i + 1] = (Math.random() - 0.5) * 10;
  positions[i + 2] = (Math.random() - 0.5) * 10;
  
  colors[i] = Math.random() * 0.3 + 0.7;
  colors[i + 1] = Math.random() * 0.3 + 0.7;
  colors[i + 2] = Math.random();
  
  sizes[i / 3] = Math.random() * 2;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

const particlesMaterial = new THREE.PointsMaterial({
  size: 0.01,
  vertexColors: true,
  transparent: true,
  opacity: 0.6,
  sizeAttenuation: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false // Improved transparency sorting
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// Post-processing setup
const composer = new THREE.EffectComposer(renderer);
const renderPass = new THREE.RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new THREE.UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5, // Bloom intensity
  0.4, // Bloom radius
  0.85 // Bloom threshold
);
composer.addPass(bloomPass);

// Animation loop with improved timing
let time = 0;
let lastTime = 0;
const clock = new THREE.Clock();

function animate() {
  stats.begin();
  
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - lastTime;
  lastTime = elapsedTime;
  
  time += deltaTime;
  
  // Update water
  waterMaterial.uniforms.uTime.value = elapsedTime;
  
  // Update fish schools with time-based animation
  fishSchools.forEach(school => {
    school.forEach(fish => {
      fish.update(time, bounds, school);
      fish.material.uniforms.uProgress.value = Math.sin(time * 0.5) * 0.5 + 0.5;
    });
  });
  
  // Update particles
  const positions = particlesGeometry.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    positions[i + 1] += Math.sin(time + i) * 0.001;
  }
  particlesGeometry.attributes.position.needsUpdate = true;
  
  particlesMesh.rotation.y = time * 0.1;
  
  // Render with post-processing
  composer.render();
  
  stats.end();
  requestAnimationFrame(animate);
}

// Resize handler with debouncing
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  }, 250);
});

// Initialize
animate();