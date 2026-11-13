# 2026-11-13 작업 마무리

상태: Cover Flow·반사 영역·연속 유리 메뉴의 운영 반영 완료. 이번 마무리는 Markdown 정리와 Git 커밋·푸시이며 실행 코드·운영 데이터·서버는 변경하지 않습니다.

## 운영과 소스

- [운영 WORKS](https://byx-website.vercel.app/#/), [관리자 로그인](https://byx-website.vercel.app/admin).
- 운영 main: `697ffab` / [PR #24](https://github.com/keruk01-cmd/byx_website/pull/24). 최종 검증 실행 소스는 `653d6d8`입니다. 최신 [Vercel 운영 배포](https://vercel.com/keruk01-cmds-projects/byx-website/GKY8vpYf66huiXhBuiYJrEgbm1EY)가 성공했습니다.
- 2026-11-13 11:58 KST에 기존 운영 주소 6개 경로의 HTTP 200/최신 HTML 일치와 브랜드 가이드 API의 기존 26개 문서/URL 접근 모드를 확인했습니다. [운영 검증 결과](../tests/artifacts/deployment-results.json).
- 기존 작업 브랜치는 `design/byx-brand-identitycodex`입니다. 운영 배포 확인 기록은 `6b8fc4d`까지 보관되어 있으며 이번 문서 정리도 같은 브랜치에 푸시합니다. 문서 정리만으로 main을 다시 병합하지 않습니다.
- 실행 프런트는 단일 `index.html`이며 새 프레임워크·런타임 패키지·빌드 단계는 없습니다. 설정 객체·Supabase 연동·Auth/Storage·Vercel rewrite·브랜드 가이드·문의/계정 서버와 운영 콘텐츠를 보존했습니다.

## 최종 화면과 동작

### 프로젝트 Cover Flow

- 드래그·던지기·가로 트랙패드에 반응하며 속도에 맞는 목적지로 스프링 착지합니다. 빠른 짧은 던지기도 최소 한 장 이동합니다. 처음/끝은 저항 후 복귀하고 순환/복제하지 않습니다.
- 옆 이미지 클릭·방향키·Home/End·선택 점, 모션 감소와 세로 터치 스크롤/핀치 확대를 지원합니다. 거리별 깊이·회전·축소·명암, 부드러운 그림자와 약한 반사를 사용합니다.
- 원본 사진·도면은 `contain`으로 전체를 표시합니다. 이미지별 설명·저장 버튼·추가 정보 UI는 없습니다. 기존 프로젝트 제목·본문·CODE/스펙과 저장 데이터는 유지합니다.
- **Cover Flow와 본문·CODE는 모두 문서와 함께 스크롤합니다.** 본문을 계속 내려 읽으면 Cover Flow도 위로 사라집니다. 하단 반사만 투명한 본문·CODE 영역 뒤로 이어집니다.
- **프로젝트의 고정 배경과 스크롤 감쇠는 제거했습니다.** 처음 구현했던 sticky/본문 오버레이와 강제 최소 높이·여백·글 그림자는 사용자 정정으로 폐기한 사양입니다. 모션 감소에서도 같은 일반 문서 흐름입니다.

세부 기준: [Cover Flow 관성](COVERFLOW_MOMENTUM_2026-11-13.md), [최종 반사/스크롤](PROJECT_REFLECTION_FLOW_2026-11-13.md).

### 유리 메뉴

- 메뉴별 고정 확장량 대신 메뉴 전체 영역의 실제 마우스 X 좌표를 따릅니다. 같은 메뉴 안과 메뉴 사이 빈 공간에서도 확장량이 연속으로 변합니다.
- 하나의 감쇠 스프링이 현재 위치·속도를 유지합니다. 빠른 방향 전환·이탈 복귀 때 애니메이션을 재시작하지 않습니다. 반대쪽 끝·높이는 유지하고 해당 방향 끝만 부드럽게 확장하며 최대 범위는 14px입니다.
- 캡슐·반전 마스크·헤더 굴절 구멍은 같은 형상을 따르고 글자 위치는 고정합니다. 포인터 이동 때 글자 DOM/렌즈 맵을 다시 만들지 않으며 정지 시 프레임을 종료합니다.
- 클릭 전환은 기존 320ms 이동과 얇아졌다 복구되는 동작을 유지합니다. 호버는 라우트나 `aria-current`를 바꾸지 않습니다. 키보드·터치·모션 감소·숨은 탭·리사이즈/모바일 전환은 복귀/정리합니다.
- 초기의 메뉴 항목별 최대 10px/240ms 호버는 이전 구현입니다. 현재 기준은 [연속 포인터 메뉴](NAV_POINTER_SPRING_2026-11-13.md)입니다.

## 실제 수행한 검증

아래는 구현·배포 때 수행한 결과입니다. 이번 Markdown 마무리에서 브라우저·운영 HTTP·CMS 검사를 다시 실행한 것으로 간주하지 않습니다. 기능 검증은 운영 연결을 제거한 격리 Chrome/메모리 데모입니다.

| 검증 | 확인 범위 | 결과 |
|---|---|---|
| `nav-pointer-spring.cjs` | 1440/1024px, 동일 메뉴 내부·빈 공간 연속성, 프레임별 방향 전환/복귀, 글자/렌즈 유지, 클릭·키보드·모션 감소·모바일 왕복 | [통과](../tests/artifacts/nav-pointer-spring-results.json) |
| `nav-hover-project-layer.cjs` | 메뉴 정렬/선택 불변, 1440/390/320/844px의 반사 겹침·사진/본문 동일 120px 이동·밝기 불변·사진 화면 이탈·모바일·정리 | [통과](../tests/artifacts/nav-hover-project-layer-results.json) |
| `liquid-nav-lines.cjs` | 기존 캡슐 이동/얇아짐/중단·키보드/모바일/모션 감소와 ABOUT 줄별 등장 | [통과](../tests/artifacts/liquid-nav-lines-results.json) |
| `coverflow-momentum.cjs` | 4개 화면의 마우스/터치/트랙패드·관성·끝단·모션 감소·리사이즈·1/2/3장·정리 | [통과](../tests/artifacts/coverflow-momentum-results.json) |
| `site-regression.cjs` | 2560/1920/1440/390/320px × 10개 라우트·데모 CMS·본문/이미지·날짜/정렬·추가 로딩·폴백 | [통과](../tests/artifacts/results.json) |
| `check-deployment.cjs` | 운영 6개 경로의 최신 HTML/HTTP 200·가이드 API 보존 | [통과](../tests/artifacts/deployment-results.json) |

- 최종 메뉴 변경에서 포인터·공유 메뉴/줄 등장·프로젝트 반사/스크롤·전체 라우트/CMS를 다시 검증했습니다. Cover Flow 입력 검증은 반사/스크롤 정정 시 수행했고 이후 메뉴 변경에서 프로젝트 소스 불변을 확인했습니다. 모두 브라우저 실행 오류 0건입니다.
- 최종 병합 전에 GitHub 병합 HTML blob과 검증한 소스의 일치를 확인했습니다. 운영 CMS 시험 쓰기·계정/SQL/Storage 정책 변경은 수행하지 않았습니다.
- 현재 화면은 `tests/artifacts/nav-pointer-spring-*.png`, `project-reflection-flow-*.png`, `momentum-coverflow-*.png`입니다. 이전 `project-layer-reading-*`는 폐기한 고정 배경의 당시 캡처입니다.

## 남은 확인과 보존 조건

- 실제 iPhone·물리 마우스/트랙패드의 체감·합성, Safari/Firefox·모바일 키보드·스크린리더는 미검증입니다.
- 실제 관리자 자격증명으로 로그인→새 계정→첫 비밀번호 변경→운영 저장/업로드의 전체 왕복은 이전 기록에서 이월한 미검증입니다. [계정 관리 기준](CMS_ACCOUNTS_2026-11-06.md)을 유지합니다.
- 11월 7일의 센서/권한 요청 제거·약한 모바일 탭·무작위 제목·즉시 WORKS 필터/APPLY 제거는 유지합니다. 이번 작업에 센서·필터·계정 정책 변경은 없습니다.
- 현재 별도 미결 사양은 없습니다. 프로젝트 sticky·스크롤 감쇠와 메뉴 항목별 호버 확장은 되살리지 않습니다.
- 이번 문서 마무리에서는 링크·최신/과거 사양 구분·변경 범위와 공백을 확인하고, 작업 전후 SHA-256으로 추적된 비 Markdown 및 기존 `.claude/` 파일 548개의 불변을 확인했습니다. 실행 코드·설정·서버·테스트/캡처는 변경하지 않았습니다.

## 다음 작업 시작

1. 이 문서, [최신 메뉴](NAV_POINTER_SPRING_2026-11-13.md), [최종 프로젝트 반사](PROJECT_REFLECTION_FLOW_2026-11-13.md), CHANGELOG를 먼저 읽습니다.
2. 메뉴는 `NAV_PILL`, `startNavHover()`, `paintNavHover()`, `updateNavPill()`과 포인터 연결을 확인합니다. 호버 목표는 좌표만 갱신하고 클릭 전환과 구별합니다.
3. 프로젝트는 `.project-scene`/`.cover-reflection` CSS, `viewProjectDetail()`, `bindProjectGallery()`를 확인합니다. 반사 overflow를 열되 가로 넘침·본문 판독·갤러리 조작과 일반 스크롤을 유지합니다.
4. CMS 입력 중 전체 재렌더 금지·본문 블록 호환·업로드 축소·기존 계정/권한을 보존합니다. 과거 초기 설치 SQL/정책을 운영에 다시 적용하지 않습니다.
