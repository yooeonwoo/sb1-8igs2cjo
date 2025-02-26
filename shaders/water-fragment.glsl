uniform vec3 uDepthColor;
uniform vec3 uSurfaceColor;
uniform float uColorOffset;
uniform float uColorMultiplier;

varying float vElevation;
varying vec2 vUv;

void main() {
    float mixStrength = (vElevation + uColorOffset) * uColorMultiplier;
    vec3 color = mix(uDepthColor, uSurfaceColor, mixStrength);
    
    // Add foam effect
    float foam = smoothstep(0.7, 0.8, mixStrength);
    color = mix(color, vec3(1.0), foam);
    
    // Add caustics effect
    float caustics = sin(vUv.x * 40.0) * sin(vUv.y * 40.0) * 0.1;
    color += caustics;
    
    gl_FragColor = vec4(color, 0.8);
}