# ARCHITECTS BY X

BYX 공식 웹사이트입니다. 단일 `index.html`에 HTML·CSS·JavaScript와 폰트를 포함하며 Supabase CMS와 Vercel 배포 구조를 유지합니다. 프레임워크나 빌드 단계는 없습니다.

현재 개선 디자인은 실제 사이트 파일인 [index.html](index.html)에 반영되어 있습니다. 기존 슬롯머신 로고와 Anton/SUIT를 유지하고, WORKS 밀도·고정 TOP 버튼·유리 헤더·ABOUT의 회전 X 점군·최신 카드와 아카이브형 FEED를 적용했습니다.

운영 연결 없이 확인하려면 [현재 미리보기](prototypes/visual-foundation/current.html)를 열거나 저장소 루트에서 아래 명령을 실행합니다.

```powershell
node prototypes/visual-foundation/preview.cjs
```

`http://127.0.0.1:8742/current.html`로 접속합니다. 관리자 변경은 메모리에만 저장되며 새로고침하면 초기화됩니다. `original.html`, `a.html`, `b.html`은 이전 비교 기록입니다.

- [작업 정리·검증·남은 항목](docs/SITE_UPDATES_2026-11-03.md)
- [개발 기준](AGENTS.md), [변경 이력](CHANGELOG.md)
- [미리보기 실행 안내](prototypes/visual-foundation/README.md)

프로젝트의 일 단위 날짜·기간·지도 좌표 저장용 추가 열은 [PROJECT_FIELDS.sql](docs/PROJECT_FIELDS.sql)에 준비되어 있으며 운영 DB에는 아직 적용하지 않았습니다. 운영 로그인·실제 저장·실기기와 Safari/Firefox 검증은 별도로 남아 있습니다.
