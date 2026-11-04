# BYX · 유리 헤더·업로드 복구·Vercel 반영

2026-11-04. 사용자가 콘텐츠에 반응하는 헤더, 이미지 추가 오류 해결과 웹용 압축, Vercel 최신 사이트 배포를 요청했습니다. 이 요청은 이전의 이번 범위 커밋·main 병합·운영 배포 금지를 갱신합니다.

## 헤더

- 흰 콘텐츠 위에는 흰 유리/검정 글자, 어두운 콘텐츠 위에는 검정 유리/흰 글자입니다. 슬롯 로고·고정 밑줄·내비 밑줄·모바일 메뉴 아이콘도 같은 색을 사용합니다.
- 유리층 불투명도 60%, 배경 블러 22px, 미세한 반사선. 실제 헤더 뒤의 배경을 14개 지점에서 읽고 두 임계값으로 경계의 반복 전환을 억제합니다. 스크롤은 수동 개입 없이 네이티브로 유지하고 계산은 animation frame에 모읍니다.
- 사진은 32×32 표본을 캐시해 화면에 겹친 부분의 밝기를 사용합니다. CORS 허용 이미지에는 익명 이미지 읽기를 시도하며, 금지된 외부 사진은 주변 배경색으로 폴백합니다. 외부 iframe·임의의 CSS 배경 이미지를 화면 픽셀처럼 읽는 기능은 아닙니다.
- 모바일 메뉴가 열리면 흰 메뉴에 맞춥니다. 투명도 감소/블러 미지원 환경에서는 현재 색의 불투명 배경을, 모션 감소에서는 즉시 전환을 사용합니다. 가이드의 별도 헤더는 보존합니다.

## 이미지 오류의 원인과 운영 수정

