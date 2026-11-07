# 2026-11-07 모바일 조작과 WORKS 필터

상태: 구현·격리 Chrome 검증 완료. 2026-11-07 사용자 요청으로 작업 브랜치 `design/byx-brand-identitycodex`에 커밋·푸시하고 모바일 확인용 Vercel Preview를 확인합니다. 운영 main 병합·Production 배포는 이번 push 범위에 포함하지 않습니다. 기존 운영과 계정 관리는 [11월 6일 인수인계](SITE_UPDATES_2026-11-06.md)를 따릅니다.

## 변경

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

실제 iPhone Chrome의 권한창·센서·스크롤/포커스 렌더링과 Safari/Firefox·스크린리더는 미검증입니다. iPhone 센서 권한은 ABOUT 본문의 직접 터치에서 요청되며 실제 거절 상태나 기기 설정으로 차단된 권한을 코드가 우회하지 않습니다. 모의 센서 통과를 실제 기기 해결로 단정하지 않습니다. 운영 콘텐츠 쓰기·계정/DB 정책 변경·운영 배포는 수행하지 않았습니다.

권한 요청과 사용자 제스처 참고: [MDN DeviceOrientationEvent.requestPermission](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static).
