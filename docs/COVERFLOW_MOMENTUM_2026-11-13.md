# 프로젝트 Cover Flow — 2026-11-13

상태: 사용자 후속 요청으로 운영 배포 완료. 비교 기준은 `e7e6a92`, 검증한 실행 소스는 `c4974cf`, 운영 main은 `a2c23df`입니다.

## 운영 배포

- [운영 WORKS](https://byx-website.vercel.app/#/)에서 프로젝트를 열어 확인할 수 있습니다. [PR #21](https://github.com/keruk01-cmd/byx_website/pull/21)을 병합했고 [Vercel 운영 배포](https://vercel.com/keruk01-cmds-projects/byx-website/HdomhxUateUvsSeh2KpRv4PAeGmv)가 성공했습니다.
- 병합 전에 GitHub 병합 결과의 `index.html` blob이 검증한 소스와 동일함을 확인했습니다. 운영 콘텐츠·서버·DB 정책은 변경하지 않았습니다.
- 2026-11-13 10:56 KST에 `/`, `/index.html`, `/admin`, `/admin/`, `/guidelines`, `/guidelines/buttons`의 HTTP 200과 최신 HTML 해시 일치를 확인했습니다. 브랜드 가이드 API는 기존 26개 문서와 URL 접근 모드를 유지합니다. [운영 검증 결과](../tests/artifacts/deployment-results.json).
- 운영 로그인·저장·업로드나 실제 기기 조작은 수행하지 않았습니다. 배포 확인 문서와 결과는 기존 작업 브랜치에 후속 커밋으로 보관합니다.

사용자가 제공한 [Arc Cover Flow](https://uiarc.dev/components/cover-flow)의 동작 설명을 기준으로 BYX의 단일 HTML 구조에 직접 구현했습니다. Pro 소스나 React/Motion 패키지를 설치하지 않았습니다. 문서 URL의 직접 조회는 타임아웃이 발생해 제공된 프롬프트를 구현 기준으로 사용했습니다.

## 화면과 입력

- 중앙 사진을 크게 표시하고 옆 사진은 거리별로 회전·축소·어둡게 처리합니다. 부드러운 접지 그림자와 아래로 사라지는 약한 반사를 사용합니다. 멀리 있는 카드는 숨깁니다.
- 4:3 프레임 안에서 원본을 `object-fit:contain`으로 표시하므로 세로 사진·도면도 자르지 않습니다. 이미지의 미세 이동은 프레임 안의 남는 공간에서만 이루어집니다.
- 드래그는 이동량을 직접 반영하고 놓을 때 속도에 따른 목적지로 스프링 착지합니다. 빠른 짧은 던지기도 최소 한 장 이동하며, 처음/끝 바깥은 저항을 주고 복귀합니다. 순환/복제 슬라이드는 없습니다.
- 가로 트랙패드는 직접 이동 후 관성 착지합니다. 세로 휠·터치 스크롤·핀치 확대는 브라우저에 맡깁니다. 옆 이미지 클릭과 선택 점으로도 이동합니다.
- 레일에 포커스하면 방향키·Home/End로 탐색합니다. 선택 점은 탭 순서에서 제외하고 현재 항목을 `aria-current`로 표시합니다. 선택된 슬라이드만 보조기술에 노출하고 polite live region으로 현재 위치를 알립니다. 반사 이미지는 장식으로 숨깁니다.
- 모션 감소에서는 회전·이미지 미세 이동·스프링을 제거합니다. 40px 이상 드래그 또는 한 가로 휠 제스처는 한 장씩 전환합니다. 크기 변경 때 현재 사진을 보존하고 라우트 이탈 때 프레임·타이머·리스너·관찰자를 정리합니다.
- 이미지별 캡션·저장 버튼·추가 정보 문구는 넣지 않았습니다. 기존 프로젝트 제목·본문·스펙과 CMS 저장 데이터는 보존합니다.

## 변경 파일

- [index.html](../index.html): 프로젝트 전용 CSS, `viewProjectDetail()`, `bindProjectGallery()`.
- [격리 미리보기](../prototypes/visual-foundation/current.html): 갤러리만 동일하게 갱신했습니다. 운영 연결이 없는 기존 스냅샷이며 다른 영역은 최신 `index.html`과 일치한다고 보장하지 않습니다.
- [상호작용 검증](../tests/coverflow-momentum.cjs), [결과](../tests/artifacts/coverflow-momentum-results.json), `tests/artifacts/momentum-coverflow-*.png`.
- 이 기록, [CHANGELOG](../CHANGELOG.md), [구현 계획 기준선](BRAND_IMPLEMENTATION_PLAN.md#2-소스-분석-기준선), 기존 회귀의 최신 `tests/artifacts/results.json`.

BLOG 갤러리·슬롯 로고·설정 객체·Auth/Storage/DB·Vercel 설정·서버와 운영 콘텐츠는 변경하지 않았습니다. 프레임워크·빌드 단계·제품 의존성도 추가하지 않았습니다. 기존 미추적 `.claude/`를 보존했습니다.

## 실제 검증

운영 연결을 메모리에서 제거한 HTML을 루프백 서버에서 제공하고, 기존 외부 Playwright 설치와 Chrome을 사용했습니다. 운영 콘텐츠에 시험 쓰기는 하지 않았습니다.

| 검사 | 결과 |
|---|---|
| 1440×1000, 390×844, 320×640, 844×390 | 중앙 이미지 전체 표시·옆 사진 클릭·포커스·넘침 없음, 캡처 직접 검토 |
| 마우스 이동량/속도 | 같은 짧은 이동에서 느린 드래그는 현재 사진, 빠른 던지기는 다음 사진에 착지 |
| 끝단·키보드 | 끝단 저항/복귀, 순환 없음, 연속 방향키·Home/End |
| 휠·CDP 터치 | 가로 이동, 세로 문서 스크롤 유지, 터치 스와이프·취소 |
| 모션 감소·리사이즈·수명주기 | 회전/미세 이동 제거, 제스처당 한 단계, 선택 보존, 타이머 도중 이탈/재진입 |
| 1/2/3장 | 원본 개수 유지, 유한 탐색 |
| `site-regression.cjs` | 2560/1920/1440/390/320px × 10개 라우트, 기존 데모 CMS·본문·업로드·날짜/정렬·추가 로딩·폴백 통과 |
| 구문·diff·보존 범위 | 내장 JavaScript 구문, 공백, 설정/Vercel/서버/데이터 처리 보존 확인 |

입력 검증 중 터치의 암시적 캡처가 이미지에서 레일로 넘어가면서 자식의 `lostpointercapture`가 버블링하는 것을 확인했습니다. 해당 이벤트를 실제 레일 캡처 취소와 구분한 뒤 네 화면에서 터치 검증을 통과했습니다.

이전 `finite-coverflow.cjs`는 동일 밝기·모든 7컷 경계 맞춤 등 과거 시각 사양에 고정되어 있어 이번 새 사양의 합격 기준으로 사용하지 않았습니다. 새 동작은 `coverflow-momentum.cjs`에 기록합니다.

미검증: 실제 휴대전화/트랙패드의 체감과 합성, Safari/Firefox, 스크린리더 실제 낭독, 실제 운영 관리자 로그인/저장/업로드. 별도의 추가 사양 결정은 없습니다.