실제 운영 BYX에서 `media`는 public 버킷이지만 `storage.objects`의 정책은 0개였습니다. `projects` 등 표의 쓰기 정책은 이미 있었고 Storage에는 적용되지 않습니다. Public 읽기만으로 업로드가 허용되지 않으므로 로그인 상태에서도 `new row violates row-level security policy`가 발생했습니다. [Supabase 공식 문서](https://supabase.com/docs/guides/storage/security/access-control).

[STORAGE_UPLOAD_POLICY.sql](STORAGE_UPLOAD_POLICY.sql)의 `byx_admin_media_insert`를 운영에 적용했습니다. 현재 확인된 단일 관리자 UUID와 `media` 버킷에만 INSERT를 허용합니다. 계정·비밀번호·기존 데이터·공개 읽기·다른 버킷은 바꾸지 않았습니다. `upsert:false`이므로 UPDATE/DELETE/목록 권한은 추가하지 않습니다. 새 관리자 계정이 생기면 정책을 검토해야 합니다.

운영 DB에서 역할/JWT를 설정한 RLS 삽입 검증으로 기존 관리자 허용, 다른 계정·비로그인·다른 버킷 거부를 확인했습니다. 각 삽입은 예외 하위 트랜잭션에서 롤백했으며 검증 객체 잔존은 0개입니다. 실제 파일 바이트를 운영 Storage에 올리거나 CMS 콘텐츠를 시험 저장하지 않았습니다. 검증 SQL은 [storage-rls.sql](../tests/storage-rls.sql)입니다.

Supabase 보안 Advisor에서 신규 Storage 정책 경고는 없었습니다. 기존 Auth의 유출 비밀번호 보호 비활성화 경고 1건은 별도 운영 항목으로 남겨두었고 설정을 바꾸지 않았습니다.

## 이미지 변환

- 브라우저에서 읽을 수 있는 JPEG·PNG·WebP·AVIF 등은 WebP로 재인코딩합니다. 긴 변 최대 2560px, 비율 유지, 확대 금지, 품질 0.82. 900KiB보다 크면 품질을 0.76→0.70까지 낮추며 이것은 엄격한 용량 상한이 아닙니다.
- 실제 출력 MIME과 확장자를 맞추고, MIME이 빈 파일은 확장자로 분류합니다. `createImageBitmap` 실패 시 일반 이미지 디코더를 시도합니다. WebP 인코딩 미지원은 JPEG로 폴백합니다.
- GIF·SVG, 양쪽 디코더 실패, 인코딩 실패, 결과가 원본보다 큰 경우에는 원본을 보존합니다. HEIC/HEIF/TIFF 등은 브라우저가 읽지 못하면 변환되지 않습니다. AVIF 출력 인코더·서버 변환·추가 런타임 라이브러리는 도입하지 않았습니다. [Canvas 출력 형식 문서](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob).
- 업로드 직전 로그인 세션을 확인하고, 만료 로그인과 Storage 권한 거부를 구분해 안내합니다. 모든 업로드 진입점은 기존 `shrink()` 경로를 사용합니다.

테스트 도형 이미지의 실제 결과(실제 사진의 용량·품질을 보장하는 수치가 아님):

| 입력 | 원본 | 결과 | 결과 크기 |
|---|---:|---|---:|
| JPEG 4000×2600 | 1,496,544B | WebP 2560×1664 | 191,720B |
| PNG 4000×2600 | 630,218B | WebP 2560×1664 | 187,840B |
| WebP 4000×2600 | 320,850B | WebP 2560×1664 | 191,004B |
| AVIF 800×520 | 24,879B | WebP 800×520 | 24,732B |

## 검증·파일

- [기존 회귀 결과](../tests/artifacts/results.json): 2560/1920/1440/390/320px × 10개 라우트, 프로젝트 편집·데모 저장·지도 모의 타일·점군·FEED·슬롯·TOP·레이아웃. 실행 오류 0건.
- [추가 검증 결과](../tests/artifacts/header-upload-results.json): 1440/390/320px에서 흰/검정 배경·어두운 사진·원복·모바일 메뉴·슬롯/내비 색·투명도 감소·가이드 유지. 4개 실제 입력 형식, MIME 누락·디코더/JPEG 폴백·GIF/SVG·원본 유지·인증 만료/권한 오류 모의 검증. 실행 오류 0건.
- `node --test tests/guidelines.test.cjs`: 기존 운영 가이드의 무인증 읽기·쓰기 차단·26개 문서·스크립트 구문 등 4개 통과.
- 공개 사이트는 단일 `index.html` 유지. 운영 main의 `api/guidelines.js`·가이드 경로/서체/문서·Vercel 설정을 병합으로 보존합니다. `.vercelignore`에 시안·문서·개인 `.claude/`를 추가해 개발 자료 배포를 방지합니다.
- 격리 `current.html`은 운영 연결을 비우고 최신 소스와 맞췄습니다. 가이드 API도 확인하려면 저장소 루트의 `node tests/preview-server.cjs`와 `http://127.0.0.1:4173/guidelines`를 사용합니다.

미검증: 실제 관리자 브라우저의 로그인→파일 업로드 전체 왕복, 실기기 Safari/Firefox·HEIC, 실제 건축 사진의 주관적 화질. 프로젝트 날짜/기간/좌표용 추가 열은 이번에 적용하지 않았습니다.

## 배포 확인

운영 반영을 완료했습니다. Vercel 연결 저장소는 `keruk01-cmd/byx_website`, 운영 브랜치는 `main`입니다. 기존 브랜드 가이드를 통합한 구현 커밋 `91e2dd9`를 [PR #3](https://github.com/keruk01-cmd/byx_website/pull/3)으로 병합했습니다. 운영 배포 커밋은 `5dbe45d`, GitHub Production Deployment ID는 `7538583564`이며 Vercel 성공 상태를 확인했습니다.

- 운영 URL: [https://byx-website.vercel.app](https://byx-website.vercel.app)
- 2026-11-04 14:18 KST에 `tests/check-deployment.cjs`로 `/`, `/index.html`, `/admin`, `/admin/`, `/guidelines`, `/guidelines/buttons`의 HTTP 200과 수정 HTML SHA-256 일치를 확인했습니다.
- `/api/guidelines`는 HTTP 200, URL 열람 방식, 기존 26개 문서 응답을 확인했습니다.
- 실제 응답 결과는 [배포 확인 JSON](../tests/artifacts/deployment-results.json)에 있습니다. 이 확인은 읽기 전용이며 실제 관리자 로그인·운영 파일 업로드 검증과 구분합니다.
