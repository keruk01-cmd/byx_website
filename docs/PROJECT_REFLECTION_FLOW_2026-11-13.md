# 프로젝트 반사와 일반 스크롤 — 2026-11-13

상태: 운영 정정 배포 완료. 비교 기준은 `81f1445`, 검증한 소스는 `5f4c416`, 운영 main은 `ef92531`입니다.

## 운영 확인

- [PR #23](https://github.com/keruk01-cmd/byx_website/pull/23)을 병합했고 [Vercel 배포](https://vercel.com/keruk01-cmds-projects/byx-website/9j6UcWsoPv5TW6wm2y9dGXjQ835K)가 성공했습니다. [기존 운영 주소](https://byx-website.vercel.app/#/)에서 확인합니다.
- 병합 결과 HTML blob과 검증한 소스가 동일합니다. 2026-11-13 11:24 KST에 기존 주소 6개 경로의 HTTP 200/최신 HTML 일치와 가이드 API의 기존 26개 문서/접근 모드를 확인했습니다. [운영 검증](../tests/artifacts/deployment-results.json).
- 운영 콘텐츠/계정/서버/DB 정책은 변경하지 않았습니다. 후속 배포 확인 기록은 작업 브랜치에 별도 커밋으로 보관합니다.

## 최종 사양

- Cover Flow·본문·CODE/스펙은 모두 일반 문서 흐름에서 같은 속도로 움직입니다. 본문을 계속 내려 읽으면 Cover Flow도 위로 올라가 화면에서 사라집니다.
- 이전의 `position:sticky`, 스크롤에 따른 전체 그림 감쇠, 읽기 진행 변수·스크롤 리스너/프레임을 제거했습니다. 배경으로 고정하는 해석은 사용자 요청과 달랐습니다.
- 반사만 갤러리 아래로 이어지게 했습니다. 갤러리 트랙의 세로 overflow는 열고, 장면 바깥 가로 overflow만 `clip`으로 자릅니다. 반사는 프레임 높이의 48% 영역에서 기존의 약한 투명도와 정적인 마스크로 자연스럽게 사라집니다.
- 본문·CODE는 투명한 배경으로 반사 위에 놓입니다. 실제 사진 위로 올라가게 만들지 않습니다. 사진 선택 점은 갤러리 하단 내부에 두어 별도 단색 영역을 만들지 않습니다.
- 본문 최소 높이·추가 하단 여백·가독성용 글 그림자를 제거했습니다. 모션 감소에서도 같은 일반 스크롤이며, 갤러리 자체의 회전/관성 감소와 키보드 조작은 보존합니다.
- 메뉴의 방향별 호버 확장은 그대로입니다. 설정·CMS 데이터·서버·Vercel·폰트·원본 이미지와 업로드 경로는 바꾸지 않습니다.

## 변경과 검증

변경 파일은 [index.html](../index.html), [격리 미리보기의 관련 부분](../prototypes/visual-foundation/current.html), [현재 검증](../tests/nav-hover-project-layer.cjs), Cover Flow 검증의 설명 주석, 결과 JSON/새 캡처와 이 기록·CHANGELOG·구현 계획입니다. 이전 고정 배경 캡처는 당시 기록으로 보존합니다.

운영 연결을 제거한 메모리 사본과 기존 외부 Playwright/Chrome을 사용했습니다.

- `nav-hover-project-layer.cjs`: 1440×1000/390×844/320×640/844×390에서 반사가 실제 본문 영역 안으로 이어짐, 투명 배경·행 선 없음, 휠 120px에서 사진/본문의 동일 이동, 전체 밝기 1 유지, 긴 본문에서 사진이 완전히 화면 밖으로 이동함을 확인했습니다. 메뉴 확장·복귀·글자 정렬·키보드/모바일·모션 감소와 내용 보존도 통과했습니다. [결과](../tests/artifacts/nav-hover-project-layer-results.json).
- `coverflow-momentum.cjs`: 기존 마우스/터치/트랙패드·관성·끝단·모션 감소·리사이즈·개수·정리 검사.
- `site-regression.cjs`: 5개 화면 폭 × 10개 라우트와 격리 데모 CMS/이미지/본문/정렬/폴백 검사.
- `project-reflection-flow-1440.png`, `390.png`, `320.png`, `844.png`에서 사진·반사·본문이 만나는 상태를 직접 검토했습니다. 구문·diff 공백·미리보기 일치와 설정/메뉴/Vercel 보존도 확인합니다.

운영 CMS 쓰기는 수행하지 않았습니다. 실제 iPhone/Safari/Firefox·물리 트랙패드·스크린리더는 미검증입니다. 별도 미결 사양은 없습니다.
