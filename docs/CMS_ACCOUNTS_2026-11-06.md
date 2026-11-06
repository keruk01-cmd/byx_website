# Feed 편집기와 관리자 계정

사용자 후속 요청으로 사이트 안의 계정 추가·접근 제거·메뉴별 권한을 구현합니다. 단일 HTML 프런트를 유지하며, 이 요청에 필요한 인증 서버만 `supabase/functions/admin-accounts/index.ts`에 추가했습니다. 운영 설정값과 기존 Auth 계정·콘텐츠·Storage 파일을 보존합니다.

## 사용

- 기존 관리자는 Owner입니다. `/admin` 로그인 후 Accounts에서 관리합니다.
- 계정 추가에는 이메일과 12~128자 임시 비밀번호가 필요합니다. 별도로 전달하고 새 계정은 첫 로그인에서 본인 비밀번호로 바꿉니다. 초대 메일을 자동 발송하지 않습니다.
- Owner는 전체 편집과 계정 관리, Editor는 지정한 Project/Feed/About/Contact/Inquiries만 사용합니다.
- 접근 권한 제거는 CMS 접근을 비활성화합니다. Auth 신원과 기존 글·이미지를 보존합니다. 같은 이메일과 새 임시 비밀번호로 다시 추가할 수 있습니다.
- 본인의 Owner 권한 변경/제거와 마지막 Owner 제거를 차단합니다. 활성 계정은 최대 30개입니다.
- Feed 본문은 표시되는 모습에서 직접 편집합니다. `## `는 소제목, `> `는 인용, `- `와 `1. `는 목록으로 바뀝니다. `?`에서 작성법을 볼 수 있고 정렬은 아이콘으로 제공합니다. CATEGORY/유형/상태는 직접 입력과 명시적인 선택 목록을 함께 지원합니다.

## 서버

- [CMS_MEMBERS.sql](CMS_MEMBERS.sql)은 기존 관리자 한 계정만 Owner로 연결합니다. 공개 콘텐츠 읽기와 기존 NULL 공개 판정을 보존하며 비공개 글은 Feed 권한으로 읽습니다.
- 편집 권한은 클라이언트와 RLS에서 검사합니다. 권한을 제거하면 기존 JWT를 가진 계정도 즉시 편집/비공개 조회가 차단됩니다. Storage INSERT와 문의 조회/상태 변경도 메뉴 권한을 검사합니다.
- `cms_members`의 직접 변경과 관리 RPC 실행은 클라이언트에 허용하지 않습니다. Edge Function은 Auth 서버에서 JWT의 사용자를 확인하고 Owner 여부를 검사한 뒤 서버 전용 RPC를 호출합니다. 브라우저가 보낸 actor/role 주장을 인증으로 사용하지 않습니다.
- 함수의 기본 게이트웨이 JWT 검사도 유지합니다. 비밀 키와 비밀번호는 응답/문서/감사 로그에 저장하지 않습니다. 계정/권한 변경만 비공개 감사 표에 남깁니다.

## 검증

- `feed-inline-editor.cjs`: 1440/390/320px의 자동 블록·인라인 변환, 선택 서식/색상/정렬, undo/redo, 도움말, 분류 선택/직접 입력, 기존 모든 블록·색상·이미지 묶음의 왕복/저장/공개 출력. Chrome IME 조합 이벤트를 검증했습니다.
- `cms-accounts-ui.cjs`: 세 화면의 Owner 전용 Accounts, 생성/권한 변경/접근 제거, 본인 보호, 메뉴 제한, 첫 비밀번호 변경과 로그아웃 정리를 격리 데모로 검증했습니다.
- `admin-accounts.test.cjs`: 인증·Owner 검사, 위조 actor 무시, 권한/비밀번호 검증, 신원/파일을 보존하는 접근 제거, 본인 비밀번호 변경, 실패 시 방금 만든 신원만 정리하는 6개 서버 테스트를 통과했습니다.
- [cms-permissions.sql](../tests/cms-permissions.sql)은 실제 DB의 트랜잭션에서 메뉴별 쓰기·자기 승격 차단·문의 보호·Storage 허용/차단·비공개 글·임시 비밀번호·즉시 권한 회수·기존 Owner/마지막 Owner 보호를 검증했습니다. DDL과 모든 계정/데이터 픽스처를 롤백했고 잔존 없음도 확인했습니다.
- 실제 관리자 비밀번호로 로그인하거나 운영에 새 계정/시험 글을 만들지는 않았습니다. 실기기 키보드·Safari/Firefox는 미검증입니다.

참고: [Supabase 함수 인증](https://supabase.com/docs/guides/functions/auth), [사용자 관리](https://supabase.com/docs/guides/auth/users), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security). 편집 명령은 [브라우저 undo 이력을 보존하는 API](https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand)를 사용하고 실제 Chrome 입력/undo와 한글 조합을 검증합니다. 프런트 런타임 라이브러리는 추가하지 않았습니다.

## 배포

DB 정책과 `admin-accounts` 인증 함수를 먼저 반영한 뒤, 구현 `70b5d55`를 [PR #19](https://github.com/keruk01-cmd/byx_website/pull/19)/main `3125b49`로 배포했습니다. Vercel 운영 배포가 성공했고 2026-11-06 18:22 KST에 6개 경로의 최신 HTML/HTTP 200과 기존 가이드 API를 확인했습니다. [배포 결과](../tests/artifacts/deployment-results.json).

기존 관리자 1개가 활성 Owner로 유지되며 검증 계정·글·Storage 메타데이터가 남지 않았음을 읽기 전용으로 확인했습니다. 계정 API는 토큰 없음/익명/위조 토큰 모두 401, 익명 컨텍스트·회원 표도 401이며 공개 프로젝트는 200, 비공개 글은 조회되지 않습니다. [실제 API 검사](../tests/artifacts/cms-live-checks.json). 실제 계정으로 생성/로그인/비밀번호 변경을 수행한 것은 아니며 이 왕복은 격리 데모·서버 단위 검증과 구분합니다.
