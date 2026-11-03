# BYX 브랜드 가이드 운영

2026.11.03 · Draft v0.1 · 흑백 / URL 직접 열람

## 현재 구조와 접속

이 저장소는 Next.js/React가 아니라 단일 `index.html`의 HTML/CSS/JavaScript + Supabase 사이트입니다. 공개 사이트의 라우팅·CMS·Anton/SUIT를 유지합니다. `/guidelines` 또는 `/#/guidelines/overview`에서 가이드에 들어갑니다. `/guidelines/buttons`처럼 문서 URL로 직접 들어갈 수도 있습니다. 공개 메뉴에는 링크를 추가하지 않았습니다.

**사용자 요청에 따라 로그인·계정 승인·내부 역할 검증을 제거했습니다. URL을 아는 누구나 열람할 수 있습니다.** 가이드 API `/api/guidelines`도 인증 없이 문서를 제공합니다. 가이드용 환경 변수나 Supabase 역할 설정은 필요하지 않습니다. 기존 CMS 관리자 로그인은 유지합니다.

검색 제외(`noindex, nofollow, noarchive`)는 유지하지만, 이것은 접근 보호가 아닙니다. 주소가 전달되면 다른 사람도 열 수 있습니다. 프로젝트 기밀·계약·비공개 도면은 이 페이지나 공개 GitHub 저장소에 올리지 않습니다.

## 디자인 기준

- 별도의 시그니처 컬러를 지정하지 않습니다. 청록·에메랄드를 쓰지 않고 검정·흰색·중립 회색으로 구성합니다. 버튼과 선택 상태도 같은 기준을 따릅니다.
- Wanted Sans 본문·UI와 기존 Anton 디스플레이를 유지합니다. 기존 공개 사이트의 SUIT는 별도로 유지합니다.
- 가이드의 둥근 표면·반투명·새 타입/여백 수치는 `.gd` 영역에 한정합니다. 기존 공개 사이트 전체 리디자인은 포함하지 않습니다.
- X는 About의 설명에서만 사용합니다. 도면·표의 정확성을 장식보다 우선합니다.
- 타입 스케일·곡률·블러·컴포넌트·매체별 제작 수치와 출력 규격은 **Draft v0.1**입니다. Apple HIG의 공식 수치나 승인된 건축 기술 표준이 아닙니다.

26개 문서: Start here 1 / Foundations 5 / Materials 1 / Components 6 / Applications 5 / Architecture 6 / Governance 2. 모든 문서에 개요, 시각 예제, 수치, Good/Bad, 복사 가능한 HTML/CSS가 있습니다. 버튼·입력·카드·내비·모달·피드백·반투명·출력 확인 목록을 조작할 수 있습니다. 검색은 한국어/영어 키워드·설명·수치·코드·주의사항을 대상으로 합니다.

## 데이터와 배포

`api/guidelines.js`의 토큰과 문서 데이터를 Vercel Function으로 제공합니다. 빌드 도구·프레임워크·npm 런타임 패키지는 없습니다. 정적 파일 서버만 사용하는 경우 API가 없으므로 본문 대신 불러오기 실패 안내와 재시도 버튼이 표시됩니다. 기존 CMS 인증 장애는 가이드의 열람 조건이 아닙니다.

기존 Vercel 프로젝트에서 이 브랜치를 배포하면 동작합니다. 운영 반영은 일반 PR 검토·병합 절차를 따릅니다. 응답과 CDN은 `no-store`로 설정하여 최신 초안을 불러옵니다. 클라이언트는 현재 방문 동안 데이터를 메모리에 보관하며 별도의 계정·문서 저장소를 만들지 않습니다.

수정할 때 `api/guidelines.js`의 토큰·문서와 `index.html`의 `.gd` 스타일·예제를 함께 맞춥니다. 현재 토큰 JSON 복사는 API 데이터에서 생성합니다. 문서 수정·승인에는 별도 GitHub 쓰기 권한과 검토가 필요합니다. 읽기 URL은 편집 권한을 부여하지 않습니다.

개정 후에는 웹·PPT·DOCX·도면 템플릿을 각각 이관해야 합니다. 기존 파일은 자동 변경되지 않습니다. DWG/RVT/PPTX/DOCX 템플릿 파일은 아직 제공하지 않습니다. 기술 문서는 프로젝트 책임자가 계약·발주처·적용 기준을 따로 확인해야 합니다.

## 서체와 출처

Wanted Sans 1.0.3 complete variable WOFF2를 기존 방식대로 HTML에 내장했습니다. 원본은 [wanteddev/wanted-sans](https://github.com/wanteddev/wanted-sans), 확인 커밋 `02c9b822349c188ada95f9e2d90c2ed18f853235`. 라이선스는 `LICENSE-Wanted-Sans.txt`입니다. 원본 1,289,292 bytes가 base64로 포함되어 HTML이 약 1.72MB 증가합니다. 외부 폰트 CDN 요청은 없습니다.

참고: [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/), [WAI APG Modal Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), [Vercel Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js). 확인일 2026.11.03. 문장과 수치는 BYX 초안으로 작성했습니다.

## 검증

`node --test tests/guidelines.test.cjs`로 무인증 열람, 인증 서비스 비의존, 쓰기 차단, 문서 완전성, 중립색 토큰, 스크립트 문법을 확인합니다.

`node tests/preview-server.cjs` 실행 후 `http://127.0.0.1:4173/guidelines`를 열면 로그인 없이 로컬로 확인할 수 있습니다. 이 서버는 실제 Supabase 요청·쓰기 없이 공개 사이트의 기존 데모 데이터를 사용합니다. loopback 전용이며 `.vercelignore`로 배포에서 제외합니다.
