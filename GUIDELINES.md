# BYX 내부 브랜드 가이드 운영

2026.11.03 · Draft v0.1

## 현재 구조

이 저장소는 Next.js/React가 아니라 단일 `index.html`의 HTML/CSS/JavaScript + Supabase 사이트입니다. 기존 공개 사이트의 라우팅·CMS·Anton/SUIT·흑백 스타일을 유지했습니다. `/guidelines` 또는 `/#/guidelines/overview`에서 가이드에 들어갑니다. 공개 메뉴에는 링크를 추가하지 않았습니다.

사용자 요청에 따라 다음 두 가지 기존 제약에 한정해 예외를 추가했습니다.

- 청록·회색 surface·곡률·Wanted Sans는 `.gd` 영역에만 적용합니다. 공개 사이트는 기존 토큰을 사용합니다.
- 실제 접근 보호를 위해 `api/guidelines.js` Vercel Function을 추가했습니다. 빌드 도구·프레임워크·npm 패키지는 추가하지 않았습니다. 단순 정적 호스팅에서는 공개 사이트만 동작하고 가이드 데이터는 열리지 않습니다.

26개 문서: Start here 1 / Foundations 5 / Materials 1 / Components 6 / Applications 5 / Architecture 6 / Governance 2. 모든 문서에 개요, 시각 예제, 수치, Good/Bad, 복사할 수 있는 HTML/CSS가 있습니다. 버튼·입력·카드·내비·모달·피드백·반투명·출력 확인 목록을 조작할 수 있습니다. 검색은 제목·설명·수치·코드·주의사항 전체를 대상으로 하며, 로그인한 브라우저 메모리에서만 동작합니다.

## 최초 접근 설정 (실제 서비스에서 필요)

1. 기존 BYX Vercel 프로젝트의 **Settings → Environment Variables**에 `SUPABASE_URL`과 `SUPABASE_PUBLISHABLE_KEY`를 등록합니다. `index.html` 상단 `BYX_CONFIG`와 같은 Supabase 프로젝트의 URL과 publishable key를 사용합니다. service role/secret key는 필요하지 않습니다.
2. Supabase 관리자 화면에서 내부 사용자를 초대하고 이메일 확인 및 비밀번호 설정을 완료합니다. 공개 가입을 내부 접근 승인으로 간주하지 않습니다.
3. 신뢰할 수 있는 관리자 환경에서 해당 사용자의 **app_metadata**에 아래 역할 중 하나를 설정합니다. **user_metadata**나 사용자 프로필 입력에 넣으면 안 됩니다. 기존 app_metadata의 다른 항목은 보존합니다.

```json
{"byx_guidelines_role":"viewer"}
```

4. Vercel에서 이 브랜치를 Preview로 배포해 승인 계정·미승인 계정·비로그인 상태를 점검합니다. Production에 반영하려면 저장소의 일반 검토·병합 절차를 따릅니다. 환경 변수 변경은 재배포해야 적용됩니다.
5. `/guidelines`에서 기존 Supabase 이메일/비밀번호로 로그인합니다. 역할이 없으면 안내와 함께 차단됩니다. 설정이 없거나 Auth 서버에 연결할 수 없는 경우에도 열리지 않습니다.

역할은 `viewer`, `editor`, `admin` 세 개입니다. 현재 웹 가이드는 **모두 읽기 전용**입니다. Editor는 변경 제안, Admin은 최종 승인·권한 관리라는 운영상 책임을 뜻합니다. GitHub 쓰기 권한이나 Supabase 관리자 권한을 자동으로 부여하지 않습니다. 문서 편집 화면·권한 변경 API는 없습니다.

## 보호의 범위

- 모든 데이터 요청에서 Supabase `/auth/v1/user`를 호출해 토큰과 현재 `app_metadata`를 확인합니다. 사용자 수정이 가능한 metadata나 클라이언트의 session 객체만 신뢰하지 않습니다.
- 인증 실패 401 / 미승인·익명 Auth·미확인 이메일 403 / 설정·인증 서비스 장애 503. 모두 문서 데이터 없이 응답합니다.
- 응답과 CDN 캐시를 `no-store`로 지정합니다. 별도 로컬 저장소·서비스워커·토큰 URL은 사용하지 않습니다. 기존 Supabase SDK의 로그인 세션 저장 방식은 유지합니다.
- 로그아웃·페이지 이탈·탭이 숨겨질 때 문서 메모리를 제거합니다. 보이는 동안 60초마다 재검증하며 실패하면 본문을 제거합니다. 다시 탭을 열면 재검증합니다. 권한 철회 이후 API는 다음 요청부터 차단되지만 이미 열람·복사한 내용을 회수할 수는 없습니다. 사용자 계정 삭제/세션의 즉각적인 전체 기기 폐기는 별도 운영 절차입니다.
- `noindex`는 검색 노출 억제이며 접근 보호의 근거가 아닙니다. hash URL에서는 HTTP 헤더가 분기되지 않으므로 브라우저 meta도 적용합니다.
- **이 GitHub 저장소는 공개입니다.** 일반 디자인 규칙의 원본 코드는 공개될 수 있습니다. 서버 접근 보호가 GitHub 소스까지 비공개로 만들지는 않습니다. 기밀 도면·계약·고객 정보는 커밋하지 마세요. 원본 자체도 비공개여야 한다면 비공개 저장소 또는 RLS/private Storage가 필요합니다. 일반 규칙만 포함한 현재 구현에는 별도 테이블·Storage·RLS 변경이 없습니다.

