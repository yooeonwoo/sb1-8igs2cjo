uniform sampler2D uTexture;
uniform float uTime;

varying vec2 vUv;

void main() {
    vec4 texColor = texture2D(uTexture, vUv);
    
    // Add shimmer effect
    float shimmer = sin(vUv.y * 20.0 + uTime * 2.0) * 0.1 + 0.9;
    
    // Add color variation
    vec3 color = texColor.rgb * shimmer;
    color += vec3(0.1, 0.2, 0.3) * sin(uTime + vUv.x * 10.0) * 0.1;
    
    gl_FragColor = vec4(color, texColor.a);
}