uniform vec3 uDepthColor;
uniform vec3 uSurfaceColor;
uniform float uColorOffset;
uniform float uColorMultiplier;
uniform float uTime;

varying float vElevation;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
    // 물 표면의 깊이에 따른 색상 계산
    float mixStrength = (vElevation + uColorOffset) * uColorMultiplier;
    vec3 color = mix(uDepthColor, uSurfaceColor, mixStrength);
    
    // 빛 반사 효과 계산 (프레넬 효과 흉내)
    vec3 viewDirection = normalize(vec3(0.0, 1.0, 0.0)); // 간단한 뷰 방향
    float fresnel = pow(1.0 - dot(vNormal, viewDirection), 5.0);
    
    // 반짝임 효과 추가
    float sparkleStrength = 0.0;
    
    // 파도 마루 부분에 반짝임 추가
    if(vElevation > 0.0) {
        sparkleStrength = pow(vElevation * 10.0, 2.0) * 0.5;
    }
    
    // 시간에 따른 반짝임
    sparkleStrength *= sin(uTime * 2.0 + vUv.x * 30.0 + vUv.y * 20.0) * 0.5 + 0.5;
    
    // 최종 색상에 반짝임 및 프레넬 효과 적용
    color += vec3(1.0, 1.0, 1.0) * sparkleStrength;
    color += vec3(0.6, 0.8, 1.0) * fresnel * 0.5;
    
    // 물 투명도 (깊이에 따라 다름)
    float alpha = 0.8 + fresnel * 0.2;
    
    gl_FragColor = vec4(color, alpha);
}