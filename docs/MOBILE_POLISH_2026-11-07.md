# 2026-11-07 모바일 조작과 WORKS 필터

상태: 운영 반영 완료. 사용자 후속 요청으로 Preview 확인 범위를 운영 배포까지 확대해 [PR #20](https://github.com/keruk01-cmd/byx_website/pull/20)을 main `6d7a266`에 병합했습니다. 검증한 실행 소스는 `1fbc884`이며 기존 계정/서버/DB 정책은 보존합니다. 계정 관리 기준은 [11월 6일 인수인계](SITE_UPDATES_2026-11-06.md)를 따릅니다.

## 운영 배포 — 2026-11-07

- [운영 WORKS](https://byx-website.vercel.app/#/), [운영 ABOUT](https://byx-website.vercel.app/#/about), [관리자](https://byx-website.vercel.app/admin).
- GitHub의 병합 결과 HTML blob이 검증한 `1fbc884`와 동일함을 확인한 후 병합했습니다. [Vercel 운영 배포](https://vercel.com/keruk01-cmds-projects/byx-website/GyybgBWEpVRGjGABp2PfDaDmcfMi)가 성공했습니다.
- 2026-11-07 14:30 KST에 `/`, `/index.html`, `/admin`, `/admin/`, `/guidelines`, `/guidelines/buttons`의 HTTP 200과 최신 HTML 해시 일치를 확인했습니다. 브랜드 가이드 API도 기존 26개 문서/접근 모드를 유지합니다. [실제 운영 검증](../tests/artifacts/deployment-results.json).
- 실제 관리자 로그인/저장/업로드·운영 콘텐츠 쓰기·계정/DB 정책 변경은 수행하지 않았습니다. 아래 Preview 전용 범위 기록은 이번 운영 배포 요청으로 갱신합니다. 배포 확인 문서는 기존 방식대로 작업 브랜치에 보관합니다.

## 필터 후속 — 현재 기준

- 모바일/터치 화면은 필터 배경의 흰색 비중을 88%로 높이고 네이티브 18px 블러를 사용합니다. PC는 기존 68% 배경과 굴절 유리를 유지합니다. 모바일에서 배경이 지나치게 비치는 인상을 보정하며 실제 iPhone의 합성 결과는 사용자 확인이 필요합니다.
- 선택 목록은 모두 입력칸 아래로 펼칩니다. 공간에 따라 위로 뒤집는 규칙을 제거했습니다. 목록 자체와 짧은 화면의 필터 내부 스크롤로 공간을 확보합니다.
- TYPE/STATUS/YEAR/SORT BY/ORDER를 선택하면 즉시 목록에 반영합니다. APPLY 버튼은 제거하고 필터창은 계속 엽니다. 전체 페이지나 필터 DOM을 재렌더하지 않고 결과 영역·적용 개수만 바꿔 포커스·위치를 보존합니다. GRID의 추가 로딩과 INDEX의 정렬/행 이동을 다시 연결합니다. 결과 축소로 문서 스크롤이 조정돼도 필터가 자동으로 닫히지 않도록 처리합니다.
- RESET은 왼쪽 상단으로 옮기고 오른쪽 X와 높이/중심을 맞췄습니다. 초기화도 즉시 반영하며 선택값은 닫았다 열어도 유지합니다. 기본 필터 높이는 약 254px입니다. 이전 첫 구현의 적용/초기화 하단 버튼과 미적용 값 폐기 규칙은 이번 사용자 요청으로 갱신합니다.
- `filter-live.cjs`: 1440/390/320px·844×390의 배경/블러, RESET/X 정렬, 모든 드롭다운의 하단 배치와 화면 내 위치, GRID/INDEX 즉시 적용, 결과 축소·동일 필터 DOM/키보드 포커스, 즉시 초기화·행 이동·라우트 정리를 검증했습니다. [결과](../tests/artifacts/filter-live-results.json). 새 캡처는 `live-filter-*`입니다.
- `works-filter.cjs`, `works-filter-position.cjs`, `mobile-polish.cjs`, `mobile-experience.cjs`, `island-contact-hover.cjs`도 현재 즉시 적용 사양으로 검증했습니다. `site-regression.cjs`의 5개 화면 폭 × 10개 라우트/CMS를 포함해 이번 7개 검증을 모두 통과했습니다. 운영 쓰기·계정/DB 정책 변경은 수행하지 않았습니다. 같은 미리보기 브랜치를 갱신하며 운영 main은 유지합니다.

## 모바일 확인 후 후속 수정 — 현재 기준

- 이전 `b1884d7`은 남은 글자를 매 프레임 한 칸씩 순환시켜 I가 규칙적으로 이동했습니다. 현재는 매 프레임 Fisher–Yates로 독립적으로 섞습니다. 같은 글자 구성과 I 개수·전체 폭·글자 크기·흰 박스·BY/X 고정은 유지합니다.
- X 점군의 터치 입력은 손을 뗄 때 10px 이내·500ms 미만의 짧은 탭만 허용합니다. 스크롤 이동·취소·길게 누르기는 점군을 밀지 않습니다. 터치 힘은 기존 마우스의 22%, 반응 범위는 62%, 반응 시간은 110ms이며 변위 한도와 원위치 복귀 시간을 줄였습니다. PC 마우스 반응은 `b1884d7`과 같습니다.
- 기울기 센서 기능을 제거했습니다. 권한 요청, 자동 센서 연결, 방향 이벤트 리스너와 세 장면의 센서 수신을 모두 제거합니다. 반복 방문·화면 방향 변경·본문 탭에서도 센서 권한을 요청하지 않습니다. 일반 스크롤/자동 애니메이션·PC 포인터 반응은 유지합니다. 아래 첫 구현의 센서 설명과 실기기 센서 확인 과제는 이번 사용자 요청으로 종료합니다.
- `mobile-polish.cjs`: 필터/포인터/키보드 회귀, 무작위 재배열이 단순 순환이 아님, I 개수·전체 폭 고정, 390/932px의 센서 요청/연결 0회를 통과했습니다. [최신 결과](../tests/artifacts/mobile-polish-results.json).
- `about-touch-random.cjs`: 1440/390/320px에서 PC 반응이 `b1884d7`과 동일하고 터치 탭은 약하며 스와이프/취소는 변위 0임을 확인했습니다. 모션 감소의 동일 좌표 비교에서 터치 변위는 마우스의 약 17%이고, 일반 애니메이션의 탭 반응도 축소한 변위 범위 안에 있습니다. 실기기 수치로 해석하지 않습니다. [결과](../tests/artifacts/about-touch-random-results.json).
- 기존 모바일 메뉴/CTA·제목 전체 폭/BY/X 고정과 5개 화면 폭 × 10개 라우트/CMS도 다시 검증해 통과했습니다. 실제 iPhone Chrome/Safari의 탭 체감은 사용자 확인이 필요하며 운영 main은 변경하지 않습니다. 같은 작업 브랜치로 Preview를 갱신합니다.

## 첫 구현 기록 — 이전 센서 동작은 위 후속 수정으로 갱신

- People 소개의 X, WORKS 필터와 Dream 문의창: 터치/마우스 입력과 키보드 입력을 구별합니다. 포인터로 연 창에는 자동 포커스 테두리·탭 하이라이트를 표시하지 않고, 키보드 포커스는 계속 표시합니다. 필터를 포인터로 열면 첫 선택 칸을 자동 선택하지 않습니다.
- 필터: 중복 `WORKS / FILTER`·`프로젝트 필터` 제목을 제거하고 280px 폭·약 298px 높이의 두 열 구성으로 줄였습니다. TYPE/STATUS/YEAR/SORT BY/ORDER/RESET/APPLY, 대문자 정렬 항목, A–Z/Z–A를 사용합니다. 프로젝트가 가진 실제 분류 값은 보존합니다.
- 선택 목록: OS 기본 사각 팝업을 둥근 목록으로 바꿨습니다. 화살표는 오른쪽 가장자리에서 띄웠습니다. 기존 form 값·적용/초기화·이스케이프를 유지하며 방향키/Home/End/문자 검색/Enter/Escape/Tab과 combobox/listbox 상태를 제공합니다.
- 자동 닫힘: 바깥 클릭·휠·스와이프·문서 스크롤에 닫힙니다. 마우스가 패널 밖에 3초 머물면 닫히고, 돌아오면 타이머를 취소합니다. 내부 목록의 스크롤은 유지합니다. 닫기만 한 미적용 값은 다음에 열 때 버립니다. 라우트 이탈 시 리스너와 타이머를 정리합니다.
- 모바일 센서: iPhone의 직접 터치 종료·클릭 경로에서 권한을 요청합니다. 사용자 제스처 인식 예외는 영구 거절로 저장하지 않고 다음 직접 입력에서 재시도합니다. 명시적인 거절은 재요청하지 않습니다. 터치 기기의 880px 초과 가로 화면도 허용하고 구형 화면 방향 값도 지원합니다. 세 장면이 보일 때 기울기에 반응하며 기존 모션 감소·메뉴/모달 일시정지·이탈 정리를 유지합니다. 센서 사용 버튼은 추가하지 않았습니다.
- ABOUT 배경: 불투명 검정 감쇠 오버레이를 제거하고 캔버스 그림의 알파만 감쇠합니다. 문서와 함께 움직이는 안개 배경이 그대로 이어지며 유리 헤더 뒤의 그림은 보존합니다.
- 제목: 최종 `POSSIBILITIES`의 글자들을 재배열해 같은 I 개수를 유지하면서 위치를 바꿉니다. 각 글자는 원래 비례를 유지하고 전체 글자 폭·글꼴 크기·흰 박스·BY/X는 고정합니다. 개별 글자 칸 위치까지 고정하던 이전 기준은 이번 사용자 요청으로 갱신합니다. 최종 단어 착지·모션 감소를 유지합니다.

## 검증

운영 연결값을 메모리에서 제거한 격리 사본과 기존 외부 Playwright 설치를 사용합니다. 제품 의존성·빌드 단계는 추가하지 않습니다.

- `mobile-polish.cjs`: 1440/390/320px 필터 크기·실제 선택/적용·초기화·영문/대문자·둥근 목록·키보드·포인터 테두리·바깥 휠/터치 스와이프·문서 스크롤·3초 타이머/재진입, People/Dream 양쪽 문의창을 검사합니다. 390/932px에서 touchend 권한 예외→click 재시도, 세 장면의 모의 센서 반응, I 위치 변화와 동일 글자 구성/폭/크기, 모션 감소를 검사합니다. [결과](../tests/artifacts/mobile-polish-results.json).
- `site-regression.cjs`: 2560/1920/1440/390/320px × 10개 라우트, 데모 CMS·본문 호환·이미지/업로드·정렬/추가 로딩·데이터 폴백을 통과했습니다. [결과](../tests/artifacts/results.json).
- `mobile-experience.cjs`: 기존 모바일 메뉴, 권한 거절/암묵적 권한, 메뉴/모달 일시정지·이탈 정리, 모션 감소·CTA를 통과했습니다. [결과](../tests/artifacts/mobile-experience-results.json).
- `title-spread-stable-cta.cjs`: 1440/390/320/844px의 제목 박스/전체 폭/크기/BY/X 고정, Dream 호버 기하·문의창, 슬롯 반전과 기존 은하 확산을 통과했습니다. [결과](../tests/artifacts/title-spread-stable-cta-results.json).
- `scene-header-coverflow.cjs`: 1440/390/320px의 투명한 장면 감쇠와 실제 캔버스가 유리 헤더에 비치는 픽셀 차이를 통과했습니다. [결과](../tests/artifacts/scene-header-coverflow-results.json).
- `works-filter-position.cjs`·`works-filter.cjs`: 스크롤 위치 보존·아이콘 고정·바깥 스크롤 닫힘·짧은 화면·리사이즈·라우트 정리, 필터/정렬·초기화·빈 결과·이스케이프를 통과했습니다. [위치 결과](../tests/artifacts/works-filter-position-results.json), [기능 결과](../tests/artifacts/works-filter-results.json).
- `island-contact-hover.cjs`: 1440/1024/390/320px와 짧은 화면에서 문의창/필터 확장·축소, 호버·정렬·모션 감소·라우트 정리를 통과했습니다. [결과](../tests/artifacts/island-contact-hover-results.json).
- 내장 JavaScript 구문, diff 공백, 설정 객체·Vercel rewrite·서버/DB 파일 불변을 확인했습니다. 필터 390/320px와 은하 장면 캡처를 직접 확인했습니다. 새 캡처는 `mobile-polish-*`로 보관하고 기존 테스트가 다시 생성한 과거 PNG는 원래대로 정리했습니다.

## 남은 확인

실제 iPhone Chrome의 탭 체감·스크롤/포커스 렌더링과 Safari/Firefox·스크린리더는 미검증입니다. 센서 기능과 권한 요청은 후속 사용자 요청으로 제거했으므로 센서 검증은 남은 과제가 아닙니다. 운영 콘텐츠 쓰기·계정/DB 정책 변경은 수행하지 않았으며 웹 운영 배포는 위 기록처럼 완료했습니다.

이전 센서 구현 참고: [MDN DeviceOrientationEvent.requestPermission](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static).
