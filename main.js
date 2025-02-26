import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import Stats from 'stats.js';
import fragmentShader from './shaders/fragment.glsl';
import vertexShader from './shaders/vertex.glsl';
import fishFragmentShader from './shaders/fish-fragment.glsl';
import fishVertexShader from './shaders/fish-vertex.glsl';
import waterFragmentShader from './shaders/water-fragment.glsl';
import waterVertexShader from './shaders/water-vertex.glsl';

// Register all GSAP plugins
gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

// Performance monitoring - only in development
const isDev = true;
if (isDev) {
  const stats = new Stats();
  stats.showPanel(0);
  document.body.appendChild(stats.dom);
}

// Initialize smooth scroll
const smoother = ScrollSmoother.create({
  smooth: 1.5,
  effects: true,
  normalizeScroll: true,
  smoothTouch: 0.1,
});

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
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
camera.position.z = 5;

// Water effect with improved quality
const waterGeometry = new THREE.PlaneGeometry(50, 50, 128, 128); // Higher resolution
const waterMaterial = new THREE.ShaderMaterial({
  vertexShader: waterVertexShader,
  fragmentShader: waterFragmentShader,
  uniforms: {
    uTime: { value: 0 },
    uBigWavesElevation: { value: 0.15 },
    uBigWavesFrequency: { value: new THREE.Vector2(4, 1.5) },
    uBigWavesSpeed: { value: 0.5 },
    uSmallWavesElevation: { value: 0.1 },
    uSmallWavesFrequency: { value: 3 },
    uSmallWavesSpeed: { value: 0.2 },
    uSmallWavesIterations: { value: 4 },
    uDepthColor: { value: new THREE.Color('#0a4da9') },
    uSurfaceColor: { value: new THREE.Color('#68c3ff') },
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

// Enhanced Fish class with improved physics and visual effects
class Fish {
  constructor(texture, size = 1, options = {}) {
    // Default options
    this.options = {
      speed: 0.05,
      turnSpeed: 0.1,
      wiggleSpeed: 3.0,
      wiggleAmplitude: 0.1,
      color: new THREE.Color(0xffffff),
      glowStrength: 0.5,
      trailLength: 20,
      ...options
    };
    
    // Create geometry with more subdivisions for smoother deformation
    const geometry = new THREE.PlaneGeometry(size, size * 0.6, 8, 4);
    
    // Enhanced shader material
    this.material = new THREE.ShaderMaterial({
      vertexShader: fishVertexShader,
      fragmentShader: fishFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uTexture: { value: texture },
        uWaveAmplitude: { value: this.options.wiggleAmplitude },
        uWaveFrequency: { value: this.options.wiggleSpeed },
        uDistortion: { value: 0.0 },
        uProgress: { value: 0.0 },
        uColor: { value: this.options.color },
        uGlowStrength: { value: this.options.glowStrength }
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    // Create the fish mesh
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.frustumCulled = false; // Prevent disappearing when off-screen
    
    // Physics properties
    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * this.options.speed,
      (Math.random() - 0.5) * this.options.speed,
      (Math.random() - 0.5) * this.options.speed * 0.2
    );
    this.acceleration = new THREE.Vector3();
    this.maxSpeed = this.options.speed;
    this.maxForce = this.options.speed * 0.04;
    this.targetRotation = 0;
    this.rotationSpeed = this.options.turnSpeed;
    
    // Add trail effect if enabled
    if (this.options.trailLength > 0) {
      this.setupTrail();
    }
    
    // Add subtle animation to fish size
    this.pulseAnimation();
  }

  setupTrail() {
    // Create points geometry for trail
    this.trail = new THREE.Points(
      new THREE.BufferGeometry(),
      new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: 30.0 * window.devicePixelRatio },
          uColor: { value: this.options.color.clone().multiplyScalar(0.8) }
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    
    this.trailPoints = [];
    this.maxTrailLength = this.options.trailLength;
    scene.add(this.trail);
  }

  pulseAnimation() {
    // Subtle breathing animation
    gsap.to(this.mesh.scale, {
      x: 1 + Math.random() * 0.1,
      y: 1 + Math.random() * 0.1,
      duration: 1 + Math.random() * 2,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true
    });
  }

  update(time, deltaTime, bounds, fishes) {
    // Update shader uniforms
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uDistortion.value = Math.sin(time * 2) * 0.05;
    
    // Apply flocking behavior with time-based forces
    if (fishes && fishes.length > 1) {
      const separation = this.separate(fishes).multiplyScalar(1.5);
      const alignment = this.align(fishes).multiplyScalar(1.0);
      const cohesion = this.cohesion(fishes).multiplyScalar(1.0);
      
      this.acceleration.add(separation);
      this.acceleration.add(alignment);
      this.acceleration.add(cohesion);
    }
    
    // Add wave motion based on position for more natural movement
    this.acceleration.y += Math.sin(time * 2 + this.mesh.position.x * 0.5) * 0.0005;
    this.acceleration.x += Math.cos(time * 1.5 + this.mesh.position.y * 0.5) * 0.0002;
    
    // Update velocity with smooth acceleration
    this.velocity.add(this.acceleration);
    this.velocity.clampLength(0, this.maxSpeed);
    
    // Apply damping
    this.velocity.multiplyScalar(0.99);
    
    // Update position based on velocity and delta time
    this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime * 60));
    
    // Update rotation with smooth interpolation to follow velocity direction
    if (this.velocity.length() > 0.001) {
      this.targetRotation = Math.atan2(this.velocity.y, this.velocity.x);
    }
    this.mesh.rotation.z += (this.targetRotation - this.mesh.rotation.z) * this.rotationSpeed;
    
    // Add subtle up/down rotation for more life-like movement
    this.mesh.rotation.x = Math.sin(time * 2 + this.mesh.position.x) * 0.1;
    
    // Reset acceleration
    this.acceleration.multiplyScalar(0);
    
    // Update trail if it exists
    if (this.trail) {
      this.updateTrail(time);
    }
    
    // Wrap around bounds
    this.wrap(bounds);
  }

  updateTrail(time) {
    // Add current position to trail
    this.trailPoints.unshift({
      position: this.mesh.position.clone(),
      time: time
    });
    
    // Limit trail length
    if (this.trailPoints.length > this.maxTrailLength) {
      this.trailPoints.pop();
    }
    
    // Update trail geometry
    const positions = new Float32Array(this.trailPoints.length * 3);
    const sizes = new Float32Array(this.trailPoints.length);
    
    for (let i = 0; i < this.trailPoints.length; i++) {
      const point = this.trailPoints[i];
      positions[i * 3] = point.position.x;
      positions[i * 3 + 1] = point.position.y;
      positions[i * 3 + 2] = point.position.z;
      
      // Size decreases with age and adds some wobble
      const age = i / this.trailPoints.length;
      sizes[i] = (1 - age) * 2 * (1 + Math.sin(time * 5 + i) * 0.2);
    }
    
    this.trail.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.trail.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Update trail shader time
    this.trail.material.uniforms.uTime.value = time;
  }

  separate(fishes) {
    const steering = new THREE.Vector3();
    let total = 0;
    const desiredSeparation = this.mesh.geometry.parameters.width * 2;
    
    for (const other of fishes) {
      if (other === this) continue;
      
      const distance = this.mesh.position.distanceTo(other.mesh.position);
      
      if (distance > 0 && distance < desiredSeparation) {
        const diff = new THREE.Vector3().subVectors(this.mesh.position, other.mesh.position);
        diff.normalize();
        diff.divideScalar(distance); // Weight by distance
        steering.add(diff);
        total++;
      }
    }
    
    if (total > 0) {
      steering.divideScalar(total);
      steering.normalize();
      steering.multiplyScalar(this.maxSpeed);
      steering.sub(this.velocity);
      steering.clampLength(0, this.maxForce);
    }
    
    return steering;
  }

  align(fishes) {
    const steering = new THREE.Vector3();
    let total = 0;
    const neighborDistance = this.mesh.geometry.parameters.width * 5;
    
    for (const other of fishes) {
      if (other === this) continue;
      
      const distance = this.mesh.position.distanceTo(other.mesh.position);
      
      if (distance > 0 && distance < neighborDistance) {
        steering.add(other.velocity);
        total++;
      }
    }
    
    if (total > 0) {
      steering.divideScalar(total);
      steering.normalize();
      steering.multiplyScalar(this.maxSpeed);
      steering.sub(this.velocity);
      steering.clampLength(0, this.maxForce);
    }
    
    return steering;
  }

  cohesion(fishes) {
    const steering = new THREE.Vector3();
    let total = 0;
    const neighborDistance = this.mesh.geometry.parameters.width * 10;
    
    for (const other of fishes) {
      if (other === this) continue;
      
      const distance = this.mesh.position.distanceTo(other.mesh.position);
      
      if (distance > 0 && distance < neighborDistance) {
        steering.add(other.mesh.position);
        total++;
      }
    }
    
    if (total > 0) {
      steering.divideScalar(total);
      return this.seek(steering);
    }
    
    return steering;
  }

  seek(target) {
    const desired = new THREE.Vector3().subVectors(target, this.mesh.position);
    desired.normalize();
    desired.multiplyScalar(this.maxSpeed);
    
    const steering = new THREE.Vector3().subVectors(desired, this.velocity);
    steering.clampLength(0, this.maxForce);
    
    return steering;
  }

  wrap(bounds) {
    const { x, y, z } = this.mesh.position;
    
    // Wrap around bounds with smooth transition
    if (x < -bounds.x) {
      this.mesh.position.x = bounds.x;
      this.resetTrail();
    } else if (x > bounds.x) {
      this.mesh.position.x = -bounds.x;
      this.resetTrail();
    }
    
    if (y < -bounds.y) {
      this.mesh.position.y = bounds.y;
      this.resetTrail();
    } else if (y > bounds.y) {
      this.mesh.position.y = -bounds.y;
      this.resetTrail();
    }
    
    if (z < -bounds.z) {
      this.mesh.position.z = bounds.z;
      this.resetTrail();
    } else if (z > bounds.z) {
      this.mesh.position.z = -bounds.z;
      this.resetTrail();
    }
  }
  
  resetTrail() {
    // Clear trail when wrapping
    if (this.trail) {
      this.trailPoints = [];
    }
  }
  
  dispose() {
    // Clean up resources
    this.mesh.geometry.dispose();
    this.material.dispose();
    if (this.trail) {
      this.trail.geometry.dispose();
      this.trail.material.dispose();
      scene.remove(this.trail);
    }
    scene.remove(this.mesh);
  }
}

// Load fish textures with improved quality
const textureLoader = new THREE.TextureLoader();

// Preload textures with loading manager
const loadingManager = new THREE.LoadingManager();
const fishTextures = [];
const fishTextureUrls = [
  'fish1.png',
  'fish2.png',
  'fish3.png'
];

fishTextureUrls.forEach(url => {
  const texture = textureLoader.load(url, (loadedTexture) => {
    loadedTexture.minFilter = THREE.LinearMipMapLinearFilter;
    loadedTexture.magFilter = THREE.LinearFilter;
    loadedTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    fishTextures.push(loadedTexture);
  });
});

// Create fish schools with optimized parameters
const fishSchools = [];
const bounds = new THREE.Vector3(6, 4, 3);

// Custom colors for each school
const schoolColors = [
  new THREE.Color('#5e9fff'),
  new THREE.Color('#ff9d72'),
  new THREE.Color('#66ffb3')
];

// Function to initialize fish schools when textures are loaded
function initializeFishSchools() {
  fishTextures.forEach((texture, i) => {
    const school = [];
    // Adaptive fish count based on device performance
    const count = window.innerWidth < 768 ? 
      Math.min(6 + i * 2, 12) : 
      Math.min(10 + i * 4, 18);
    
    for (let j = 0; j < count; j++) {
      const fish = new Fish(texture, 0.3 + i * 0.2, {
        speed: 0.03 + Math.random() * 0.02,
        turnSpeed: 0.08 + Math.random() * 0.04,
        wiggleSpeed: 2 + Math.random() * 2,
        wiggleAmplitude: 0.05 + Math.random() * 0.1,
        color: schoolColors[i].clone().multiplyScalar(0.8 + Math.random() * 0.4),
        glowStrength: 0.4 + Math.random() * 0.3,
        trailLength: Math.floor(10 + Math.random() * 15)
      });
      
      // Random starting position within bounds
      fish.mesh.position.set(
        (Math.random() - 0.5) * bounds.x * 1.8,
        (Math.random() - 0.5) * bounds.y * 1.8,
        (Math.random() - 0.5) * bounds.z * 1.8
      );
      
      scene.add(fish.mesh);
      school.push(fish);
    }
    
    fishSchools.push(school);
  });
}

// Initialize schools when textures are ready
loadingManager.onLoad = initializeFishSchools;

// Enhanced background particles
const particlesGeometry = new THREE.BufferGeometry();
const particleCount = window.innerWidth < 768 ? 2000 : 3500;
const positions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);
const sizes = new Float32Array(particleCount);
const opacities = new Float32Array(particleCount);

for (let i = 0; i < particleCount; i++) {
  const i3 = i * 3;
  positions[i3] = (Math.random() - 0.5) * 10;
  positions[i3 + 1] = (Math.random() - 0.5) * 10;
  positions[i3 + 2] = (Math.random() - 0.5) * 10;
  
  // Blue-cyan color palette
  colors[i3] = Math.random() * 0.2;
  colors[i3 + 1] = Math.random() * 0.3 + 0.5;
  colors[i3 + 2] = Math.random() * 0.3 + 0.7;
  
  sizes[i] = Math.random() * 3;
  opacities[i] = Math.random() * 0.5 + 0.2;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
particlesGeometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));

