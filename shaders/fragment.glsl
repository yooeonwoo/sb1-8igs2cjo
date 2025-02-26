uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;

varying vec3 vColor;

void main() {
    // Circular particle shape
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    float r = dot(cxy, cxy);
    float delta = fwidth(r);
    float alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
    
    // Color variation
    vec3 color = vColor;
    color += sin(uTime) * 0.2;
    color += vec3(0.1, 0.2, 0.3) * length(uMouse);
    
    // Glow effect
    float glow = exp(-r * 4.0);
    color += glow * vec3(0.1, 0.2, 0.3);
    
    gl_FragColor = vec4(color, alpha * 0.8);
}