## 브랜드 값의 확정과 이관

확인된 기존 값: Anton, SUIT Variable, 흑백, 1px 선, `--pad:clamp(16px,3.2vw,44px)`. Wanted Sans는 이번 요청에 따라 가이드에 적용했으며 공개 사이트 전체 폰트 교체는 포함하지 않습니다. 가이드 본문의 한글 디스플레이 fallback도 Wanted Sans입니다.

청록 HEX, 보조색, 타입 스케일, 여백, 곡률, blur, 컴포넌트 수치, PPT/문서/소셜/도면 제작 값은 **Draft v0.1 제안**입니다. Apple HIG의 공식 수치나 승인된 BYX 기술 표준이 아닙니다. 도면/사양서는 계약·발주처·적용 기준을 책임자가 별도 확인해야 합니다. 플랫폼 캔버스는 제작 제안이며 최신 업로드 제한이라고 단정하지 않습니다.

수정 시 `api/guidelines.js`의 `tokens` 및 해당 문서 내용을 바꾸고, `index.html`의 `.gd` CSS·예제를 함께 맞춥니다. 토큰 복사 기능은 이 데이터에서 JSON을 생성합니다. 개정일과 버전, 승인자/검토 내용을 변경 기록에 남긴 뒤 각 매체 템플릿을 별도로 갱신합니다. 기존 PPT·문서·이미지는 자동 변경되지 않습니다.

DWG/RVT/PPTX/DOCX 템플릿은 아직 제공하지 않습니다. 화면 예시는 스케일 없는 시안이며 실제 납품 도서를 대신하지 않습니다. 향후 파일이 생기면 승인된 버전과 권한을 확인하는 다운로드 엔드포인트를 추가하세요.

## 서체와 출처

Wanted Sans 1.0.3의 complete variable WOFF2를 기존 사이트 방식대로 HTML에 내장했습니다. 외부 폰트 CDN 요청은 없습니다. 원본은 [wanteddev/wanted-sans](https://github.com/wanteddev/wanted-sans), 확인 커밋 `02c9b822349c188ada95f9e2d90c2ed18f853235`. 라이선스 전문은 `LICENSE-Wanted-Sans.txt`입니다. complete 파일 1,289,292 bytes가 base64로 포함되어 HTML 크기가 약 1.72MB 증가합니다. 향후 성능 최적화는 서브셋/별도 파일 정책과 함께 검토하세요.

설계 참고: [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/), [WAI APG Modal Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/). 인증 확인: [Supabase getUser](https://supabase.com/docs/reference/javascript/auth-getuser). 런타임: [Vercel Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js). 참조 확인일 2026.11.03. 가이드의 한국어 문장과 수치는 BYX 초안으로 새로 작성했습니다.

## 검증

추가 패키지 설치 없이 `node --test tests/guidelines.test.cjs`로 인증 거부·역할 승인·철회·장애·문서 완전성·스크립트 문법·대비를 확인합니다.

로컬 화면 검증은 `node tests/preview-server.cjs` 실행 후 `http://127.0.0.1:4173/guidelines`를 엽니다. **이 서버는 가짜 데이터만 사용하는 QA 전용**이며 실제 Supabase 요청/쓰기/계정 변경이 없습니다. 테스트 계정 `viewer@example.test` / `preview-only`는 이 loopback 서버에서만 유효합니다. 프로덕션 HTML/API에는 인증 우회가 없으며 `.vercelignore`는 tests를 배포에서 제외합니다.

브라우저 확인: 데스크톱 1440px / 모바일 390px, 메뉴·검색·이전/다음·목차·코드 복사, 버튼 44/48px 및 loading/disabled/focus, 입력 오류/정상, 모달 Tab/Shift+Tab/Escape 및 포커스 복귀, 탭 복귀 재검증·로그아웃, 공개 라우트 회귀. 실제 운영 계정/배포 환경 테스트는 환경 변수와 역할을 등록한 뒤 수행해야 합니다.