// Custom shader for particles
const particlesVertexShader = `
  attribute float size;
  attribute float opacity;
  varying float vOpacity;
  
  void main() {
    vOpacity = opacity;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const particlesFragmentShader = `
  varying float vOpacity;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, dist) * vOpacity;
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
  }
`;

const particlesMaterial = new THREE.ShaderMaterial({
  vertexShader: particlesVertexShader,
  fragmentShader: particlesFragmentShader,
  vertexColors: true,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// Animation loop with improved timing
let time = 0;
let lastTime = 0;
const clock = new THREE.Clock();

// Add scroll-based camera movement
function setupScrollAnimations() {
  // Parallax effect for camera
  ScrollTrigger.create({
    trigger: ".hero",
    start: "top top",
    end: "bottom top",
    scrub: 1,
    onUpdate: (self) => {
      camera.position.y = 0.5 - self.progress * 1.5;
      camera.lookAt(scene.position);
    }
  });
  
  // Animate sections
  gsap.utils.toArray('.save__item').forEach((item, index) => {
    gsap.fromTo(item, 
      { y: 100, opacity: 0 }, 
      {
        y: 0, 
        opacity: 1, 
        duration: 1,
        scrollTrigger: {
          trigger: item,
          start: "top 80%",
          toggleActions: "play none none reverse"
        },
        delay: index * 0.2
      }
    );
  });
  
  gsap.utils.toArray('.step').forEach((step, index) => {
    gsap.fromTo(step, 
      { y: 80, opacity: 0 }, 
      {
        y: 0, 
        opacity: 1, 
        duration: 1,
        scrollTrigger: {
          trigger: step,
          start: "top 80%",
          toggleActions: "play none none reverse"
        },
        delay: index * 0.3
      }
    );
  });
  
  gsap.utils.toArray('.faq__item').forEach((item, index) => {
    gsap.fromTo(item, 
      { y: 60, opacity: 0 }, 
      {
        y: 0, 
        opacity: 1, 
        duration: 0.8,
        scrollTrigger: {
          trigger: item,
          start: "top 85%",
          toggleActions: "play none none reverse"
        },
        delay: index * 0.15
      }
    );
  });
}

// Initialize scroll animations
setupScrollAnimations();

// Handle mobile navigation
const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');

navToggle?.addEventListener('click', () => {
  navToggle.classList.toggle('active');
  nav.classList.toggle('active');
});

// Close mobile nav when link is clicked
document.querySelectorAll('.nav a').forEach(link => {
  link.addEventListener('click', () => {
    navToggle.classList.remove('active');
    nav.classList.remove('active');
  });
});

// Toggle FAQ answers
document.querySelectorAll('.faq__item h3').forEach(question => {
  question.addEventListener('click', () => {
    question.classList.toggle('active');
    const answer = question.nextElementSibling;
    const isOpen = question.classList.contains('active');
    
    gsap.to(answer, {
      height: isOpen ? 'auto' : 0,
      opacity: isOpen ? 1 : 0,
      duration: 0.3,
      onComplete: () => {
        answer.style.overflow = isOpen ? 'visible' : 'hidden';
      }
    });
  });
});

function animate() {
  if (isDev) stats?.begin();
  
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = Math.min(elapsedTime - lastTime, 0.1); // Cap delta to prevent huge jumps
  lastTime = elapsedTime;
  
  time += deltaTime;
  
  // Update water
  waterMaterial.uniforms.uTime.value = elapsedTime;
  
  // Update fish schools with time-based animation
  fishSchools.forEach(school => {
    school.forEach(fish => {
      fish.update(time, deltaTime, bounds, school);
    });
  });
  
  // Update particles
  const positions = particlesGeometry.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    // Subtle particle movement
    positions[i + 1] += Math.sin(time + i) * 0.0008;
    positions[i] += Math.cos(time * 0.8 + i) * 0.0005;
  }
  particlesGeometry.attributes.position.needsUpdate = true;
  
  // Rotate particles slowly
  particlesMesh.rotation.y = time * 0.05;
  particlesMesh.rotation.x = Math.sin(time * 0.03) * 0.02;
  
  // Render scene
  renderer.render(scene, camera);
  
  if (isDev) stats?.end();
  requestAnimationFrame(animate);
}

// Resize handler with debouncing and performance considerations
let resizeTimeout;
function handleResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    // Update camera
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    // Update renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }, 250);
}

window.addEventListener('resize', handleResize);

// Initialize
animate();

// Export for possible React integration
export { scene, camera, renderer, Fish, waterMaterial, animate };