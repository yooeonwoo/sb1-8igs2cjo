uniform float uTime;
attribute float size;

varying vec3 vColor;

void main() {
    vColor = color;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    
    // Size attenuation
    gl_PointSize = size * (300.0 / -mvPosition.z);
    
    // Vertex animation
    vec3 pos = position;
    pos.x += sin(uTime * 2.0 + position.z * 4.0) * 0.1;
    pos.y += cos(uTime * 2.0 + position.x * 4.0) * 0.1;
    pos.z += sin(uTime * 2.0 + position.y * 4.0) * 0.1;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}