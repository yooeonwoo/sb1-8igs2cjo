uniform float uSize;
uniform float uTime;

attribute float size;

varying vec3 vColor;

void main() {
    vColor = color;
    
    // Position
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    
    // Add subtle movement
    float angle = uTime * 0.2 + position.x * 0.5;
    modelPosition.y += sin(angle) * 0.1 * size;
    
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;
    
    // Size
    gl_PointSize = uSize * size * (1.0 / -viewPosition.z);
}