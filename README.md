# 멍멍 대소동!

초등학교 저학년 아이가 모바일에서 쉽게 즐길 수 있는 세로형 캐주얼 강아지 액션 게임입니다. 몽실이를 움직여 꽃밭 산책길에서 간식과 리본 상자를 모으고 도착 깃발까지 가면 성공합니다.

## 실행 방법

```bash
npm install
npm run dev
```

빌드 확인:

```bash
npm run build
```

## GitHub Pages 배포

Vite `base`를 `./`로 설정해 두어 저장소명이 포함된 GitHub Pages 경로에서도 정적 파일이 상대 경로로 동작합니다.

```bash
npm run build
```

생성된 `dist/` 폴더를 GitHub Pages 배포 대상으로 사용하면 됩니다.

자동 배포도 준비되어 있습니다. GitHub 저장소의 Settings > Pages에서 Source를 "GitHub Actions"로 설정하면, `main` 브랜치에 푸시될 때 `.github/workflows/deploy-pages.yml`이 `dist/`를 빌드해 GitHub Pages로 배포합니다.

## iPhone 홈화면 추가

`manifest.webmanifest`, Apple web app 메타 태그, 앱 아이콘, 서비스 워커를 포함했습니다. GitHub Pages 주소를 iPhone Safari에서 연 뒤 공유 버튼에서 "홈 화면에 추가"를 선택하면 독립 앱처럼 실행할 수 있습니다.

## 주요 구현

- React + TypeScript + Vite 기반
- 모바일 우선 세로형 게임 화면
- CSS/SVG로 만든 몽실이 캐릭터와 파스텔 꽃밭 스테이지
- 터치 조작: 왼쪽, 오른쪽, 점프, 대시
- 키보드 조작: A/←, D/→, Space, Shift
- 간식, 하트 쿠키, 리본 상자, 장애물, 도착 깃발
- 시작, 게임, 클리어, 실패, 꾸미기 화면
- 꾸미기 아이템 해금/선택과 최고 간식 수 로컬 저장
- PWA/홈화면 추가를 위한 manifest와 서비스 워커
