uniform float uTime;
uniform float uWaveAmplitude;
uniform float uWaveFrequency;
uniform float uDistortion;

varying vec2 vUv;
varying float vDistortion;

void main() {
    vUv = uv;
    
    // 물고기 꼬리 움직임 계산
    float tailMovement = sin(uTime * uWaveFrequency + position.x * 10.0) * uWaveAmplitude;
    
    // 위치가 뒤쪽으로 갈수록 움직임 증가 (꼬리 부분)
    float distortionFactor = smoothstep(0.0, 1.0, position.x + 0.5); // x가 -0.5에서 0.5 사이
    float vertexDistortion = tailMovement * distortionFactor;
    
    // 디스토션 전달
    vDistortion = vertexDistortion;
    
    // 최종 위치 계산
    vec3 newPosition = position;
    newPosition.y += vertexDistortion;
    
    // 전체적인 물결 효과 추가
    newPosition.y += sin(uTime * 0.5 + position.x * 2.0) * 0.02;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}