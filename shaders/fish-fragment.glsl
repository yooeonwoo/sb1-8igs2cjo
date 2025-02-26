uniform sampler2D uTexture;
uniform float uTime;
uniform float uDistortion;
uniform float uProgress;
uniform vec3 uColor;
uniform float uGlowStrength;

varying vec2 vUv;
varying float vDistortion;

void main() {
    // 텍스처 왜곡 (UV 좌표 변형)
    vec2 uv = vUv;
    uv.y += sin(uv.x * 10.0 + uTime) * 0.01 * uDistortion;
    
    // 텍스처 샘플링
    vec4 texColor = texture2D(uTexture, uv);
    
    // 알파 투명도로 사용
    float alpha = texColor.a;
    
    // 시간에 따른 색상 변화
    float colorShift = sin(uTime * 0.5) * 0.1 + 0.9;
    
    // 디스토션에 따른 발광 효과
    float glow = abs(vDistortion) * uGlowStrength;
    
    // 최종 색상 계산
    vec3 finalColor = texColor.rgb * uColor * colorShift;
    finalColor += glow * uColor * 0.5; // 발광 효과 추가
    
    // 물고기의 움직임에 따른 잔물결 효과
    finalColor += vec3(0.1, 0.3, 0.5) * glow;
    
    // 프로그레스에 따른 투명도 및 발광 변화
    alpha *= uProgress * (1.0 + glow);
    
    gl_FragColor = vec4(finalColor, alpha);
}