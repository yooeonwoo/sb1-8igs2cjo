uniform float uTime;
uniform float uWaveAmplitude;
uniform float uWaveFrequency;

varying vec2 vUv;

void main() {
    vUv = uv;
    
    // Add wave motion to vertices
    vec3 pos = position;
    float wave = sin(pos.x * uWaveFrequency + uTime) * uWaveAmplitude;
    pos.y += wave;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}