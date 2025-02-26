uniform float uTime;
uniform vec3 uColor;

varying vec3 vColor;

void main() {
    // 원형 입자 형태
    float distanceToCenter = length(gl_PointCoord - 0.5);
    float strength = 1.0 - smoothstep(0.0, 0.5, distanceToCenter);
    
    // 글로우 효과
    vec3 color = mix(vec3(0.0), vColor * uColor, strength);
    
    // 시간에 따른 깜빡임 효과
    float pulse = 0.5 + 0.5 * sin(uTime * 0.5 + vColor.r * 10.0);
    color *= 0.8 + 0.2 * pulse;
    
    // 최종 색상
    gl_FragColor = vec4(color, strength * 0.7);
}