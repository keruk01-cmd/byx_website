# 2026-11-07 작업 마무리

상태: 모바일 ABOUT·WORKS 필터 개선과 운영 배포 완료. 이번 마무리는 문서 정리와 Git 커밋·푸시이며 실행 코드·서버·운영 데이터는 변경하지 않습니다.

## 운영과 소스

- [운영 WORKS](https://byx-website.vercel.app/#/), [운영 ABOUT](https://byx-website.vercel.app/#/about), [관리자 로그인](https://byx-website.vercel.app/admin).
- 운영 main: `6d7a266` / [PR #20](https://github.com/keruk01-cmd/byx_website/pull/20). 검증한 실행 소스는 `1fbc884`입니다.
- [Vercel 운영 배포](https://vercel.com/keruk01-cmds-projects/byx-website/GyybgBWEpVRGjGABp2PfDaDmcfMi)는 성공했습니다. 기존 운영 주소에서 최신 버전을 제공하며 Preview 로그인은 필요하지 않습니다. `/admin`의 기존 CMS 인증은 유지합니다.
- 작업/문서 브랜치: `design/byx-brand-identitycodex`. 배포 확인 기록 `d8ed715`와 이번 마무리 문서는 이 브랜치에 보관합니다. 문서 정리만으로 운영 main을 다시 병합하지 않습니다.
- 구현 순서: `b1884d7` 초기 모바일 개선 → `c15bf09` 제목 무작위·약한 터치·센서 제거 → `1fbc884` 즉시 필터·모바일 비침 보정. 초기 센서·APPLY 동작은 최종 사양이 아닙니다.
- 실행 프런트는 단일 `index.html`입니다. 설정 객체·기존 Supabase 연동·Vercel rewrite·브랜드 가이드·문의/계정 서버와 운영 콘텐츠를 보존했습니다. 이번 UI 작업에서 계정/DB 정책을 바꾸거나 운영 콘텐츠를 쓰지 않았습니다.

## 최종 화면과 동작

### ABOUT과 터치

- POSSIBILITIES의 글자 구성과 I 개수를 유지하며 매 프레임 독립적으로 무작위 재배열합니다. 한 칸씩 순환하며 왼쪽으로 흐르던 방식은 제거했습니다. 전체 단어 폭·글자 크기·흰 박스·BY/X의 크기와 위치, 최종 착지는 유지합니다.
- X 점군은 모바일에서 짧은 탭에만 약한 국소 반응을 줍니다. 10px 이내·500ms 미만의 탭을 손을 뗄 때 판정하며 스크롤/취소/길게 누르기는 점군을 밀지 않습니다. 터치 힘·범위·변위와 복귀 시간을 줄였고 PC 마우스 반응은 보존합니다.
- **기울기 기능과 센서 권한 요청을 완전히 제거했습니다.** 자동 센서 연결과 방향 이벤트 수신도 없습니다. 예전 문서의 센서 권한 요청/실기기 센서 확인은 현재 사양이나 남은 과제가 아닙니다.
- 장면의 검정 감쇠 오버레이를 그림 알파 감쇠로 바꿔 문서와 함께 흐르는 안개 배경이 이어지도록 했습니다. 유리 헤더 뒤의 그림·자동 애니메이션·스크롤 진행·모션 감소를 유지합니다.
- People 소개 X·WORKS 필터·Dream 문의창의 포인터 입력에는 자동 강조 테두리/탭 하이라이트를 표시하지 않습니다. 키보드 포커스는 계속 표시합니다.

### WORKS 필터

- 기본 크기는 약 280×254px입니다. 중복 WORKS/FILTER·프로젝트 필터 제목은 없습니다. RESET은 왼쪽 위, X는 오른쪽 위이며 높이와 중심을 맞춥니다.
- TYPE/STATUS/YEAR/SORT BY/ORDER를 사용하며 정렬 항목은 대문자, 순서는 A–Z/Z–A입니다. 실제 프로젝트의 분류/상태 값은 원래 데이터 그대로 표시합니다.
- 모바일/터치 화면은 흰색 88%와 네이티브 18px 블러로 비침을 줄입니다. PC는 기존 68% 배경과 굴절 유리를 유지합니다. 실기기의 합성 결과/체감은 별도 확인 사항입니다.
- 둥근 선택 목록은 **항상 입력칸 아래로** 펼칩니다. 위로 뒤집지 않으며 짧은 화면에서는 목록/필터 내부를 스크롤합니다. 화살표는 오른쪽 가장자리에서 띄웁니다.
- **선택 즉시 적용하며 APPLY 버튼은 없습니다.** 필터창은 열린 상태를 유지합니다. 결과 영역과 적용 개수만 갱신해 필터 DOM·포커스·위치를 보존하고 GRID 추가 로딩/INDEX 정렬·행 이동을 다시 연결합니다.
- RESET도 즉시 적용합니다. 선택값은 닫았다 열어도 유지합니다. 결과가 줄어 문서 스크롤 위치가 보정돼도 필터창이 닫히지 않습니다.
- 바깥 클릭·휠·스와이프·문서 스크롤 또는 마우스가 필터 밖에 3초 머물면 닫힙니다. 마우스가 돌아오면 타이머를 취소합니다. 내부 스크롤은 유지하며 라우트 이탈 때 리스너/타이머를 정리합니다.

## 실제 수행한 검증

아래는 구현·배포 때 수행한 결과입니다. 이번 문서 마무리에서 브라우저나 운영 HTTP 검사를 다시 실행한 것으로 간주하지 않습니다.

| 검증 | 확인 범위 | 결과 |
|---|---|---|
| `site-regression.cjs` | 2560/1920/1440/390/320px × 10개 라우트, 데모 CMS·이미지·본문·정렬·추가 로딩·폴백 | [통과](../tests/artifacts/results.json) |
| `filter-live.cjs` | 1440/390/320px·844×390, 농도/블러·RESET/X·하단 목록·즉시 GRID/INDEX·동일 DOM/포커스·결과 축소·행 이동/정리 | [통과](../tests/artifacts/filter-live-results.json) |
| `works-filter.cjs` | 선택/정렬·즉시 초기화·유지된 값·빈 결과·이스케이프 | [통과](../tests/artifacts/works-filter-results.json) |
| `works-filter-position.cjs` | 스크롤 위치·고정 아이콘·바깥 스크롤 닫힘·짧은 화면·리사이즈·라우트 정리 | [통과](../tests/artifacts/works-filter-position-results.json) |
| `mobile-polish.cjs` | 필터/People/Dream·키보드·자동 닫힘, 무작위 제목/폭, 센서 요청/연결 0회 | [통과](../tests/artifacts/mobile-polish-results.json) |
| `mobile-experience.cjs` | 기존 모바일 메뉴·CTA·모션 감소·라우트 정리와 센서 요청/연결 0회 | [통과](../tests/artifacts/mobile-experience-results.json) |
| `island-contact-hover.cjs` | 필터/문의창 확장·축소·호버·정렬·모션 감소·정리 | [통과](../tests/artifacts/island-contact-hover-results.json) |

최종 필터 변경은 위 7개 검증을 통과했습니다. 제목/터치 변경 시에는 [PC와 동일한 마우스 반응·약한 탭·스와이프/취소](../tests/artifacts/about-touch-random-results.json), [제목/흰 박스/BY/X 고정과 CTA](../tests/artifacts/title-spread-stable-cta-results.json), [투명한 장면 감쇠와 유리 헤더](../tests/artifacts/scene-header-coverflow-results.json)도 확인했습니다. 테스트는 운영 연결을 제거한 격리 Chrome/모의 입력이며 실기기 검증과 구분합니다.

- 병합 전에 최종 병합 HTML blob과 검증한 `1fbc884`의 일치를 확인했습니다.
- 2026-11-07 14:30 KST에 `/`, `/index.html`, `/admin`, `/admin/`, `/guidelines`, `/guidelines/buttons`의 HTTP 200/최신 HTML 해시 일치를 확인했습니다. 브랜드 가이드 API는 기존 26개 문서/접근 모드를 유지합니다. [운영 검증](../tests/artifacts/deployment-results.json).
- 세부 원인·수치·변경 이력: [모바일 조작과 필터](MOBILE_POLISH_2026-11-07.md). 최신 캡처는 `tests/artifacts/live-filter-*`, `gentle-touch-cloud-390.png`입니다.

## 남은 확인과 보존 조건

- 실제 iPhone Chrome/Safari의 필터 합성·탭 체감·스크롤/포커스, 모바일 키보드, Firefox와 스크린리더는 미검증입니다. 사용자가 모바일로 중간 버전을 확인해 피드백했지만 최종 운영 버전의 실기기 검증 완료로 보지 않습니다.
- 실제 관리자 자격증명으로 로그인→새 계정→첫 비밀번호 변경→운영 저장/업로드의 전체 왕복은 이전 기록에서 이월한 미검증입니다. 이번 작업에서 시험 계정/콘텐츠를 만들지 않았고 Nov 6의 DB/RLS 검증을 다시 수행했다고 보고하지 않습니다. [계정 관리 기준](CMS_ACCOUNTS_2026-11-06.md).
- 센서 제거·즉시 필터는 확정 사양입니다. 구현 전에 승인받아야 할 별도 미결 사양은 현재 없습니다. 후속 수정/배포 범위는 다음 사용자 요청을 따릅니다.
- 이번 마무리에서는 Markdown 링크/상태/충돌과 변경 범위를 확인했고, 프런트·Vercel 설정·가이드 API·문의/계정 서버 5개 파일의 SHA-256 불변을 검증했습니다. 기존 `.claude/`와 사용자 파일을 보존합니다.

## 다음 작업 시작

1. 이 문서, [모바일 구현 기록](MOBILE_POLISH_2026-11-07.md), `CHANGELOG.md`를 먼저 읽고 관련 `index.html` CSS/뷰/이벤트와 직접 대조합니다. 초기 Preview 전용·센서·APPLY 기록을 현재 사양으로 되살리지 않습니다.
2. 목록 즉시 갱신은 `refreshWorksResults()`, 선택 목록은 `bindFilterPickers()`, 자동 닫힘은 `bindWorksFilter()`를 확인합니다. 전체 `render()`로 열린 필터를 교체하지 않습니다.
3. 제목/터치는 `bindAboutTitle()`·`bindAboutMotion()`을 확인합니다. `svgArt()`의 결정론적 출력과 기존 슬롯 로고는 보존합니다.
4. 관리자 본문/권한은 기존 블록 저장 호환·입력 중 전체 재렌더 금지·메뉴별 RLS를 유지합니다. 초기 설치용 SQL/광범위 쓰기 정책을 기존 운영에 다시 적용하지 않습니다.
