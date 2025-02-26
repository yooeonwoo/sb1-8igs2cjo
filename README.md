# OceanVerse - 해양 생태계 보호 프로젝트

애플 스타일의 부드러운 애니메이션과 Three.js 기반의 3D 물고기 움직임을 결합한 최고급 랜딩 페이지입니다. 이 프로젝트는 해양 생태계 보호의 중요성을 강조하고 생명공학 기술을 활용한 보호 솔루션을 소개합니다.

## 기술 스택

### 프론트엔드
- **Three.js**: WebGL 기반 3D 그래픽과 물고기 애니메이션
- **GSAP (GreenSock Animation Platform)**: 스크롤 기반 애니메이션과 모션 효과
- **GLSL 셰이더**: 커스텀 물, 물고기, 입자 효과
- **ScrollSmoother**: 부드러운 스크롤 경험
- **HTML5/CSS3**: 최신 웹 표준 및 애니메이션 기술

## 주요 특징

- 📱 **반응형 디자인**: 모든 디바이스에서 완벽하게 작동
- 🎨 **애플 스타일 UI**: 세련된 디자인과 부드러운 애니메이션
- 🐠 **실감나는 3D 물고기**: Three.js로 구현된 자연스러운 움직임
- 🌊 **살아있는 물 효과**: GLSL 셰이더로 구현된 리얼한 물 표현
- ✨ **인터랙티브 요소**: 스크롤 및 마우스 반응형 컴포넌트

## 프로젝트 구조

```
oceanverse/
├── index.html           # 메인 HTML 페이지
├── style.css            # 스타일시트
├── main.js              # 메인 JavaScript 코드
├── shaders/             # GLSL 셰이더 파일
│   ├── vertex.glsl      # 기본 버텍스 셰이더
│   ├── fragment.glsl    # 기본 프래그먼트 셰이더
│   ├── fish-vertex.glsl # 물고기 버텍스 셰이더
│   ├── fish-fragment.glsl # 물고기 프래그먼트 셰이더
│   ├── water-vertex.glsl # 물 버텍스 셰이더
│   └── water-fragment.glsl # 물 프래그먼트 셰이더
└── img/                 # 이미지 파일
```

## 설치 및 실행

이 프로젝트를 로컬에서 실행하려면:

1. 저장소 클론:
   ```bash
   git clone https://github.com/yourusername/oceanverse.git
   cd oceanverse
   ```

2. 로컬 서버 실행:
   ```bash
   npx vite
   # 또는
   npx serve
   ```

## 성능 최적화

- 모바일 디바이스에서는 물고기 및 입자 수 자동 감소
- 효율적인 셰이더 계산으로 배터리 소모 최소화
- 지연 로딩 및 자원 관리로 메모리 사용 최적화

## 향후 계획

- ✅ React 기반 컴포넌트 시스템으로 마이그레이션
- ✅ 백엔드 API 연동 및 데이터 시각화 추가
- ✅ WebXR 지원으로 VR/AR 경험 제공

## 기여하기

프로젝트 기여에 관심이 있으시다면 이슈를 열거나 풀 리퀘스트를 보내주세요!

## 라이선스

MIT License