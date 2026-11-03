/* Internal handbook. Vercel executes this file; never ship its payload in index.html.
   This repository is public: keep client/project confidential information out of source. */
const tokens = {
  version: '0.1', status: 'draft', updated: '2026-11-03',
  color: { ink: '#000000', paper: '#ffffff', secondary: '#595959', line: '#d8d8d8', surface: '#f5f5f7', accent: '#007F73', accentHover: '#00665D' },
  font: { body: 'Wanted Sans', display: 'Anton', legacyBody: 'SUIT Variable' },
  space: [4, 8, 12, 16, 24, 32, 48, 64, 96],
  radius: { control: 12, card: 24, panel: 32, pill: 999 },
  motion: { durationMs: 150, easing: 'cubic-bezier(.22,.61,.36,1)' }
};

// Specifications below are BYX proposals, not measurements prescribed by Apple HIG.
const article = (id, group, title, subtitle, intro, demo, specs, good, bad, html, css, notes = []) =>
  ({ id, group, title, subtitle, intro, demo, specs, good, bad, html, css, notes, status: 'draft' });
const articles = [
  article('overview', 'Start here', 'Design Guidelines', '명확한 기준. 일관된 경험.',
    '건축이 중심이 되고, 디자인은 이해를 돕습니다. 화면에서 도면까지 서체·정렬·정보 위계를 공유하는 BYX의 내부 제작 기준입니다. Apple HIG의 탐색 구조와 명료한 인터페이스 원칙을 참고하되, 아래 수치는 BYX가 검토할 제안입니다.', 'overview',
    [['문서 상태', 'Internal · Draft v0.1 · 2026.11.03'], ['확인된 기존 값', 'Anton / SUIT Variable, 흑백, 1px 선, --pad 16–44px'], ['요청 반영', 'Wanted Sans, 제한된 청록, 둥근 surface, 반투명 UI'], ['미확정', '청록 HEX, 크기 체계, 모서리, 출력·매체별 수치 모두 draft']],
    '프로젝트 이미지와 기술 정보의 정확성을 먼저 확보하고, 공통 토큰으로 화면을 구성합니다.', '이 초안을 최종 승인된 브랜드 매뉴얼이나 건축 기술 표준으로 인용하지 않습니다.',
    '<main><h1>Project title</h1><p>건축과 공간을 설명하는 본문.</p></main>',
    'main { color: #000; background: #fff; }',
    ['Surface는 둥글게, Content는 정확하게. 도면·표·사진의 내용을 장식 때문에 자르지 않습니다.', 'X는 About의 브랜드 설명에만 사용합니다. 버튼, 로딩, 카드 장식에는 반복하지 않습니다.', '기존 사이트 전체의 리디자인은 포함하지 않습니다. 이 가이드에서 새 기준을 검토한 뒤 매체별로 이관합니다.']),
  article('colors', 'Foundations', 'Color', '흑백을 기본으로, 청록은 필요한 순간에.',
    '검정과 흰색이 정보의 대부분을 담당합니다. 청록은 선택·주요 액션에 제한합니다. 색만으로 상태를 전달하지 않고 텍스트 또는 아이콘을 함께 사용합니다.', 'colors',
    [['Ink / Paper', '#000000 / #FFFFFF · 기존 기준'], ['Secondary / Line', '#595959 / #D8D8D8 · draft'], ['Accent / Hover', '#007F73 / #00665D · draft'], ['대비', '흰색–Accent 약 4.90:1 · 검정–흰색 21:1'], ['강조 면적', '한 화면 약 5% 이내를 출발점으로 검토 · draft']],
    '주요 버튼 하나와 현재 선택에만 청록을 씁니다. 보조 본문은 #595959로 읽기 대비를 확보합니다.', '기존 #8E8E8E 보조색을 흰 바탕의 작은 본문에 그대로 쓰거나, 강조색을 넓은 배경 전체에 쓰지 않습니다.',
    '<button class="primary">검토 요청</button>', '.primary { color: #fff; background: #007f73; }\n.primary:hover { background: #00665d; }',
    ['대비 값은 불투명 sRGB 색상 기준 계산값입니다. 이미지·반투명 바탕에서는 실제 합성 결과를 다시 확인합니다.', '선 색 #D8D8D8은 장식 구분선용입니다. 입력 경계와 포커스에는 #767676 이상으로 구별되는 선을 사용합니다.']),
  article('typography', 'Foundations', 'Typography', 'Wanted Sans로 읽고, Anton으로 시작합니다.',
    '기존 저장소의 디스플레이 서체는 Anton입니다. Gasoek One으로 임의 변경하지 않습니다. Wanted Sans는 새 가이드의 본문·UI에 적용하며, 공개 사이트의 SUIT는 기존 상태로 유지합니다.', 'typography',
    [['Display', 'Anton 400 · 한글은 Wanted Sans 700 fallback'], ['Page title', 'clamp(40px, 5vw, 72px) / 1.05'], ['Section / Body', '28px / 1.3 / 650 · 16px / 1.75 / 400'], ['Label / Caption', '12px / 1.5 / 650 · 13px / 1.6'], ['본문 폭', '최대 68ch · 한글 실제 행 길이는 화면에서 검토']],
    '영문 제목은 Anton, 긴 설명과 조작 라벨은 Wanted Sans로 역할을 나눕니다.', 'Anton을 긴 본문에 쓰거나 한글이 지원되는 디스플레이 서체라고 설명하지 않습니다.',
    '<h1 class="brand-title">SPACE<br><span lang="ko">공간을 만드는 기준</span></h1>', '.brand-title { font-family: Anton, "Wanted Sans", sans-serif; font-size: clamp(40px,5vw,72px); line-height: 1.05; }\n.brand-title span { font-family: "Wanted Sans", sans-serif; font-weight: 700; }',
    ['Wanted Sans 공식 배포본을 내장합니다. SIL Open Font License 1.1 전문과 출처는 저장소 LICENSE-Wanted-Sans.txt에 보관합니다.', '굵기는 font-weight로 지정합니다. SUIT 전용 font-variation-settings를 Wanted Sans에 강제로 상속하지 않습니다.']),
  article('spacing', 'Foundations', 'Spacing', '4px 단위에서 시작하는 여백.',
    '관련된 항목은 가깝게, 다른 주제는 충분히 떨어뜨립니다. 아래 값은 가이드 영역의 draft이며, 기존 사이트 좌우 여백 --pad는 유지합니다.', 'spacing',
    [['Base', '4px'], ['Scale', '4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96px'], ['Control gap', '8px'], ['Card padding', '24px · 좁은 화면 16px'], ['Section gap', '64px · 좁은 화면 48px']],
    '라벨과 필드는 8px, 카드 사이 24px, 주제 사이 64px로 정보 관계를 드러냅니다.', '같은 위계의 카드마다 19px, 27px처럼 임의의 값을 쓰지 않습니다.',
    '<div class="stack"><label for="name">프로젝트명</label><input id="name"></div>', '.stack { display: grid; gap: 8px; }\n.section { margin-block: 64px; }'),
  article('grid', 'Foundations', 'Grid', '공유하는 정렬선, 매체에 맞는 비례.',
    '웹은 넓이에 따라 12·8·4열을 사용합니다. 가이드 자체는 문서 탐색을 위한 사이드바·본문·목차의 3영역으로 구성합니다. 도면의 물리 단위와 웹 px를 혼용하지 않습니다.', 'grid',
    [['Wide ≥1200px', '12 columns · gap 24px'], ['Medium 768–1199px', '8 columns · gap 24px'], ['Small <768px', '4 columns · gap 16px'], ['Outer margin', 'var(--pad) = clamp(16px, 3.2vw, 44px)'], ['Documentation', '244px sidebar · flexible article · 160px TOC (≥1280px)']],
    '사진·제목·캡션의 왼쪽 기준선을 맞춥니다. 좁아지면 문서를 한 열로 읽게 합니다.', '고정 폭 캔버스를 모바일에서 축소하거나 본문을 가로 스크롤하게 하지 않습니다.',
    '<div class="brand-grid"><article>프로젝트 정보</article></div>', '.brand-grid { display: grid; grid-template-columns: repeat(12,minmax(0,1fr)); gap: 24px; }\n@media (max-width:1199px) { .brand-grid { grid-template-columns:repeat(8,minmax(0,1fr)); } }\n@media (max-width:767px) { .brand-grid { grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; } }'),
  article('curvature', 'Foundations', 'Shape & curvature', '둥근 표면, 정확한 콘텐츠.',
    'UI 표면에는 부드러운 모서리를 적용합니다. border-radius만으로 수학적인 연속 곡률이 구현되지는 않습니다. 지원 브라우저의 corner-shape: squircle은 점진적 개선이며 기본 fallback은 원호입니다.', 'curvature',
    [['Input / Card / Panel', '12px / 24px / 32px'], ['Pill', '999px'], ['Nested radius', '외곽 24px − inset 8px = 안쪽 16px'], ['Progressive enhancement', '@supports (corner-shape: squircle)'], ['기술 콘텐츠', '도면·표는 0px, 치수·주기 crop 금지']],
    '카드 표면과 조작 컨트롤에 라운딩을 적용합니다. 도면은 전체를 표시합니다.', '모든 이미지와 도면을 pill 형태로 자르거나 원호를 연속 곡률과 같다고 단정하지 않습니다.',
    '<article class="surface">정확한 콘텐츠를 담는 표면</article>', '.surface { border-radius:24px; padding:24px; }\n@supports (corner-shape:squircle) { .surface { corner-shape:squircle; } }'),
  article('glass', 'Materials', 'Translucency', '겹침을 알려주는 가벼운 재질.',
    '반투명은 고정 내비게이션이나 떠 있는 패널에서 배경의 맥락을 남기는 수단입니다. Liquid Glass의 광학 효과를 복제하지 않습니다. 본문·도면·출력물은 불투명 표면을 사용합니다.', 'glass',
    [['Surface', 'rgba(255,255,255,.88)'], ['Blur / Saturation', '20px / 120%'], ['Border', '1px solid rgba(0,0,0,.12)'], ['Shadow', '0 8px 32px rgba(0,0,0,.06)'], ['Fallback', '불투명 #FFFFFF · 미지원 / reduced-transparency / 인쇄']],
    '한 화면에 한 단계의 재질을 사용하고, 움직이는 배경 위에서도 텍스트 대비를 확인합니다.', '반투명 패널을 여러 겹 쌓거나 본문 자체의 opacity를 낮추지 않습니다.',
    '<nav class="glass" aria-label="프로젝트">프로젝트 · 정보</nav>', '.glass { background:#fff; border:1px solid #0000001f; }\n@supports (backdrop-filter:blur(20px)) { .glass { background:rgb(255 255 255 / .88); backdrop-filter:blur(20px) saturate(120%); } }\n@media (prefers-reduced-transparency:reduce), print { .glass { background:#fff; backdrop-filter:none; } }'),
  article('buttons', 'Components', 'Buttons', '행동은 분명하게, 형태는 간결하게.',
    '한 작업 영역의 가장 중요한 행동 하나를 primary로 표시합니다. 페이지 이동에는 링크, 상태 변경에는 button을 사용합니다. 아래 컨트롤로 형태·크기·상태를 직접 비교할 수 있습니다.', 'buttons',
    [['Height', 'Default 44px · Large 48px'], ['Padding / Radius', '좌우 20px / 999px'], ['Text', 'Wanted Sans 14px / 650'], ['States', 'Default · Hover · Pressed · Focus · Disabled · Loading'], ['Focus / Motion', '2px #000 outline + 3px offset / 150ms']],
    '“검토 요청”처럼 결과를 알 수 있는 동사를 씁니다. 로딩에는 작업 중 라벨과 aria-busy를 제공합니다.', '“확인”만 반복하거나 비활성 버튼의 색만 보고 이유를 추측하게 하지 않습니다.',
    '<button class="byx-button" type="button">검토 요청</button>\n<button class="byx-button" disabled>저장 중…</button>', '.byx-button { min-height:44px; padding:0 20px; border-radius:999px; background:#007f73; color:#fff; font:650 14px "Wanted Sans",sans-serif; transition:background 150ms; }\n.byx-button:hover { background:#00665d; }\n.byx-button:active { background:#00564f; }\n.byx-button:focus-visible { outline:2px solid #000; outline-offset:3px; }\n.byx-button:disabled { background:#e5e5e5; color:#595959; }'),
  article('inputs', 'Components', 'Inputs & selection', '라벨을 남기고, 오류는 바로 설명합니다.',
    '항상 보이는 라벨과 도움말을 제공합니다. placeholder는 예시일 뿐 라벨을 대신하지 않습니다. 아래 양식은 로컬 예제이며 입력 내용을 전송·저장하지 않습니다.', 'inputs',
    [['Input', 'min-height 44px · padding 12px 16px · radius 12px'], ['Border', '1px #767676 · focus outline 2px #000'], ['Text / Label gap', '16px / 8px'], ['Error', '텍스트 + aria-invalid + aria-describedby'], ['Selection', 'native checkbox / select · 클릭 영역 44px']],
    '오류 필드와 원인을 연결하고, 수정 후 다시 확인할 수 있게 합니다.', '색 테두리만 바꾸거나 입력 직후 내용을 지우지 않습니다.',
    '<label for="project-name">프로젝트명</label>\n<input id="project-name" aria-describedby="project-hint" required>\n<p id="project-hint">2자 이상 입력하세요.</p>', 'input { min-height:44px; padding:12px 16px; border:1px solid #767676; border-radius:12px; font:400 16px "Wanted Sans",sans-serif; }\ninput:focus-visible { outline:2px solid #000; outline-offset:3px; }'),
  article('cards', 'Components', 'Cards', '하나의 카드에는 하나의 주제.',
    '이미지·제목·메타데이터를 일관된 순서로 배치합니다. 전체 카드가 링크라면 내부에 또 다른 버튼을 중첩하지 않습니다. 아래 카드는 펼치기 동작으로 정보 위계를 확인합니다.', 'cards',
    [['Radius / Padding', '24px / 24px'], ['Image', '소개 사진 4:3 · 도면은 원본 비율 contain'], ['Gap', '이미지–제목 24px · 제목–메타 8px'], ['Border / Shadow', '1px #D8D8D8 · 기본 그림자 없음']],
    '구조가 같은 정보에만 같은 카드 레이아웃을 씁니다.', '카드 전체 링크 안에 버튼·링크를 중첩하거나 사진 위에 필수 정보를 겹치지 않습니다.',
    '<article class="card"><h3>Material study</h3><p>재료의 표면과 빛</p><a href="#/blog">연구 보기</a></article>', '.card { border:1px solid #d8d8d8; border-radius:24px; padding:24px; }\n.card h3 { margin:0 0 8px; }'),
  article('navigation', 'Components', 'Navigation', '지금 위치와 다음 선택을 보여줍니다.',
    '전역 메뉴는 단순하게 유지하고, 문서의 카테고리는 사이드바로 분리합니다. 현재 문서는 aria-current="page"로 표시합니다. 접히는 메뉴는 실제 button으로 열고 닫습니다.', 'navigation',
    [['Top bar', 'min-height 64px · 선택적으로 glass'], ['Navigation target', 'min-height 44px'], ['Sidebar', '244px · <900px 접이식'], ['Search', '전체 문서 제목·설명·수치·코드 검색'], ['TOC', 'Overview / Preview / Specifications / Usage / Code']],
    '현재 위치를 색과 굵기로 함께 표시하고, 모바일에서는 선택 후 메뉴를 닫습니다.', '아이콘만으로 목적지를 추측하게 하거나 키보드 초점을 보이지 않게 만들지 않습니다.',
    '<nav aria-label="문서"><a href="#/guidelines/buttons" aria-current="page">Buttons</a></nav>', 'nav a { display:flex; align-items:center; min-height:44px; padding:8px 12px; }\nnav a[aria-current="page"] { background:#e8f3f0; color:#00665d; font-weight:650; }'),
  article('modals', 'Components', 'Modals', '필요한 결정에만 집중합니다.',
    '짧고 집중이 필요한 작업에 dialog를 씁니다. 긴 설명과 일반 탐색은 페이지에서 제공합니다. 네이티브 dialog.showModal()로 배경 상호작용과 포커스 범위를 제어합니다.', 'modals',
    [['Width', 'min(480px, viewport − 32px)'], ['Panel / Padding', 'radius 32px / 32px'], ['Backdrop', 'rgba(0,0,0,.25)'], ['Keyboard', 'Escape 닫기 · Tab 내부 순환 · 닫힌 뒤 트리거 복귀'], ['Actions', '취소 / 명확한 주 행동 · 파괴 작업 자동 실행 금지']],
    '제목을 aria-labelledby로 연결하고 닫은 뒤 열기 버튼에 초점을 돌려줍니다.', '배경을 클릭할 수 있게 남기거나 Escape를 막지 않습니다.',
    '<button id="open-example">예제 열기</button>\n<dialog id="example" aria-labelledby="dialog-title"><h2 id="dialog-title">검토 요청</h2><form method="dialog"><button>닫기</button></form></dialog>', 'dialog { width:min(480px,calc(100% - 32px)); padding:32px; border:1px solid #d8d8d8; border-radius:32px; }\ndialog::backdrop { background:rgb(0 0 0 / .25); }',
    ['JavaScript: openButton.onclick = () => dialog.showModal(); dialog.addEventListener("close", () => openButton.focus());']),
  article('feedback', 'Components', 'Feedback & motion', '작업 결과는 읽을 수 있게 남깁니다.',
    '상태 변화는 짧고 절제합니다. 성공 알림은 role="status", 즉시 수정이 필요한 오류는 role="alert"로 알립니다. reduced motion에서는 이동·회전·전환을 제거합니다.', 'feedback',
    [['Transition', '150ms · cubic-bezier(.22,.61,.36,1)'], ['Feedback', '문서 흐름 안에 유지 · 예제 저장은 실제 전송 없음'], ['Reduced motion', 'animation:none · transition:none · smooth scroll 해제'], ['Loading', '정적인 “처리 중…” 라벨도 항상 제공']],
    '실제 완료된 작업만 성공으로 알리고 상태 문장을 화면에 남깁니다.', '상태 메시지를 너무 빨리 없애거나 무한 회전만으로 진행 상태를 전달하지 않습니다.',
    '<p role="status" aria-live="polite">검토 목록에 추가되었습니다.</p>', '@media (prefers-reduced-motion:reduce) { .byx-ui *, .byx-ui *::before, .byx-ui *::after { animation:none !important; transition:none !important; scroll-behavior:auto !important; } }'),
  article('web', 'Applications', 'Website', '프로젝트를 먼저 보여주는 화면.',
    '큰 이미지와 명료한 제목, 일관된 여백으로 구성합니다. 기존 공개 사이트의 작품 중심 구조와 Anton을 유지하면서 새 UI를 점진적으로 이관합니다.', 'web',
    [['Grid', '12 / 8 / 4열'], ['Body / Target', '16px / 최소 44px 조작 영역'], ['Photography', '원본 컬러 보존 · 흑백 표현은 별도 검토'], ['Surface', '카드 24px · glass는 고정 메뉴에 한정']],
    '작품 정보와 실제 사진의 정확성을 검토하고 반응형 이미지 크기를 지정합니다.', '본문·프로젝트 사진에 X 장식을 덧씌우거나 모든 화면을 카드로 채우지 않습니다.',
    '<figure><img src="project.webp" alt="중정에서 바라본 외벽과 보행 동선" width="1600" height="1200"><figcaption>Project · Seoul · 2026</figcaption></figure>', 'figure { margin:0; }\nfigure img { width:100%; height:auto; }\nfigcaption { margin-top:12px; font-size:13px; }'),
  article('ppt', 'Applications', 'Presentation', '한 장에 하나의 판단.',
    '표지·섹션·이미지·비교·데이터 슬라이드의 정렬선을 공유합니다. 아래는 웹 미리보기이며 PPTX 템플릿 파일은 아직 제작되지 않았습니다.', 'ppt',
    [['Canvas', '16:9 · 33.867 × 19.05cm'], ['Margin / Grid', '좌우 1.5cm · 12열 · gutter 0.5cm'], ['Title / Body / Caption', '32–44pt / 20–24pt / 12–14pt'], ['Colors', '흑백 중심 · 청록 강조 1곳'], ['Effects', '반투명 최소 · 사진은 원본 · X 사용 안 함']],
    '프레젠테이션은 멀리서 읽도록 작성하고 폰트 포함·대체 여부를 PDF로 확인합니다.', '웹의 16px를 PPT의 16pt와 같은 읽기 크기로 간주하지 않습니다.',
    '<section class="slide"><h2>공간을 잇는 중정</h2><p>한 장에 하나의 핵심 메시지.</p></section>', '.slide { aspect-ratio:16/9; padding:4.43%; background:#fff; color:#000; }'),
  article('documents', 'Applications', 'Documents', '읽기와 검토에 집중하는 문서.',
    '보고서·설계설명서·공문은 명확한 제목 위계와 페이지 정보를 공유합니다. 최종 납품 형식과 발주처 양식이 있으면 이를 우선합니다.', 'documents',
    [['Page', 'A4 210 × 297mm · portrait'], ['Margin', '상하 20mm · 좌우 20mm'], ['Title / Body / Caption', '24pt / 10.5–11pt / 9pt 이상'], ['Body', '행간 1.6 · 문단 뒤 6pt'], ['Header / Footer', '프로젝트명 / 문서번호 / 개정 / 페이지 x/y']],
    '인쇄물은 흰 바탕·검정 텍스트로 구성하고 본문과 표에 반투명을 쓰지 않습니다.', '기술 정보가 든 표를 둥글게 자르거나 문서번호 없이 파일명만으로 버전을 구분하지 않습니다.',
    '<article class="report"><header>BYX · Design report</header><h1>설계 설명서</h1><p>프로젝트 조건과 설계 의도.</p></article>', '@media print { @page { size:A4; margin:20mm; }\n  .report { color:#000; background:#fff; font-size:11pt; line-height:1.6; } }'),
  article('instagram', 'Applications', 'Instagram', '같은 정보 위계로 이어지는 피드.',
    '이미지·프로세스·리서치를 구분하되 서체와 메타데이터 위치를 공유합니다. 다음은 BYX 제작용 캔버스 제안이며 플랫폼의 고정 업로드 제한을 의미하지 않습니다.', 'instagram',
    [['Feed canvas', '1080 × 1350px · 4:5'], ['Alternative', '1080 × 1080px · 1:1'], ['Story / Reel', '1080 × 1920px · 9:16'], ['Margin / Typography', '64px / 제목 64–88px · 본문 36–44px'], ['Safe area', '영상 핵심 정보는 상하 250px 이격부터 검토 · 앱 미리보기 필수']],
    '첫 장에 주제를 제시하고 마지막 장까지 캡션·크레딧 위치를 통일합니다.', '서로 다른 화면비를 강제 crop하거나 앱 UI와 겹치는 위치에 필수 텍스트를 두지 않습니다.',
    '<article class="feed"><h2>Material notes</h2><p>Concrete · 01</p></article>', '.feed { aspect-ratio:4/5; padding:5.93%; display:flex; flex-direction:column; justify-content:space-between; }',
    ['실제 업로드 전 최신 앱의 crop·프로필·자막·컨트롤 중첩을 확인합니다. 웹 시안은 안전 영역을 보장하지 않습니다.']),
  article('youtube', 'Applications', 'YouTube', '제목과 공간이 함께 읽히는 영상.',
    '썸네일·타이틀·자막의 위계를 공유합니다. 사진과 영상의 질감이 중심이며 영상마다 X 오프닝을 반복하지 않습니다. 아래 값은 BYX 제작 초안입니다.', 'youtube',
    [['Video master', '1920 × 1080px · 16:9'], ['Thumbnail canvas', '1280 × 720px · 16:9'], ['Safe area', '1920px master에서 가장자리 96px 이격부터 검토'], ['Subtitle', '1080p 기준 44–52px · 최대 2줄'], ['Thumbnail title', '1280px 기준 64–96px · 모바일 크기로 확인']],
    '자막은 불투명 또는 충분한 대비의 판 위에 표시하고 영상·음원·사진 크레딧을 남깁니다.', '최신 플랫폼 규격을 확인하지 않고 시안 수치를 업로드 제한으로 단정하지 않습니다.',
    '<div class="video-frame"><p class="subtitle">공간의 깊이를 만드는 빛</p></div>', '.video-frame { aspect-ratio:16/9; position:relative; }\n.subtitle { position:absolute; inset:auto 5% 8%; background:#000; color:#fff; padding:8px 16px; text-align:center; }'),
  article('drawings', 'Architecture', 'Drawings', '기술 정보가 우선인 도면.',
    '브랜드 규칙은 표제란·서체·정보 정렬에 적용합니다. 치수·축선·레벨·기호의 의미를 시각적 통일 때문에 바꾸지 않습니다. 이 페이지는 BYX 그래픽 초안으로 법정 작성·납품 기준이 아닙니다.', 'drawings',
    [['Units', 'model mm · paper mm · 웹 preview px는 축척 없음'], ['Line weights', '0.13 / 0.18 / 0.25 / 0.35 / 0.50mm · 시험 출력 후 검토'], ['Text on paper', '일반 주기 2.5mm · 소제목 3.5mm · 시트명 5mm'], ['Scale', '예: 1:100 / A3 · 숫자 축척 + scale bar 병기'], ['Geometry', '도면 모서리 0 · blur/투명도 사용 안 함']],
    '출력 용지와 축척을 함께 쓰고 PDF에서 선굵기·치수 누락을 확인합니다.', 'A1을 A3로 축소한 뒤 1:100 표기를 그대로 두거나 그림만 보고 축척을 추정하지 않습니다.',
    '<figure class="drawing"><svg viewBox="0 0 600 300" role="img" aria-label="축척 없는 평면 개념도"><rect x="60" y="50" width="480" height="200" fill="none" stroke="black" stroke-width="3"/></svg><figcaption>SCHEMATIC · NOT TO SCALE</figcaption></figure>', '.drawing { border-radius:0; background:#fff; color:#000; }\n.drawing svg { width:100%; height:auto; }',
    ['DWG/RVT 표준 템플릿은 미제공입니다. 실제 납품 전 프로젝트 책임자가 계약·발주처·적용 기준과 최신 요구사항을 별도 확인합니다.']),
  article('titleblock', 'Architecture', 'Title block', '시트의 출처와 개정을 명확히.',
    '표제란은 브랜딩 장식보다 추적 가능한 정보가 우선입니다. 프로젝트·시트·개정·검토 책임을 같은 순서로 배치합니다. 웹 예시는 실제 도면 양식의 대체물이 아닙니다.', 'titleblock',
    [['Layout', 'A3 landscape 420 × 297mm · 우측 strip 55mm 제안'], ['Required fields', '프로젝트명/번호 · 도면명/번호 · 날짜 · 개정 · 작성/검토/승인'], ['Scale field', '축척 + 기준 용지 · NTS일 경우 명시'], ['Text / Border', '인쇄 2.5mm 이상 · 0.18/0.35mm 선'], ['Revision', '개정번호 / 일자 / 변경 내용 / 승인자']],
    '도면번호와 개정번호를 분리하고 실제 확인된 작성·검토자를 기입합니다.', '승인되지 않은 시트를 “승인”으로 표시하거나 예제의 가상 이름을 실제 책임자로 사용하지 않습니다.',
    '<table><caption>표제란 필수 정보</caption><tr><th scope="row">Drawing no.</th><td>A-101</td></tr><tr><th scope="row">Revision</th><td>P01 · 검토용</td></tr></table>', 'table { border-collapse:collapse; }\nth,td { border:1px solid #000; padding:8px; text-align:left; }'),
  article('specbook', 'Architecture', 'Spec book', '재료와 적용 위치를 연결합니다.',
    '선정용 스펙북은 자재의 이미지·성능 근거·적용 위치를 비교하는 문서입니다. 계약상 시공·검사 기준을 정하는 공사시방서와 구분합니다. 예제 자재는 가상이며 성능이 검증된 제품이 아닙니다.', 'specbook',
    [['Page / Grid', 'A4 portrait · margin 20mm · 2열 · gap 8mm'], ['Identity', '고유 ID / 분류 / 제조사 / 모델 / 규격 / 마감'], ['Traceability', '적용 위치 / 도면·상세번호 / 근거 파일·일자'], ['Status', '검토 중 / 승인 / 변경 / 제외 · 승인 주체 기록'], ['Revision', '개정번호 / 변경일 / 변경 사유']],
    '제품 이미지와 요구 성능의 출처를 연결하고 선택 상태를 문장으로 표기합니다.', '이미지 인상만으로 제품을 승인하거나 인증·시험성적서 확인 없이 성능을 확정하지 않습니다.',
    '<article class="material"><h3>F-01 · 바닥 마감</h3><dl><dt>상태</dt><dd>검토 중</dd><dt>적용</dt><dd>1F 공용부 / A-201</dd></dl></article>', '.material { display:grid; gap:12px; border:1px solid #d8d8d8; padding:24px; }\n@media print { .material { border-radius:0; break-inside:avoid; } }'),
  article('specifications', 'Architecture', 'Specifications', '시공·검사 기준을 분명히.',
    '사양서는 제품의 요구 조건, 공사시방서는 시공·검사·인수 조건을 구체화합니다. 브랜드 가이드는 정보 배열만 제안하며 실제 기술 조건이나 법규 적합성을 대신 정하지 않습니다.', 'specifications',
    [['Structure', '문서번호 / 적용 범위 / 관련 도서 / 재료 / 시공 / 검사 / 제출물'], ['Requirements', '항목 / 요구값·단위 / 근거·버전 / 확인 방법 / 담당'], ['Typography', '본문 11pt · 표 9pt 이상 · 흑백'], ['References', '표준명과 판·연도 / 근거 파일 / 검토일'], ['Approval', '작성 / 기술 검토 / 승인 · 미결정 항목 명시']],
    '시험 방법·허용 오차·판정 책임을 작성하고 프로젝트 책임자의 기술 검토를 받습니다.', '“관련 기준에 따름”만 쓰거나 디자인 초안을 법정 표준으로 표시하지 않습니다.',
    '<table><caption>요구 성능 검토표</caption><tr><th scope="col">항목</th><th scope="col">요구값</th><th scope="col">근거</th></tr><tr><td>바닥 마감</td><td>미확정 · 기술 검토 필요</td><td>참조 문서 기입 예정</td></tr></table>', 'table { width:100%; border-collapse:collapse; }\ntr { break-inside:avoid; }\nthead { display:table-header-group; }'),
  article('schedules', 'Architecture', 'Tables & schedules', '비교와 추적을 위한 표.',
    '창호·마감·면적·자재표는 고유 ID와 단위를 명확히 합니다. 값은 수치로, 미확정 상태는 텍스트로 구별합니다. 인쇄 시 헤더를 반복하고 셀 내용을 잘라내지 않습니다.', 'schedules',
    [['Text / Padding', '인쇄 9pt 이상 · 셀 상하 2mm / 좌우 3mm'], ['Alignment', '텍스트 좌측 · 수치 우측 · 소수점 자리 통일'], ['Units', '열 머리글에 명시 · mm / m² 등'], ['Lines', '외곽 0.25mm / 내부 0.13mm · 시험 출력 필요'], ['Continuation', '다음 페이지에 표명·헤더·연속 번호 반복']],
    '열 머리글에 단위를 적고 미정·해당 없음·0을 구별합니다.', '셀 병합과 색상만으로 분류하거나 필수 텍스트를 말줄임표로 출력하지 않습니다.',
    '<table><caption>마감 목록 · 가상 예제</caption><thead><tr><th scope="col">ID</th><th scope="col">두께 (mm)</th><th scope="col">상태</th></tr></thead><tbody><tr><th scope="row">F-01</th><td>미정</td><td>검토 중</td></tr></tbody></table>', 'td.numeric { text-align:right; font-variant-numeric:tabular-nums; }\n@media print { thead { display:table-header-group; } tr { break-inside:avoid; } }'),
  article('output', 'Architecture', 'Print & export', '최종 출력물에서 다시 확인합니다.',
    '화면상의 선명함이 출력 품질을 보장하지 않습니다. PDF 저장 후 실제 용지에서 확인하고, 납품처 요구 형식을 우선합니다. 아래는 제작 제안이며 인증·법정 납품 규격이 아닙니다.', 'output',
    [['Paper', 'A4 210×297 / A3 297×420 / A1 594×841mm'], ['Raster', '최종 출력 크기 기준 사진 300ppi 목표'], ['PDF', '텍스트·선은 벡터 유지 · 서체 포함·대체 확인'], ['Scale', '실제 크기 100% 출력 · fit-to-page 여부 확인'], ['File naming', 'BYX_Project_DocNo_Rev_YYYYMMDD.pdf']],
    '페이지 크기·축척·선굵기·회색 명도·폰트·누락·파일명을 확인하고 교차 검토합니다.', '화면 스크린샷을 최종 도면 PDF로 쓰거나 RGB 값을 인쇄 잉크 값과 같다고 보지 않습니다.',
    '<footer>BYX · Project · A-101 · P01 · 2026.11.03 · 1/12</footer>', '@media print { @page { size:A3 landscape; margin:10mm; }\n  * { box-shadow:none !important; backdrop-filter:none !important; } }',
    ['인쇄소와 CMYK/ICC·PDF/X 요구사항을 협의합니다. RGB 청록을 임의 CMYK 수치로 확정하지 않습니다.', '도련·재단선은 제본·인쇄 방식에 따라 별도 지정합니다. 화면 미리보기는 실제 축척이 아닙니다.']),
  article('about', 'Governance', 'About BYX', '브랜드의 의미는 소개의 맥락에서.',
    'BY X의 열린 의미는 브랜드 소개에서 설명합니다. X는 반복 장식이나 UI 기호 시스템으로 확장하지 않습니다. 저장소에 있는 기존 로고·슬롯머신은 별도 브랜드 자산으로 유지합니다.', 'about',
    [['Display face', '기존 Anton 유지'], ['Body direction', 'Wanted Sans · 가이드 적용 / 공개 사이트 이관 별도'], ['Motif', 'X의 의미는 About에서만 소개'], ['Source of truth', '이 가이드의 draft 토큰 → 검토 → 버전 승인 → 매체별 이관']],
    '실제 프로젝트와 제작자의 역할을 정확하게 설명합니다.', '모든 버튼을 X 형태로 만들거나 미확정 로고 변형을 공식 자산으로 배포하지 않습니다.',
    '<section aria-labelledby="about-title"><h2 id="about-title">Architecture by X</h2><p>프로젝트의 조건과 가능성을 함께 탐구합니다.</p></section>', 'section { color:#000; background:#fff; }'),
  article('access', 'Governance', 'Access & releases', '열람 권한과 기준의 승인을 분리합니다.',
    '기존 Supabase 계정으로 로그인한 뒤 서버가 현재 사용자와 app_metadata.byx_guidelines_role을 검증합니다. 로그인만으로 열람을 허용하지 않습니다. 콘텐츠 수정·승인은 현재 GitHub 검토 절차에서 관리합니다.', 'access',
    [['Viewer', '승인된 내부 계정 · 읽기와 코드/토큰 복사'], ['Editor', '열람 가능 · 변경 제안은 별도 GitHub 권한 필요'], ['Admin', '열람 가능 · 계정 역할 부여와 최종 승인은 별도 관리자 절차'], ['Denied', '익명 / 미승인 / anonymous user / 설정 실패 시 차단'], ['Cache', 'private, no-store · 60초 재검증 · 로그아웃 시 메모리 제거']],
    '관리자가 승인한 app_metadata 역할을 사용하고 사용자별 철회·접근 테스트를 수행합니다.', 'URL 비공개·robots·user_metadata·localStorage 플래그를 권한 검증으로 사용하지 않습니다.',
    '<a href="/guidelines">내부 가이드 로그인</a>', '/* 문서 데이터는 인증 후 GET /api/guidelines 로만 전달합니다.\n   UI를 숨기는 CSS는 접근 보호가 아닙니다. */',
    ['중요: 이 GitHub 저장소는 공개입니다. 이 문서의 일반 디자인 규칙 소스는 공개될 수 있습니다. 프로젝트 기밀·계약서·비공개 DWG/PDF를 커밋하지 않습니다.', '실제 비공개 원본은 비공개 저장소 또는 RLS/private Storage로 옮기고 서버 권한 검증을 유지해야 합니다. 이 초안에는 다운로드 템플릿 파일을 포함하지 않습니다.', '버전 승인 시 토큰·웹 예제·PPT·DOCX·도면 템플릿을 함께 개정합니다. 기존 파일은 자동으로 바뀌지 않습니다.'])
];

const keywords = {
  overview:'시작 개요 원칙 가이드', colors:'컬러 색상 팔레트 대비', typography:'서체 폰트 타이포 한글',
  spacing:'간격 여백 스페이싱', grid:'그리드 열 정렬', curvature:'연속 곡률 모서리 라운드 둥근 커팅',
  glass:'재질 반투명 블러 유리', buttons:'버튼 클릭 상태 로딩', inputs:'입력 폼 선택 체크박스 오류',
  cards:'카드 사진', navigation:'내비게이션 메뉴 탐색 목차', modals:'모달 대화상자 팝업 포커스',
  feedback:'알림 피드백 모션 동작 감소 애니메이션', web:'웹 웹사이트', ppt:'피피티 발표 슬라이드 프레젠테이션',
  documents:'문서 보고서 공문', instagram:'인스타그램 인스타 피드 스토리 릴스', youtube:'유튜브 영상 썸네일 자막',
  drawings:'도면 평면 축척 선굵기', titleblock:'표제란 도곽 개정', specbook:'스펙북 자재 재료',
  specifications:'사양서 시방서 공사시방서', schedules:'표 일람표 스케줄', output:'출력 규격 인쇄 PDF 용지',
  about:'소개 브랜드 로고', access:'권한 접근 비공개 승인 버전 개정'
};
articles.forEach(a => { a.keywords = keywords[a.id] || ''; });

async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const reply = (status, error) => res.status(status).json({ error });
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return reply(405, '허용되지 않은 요청입니다.'); }
  const authorization = req.headers.authorization || '';
  if (!/^Bearer [A-Za-z0-9._-]+$/.test(authorization) || authorization.length > 8192) return reply(401, '로그인이 필요합니다.');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  // Fail closed; the frontend demo login is never a handbook credential.
  if (!url || !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url) || !key) return reply(503, '내부 가이드 접근 설정이 필요합니다. 관리자에게 문의하세요.');
  try {
    const auth = await fetch(`${url.replace(/\/$/, '')}/auth/v1/user`, {
      headers: { apikey: key, Authorization: authorization },
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000)
    });
    if (auth.status === 401 || auth.status === 403) return reply(401, '로그인이 만료되었습니다. 다시 로그인하세요.');
    if (!auth.ok) return reply(503, '권한을 확인할 수 없습니다. 잠시 후 다시 시도하세요.');
    const user = await auth.json();
    const role = user.app_metadata?.byx_guidelines_role;
    if (!user.id || !user.email_confirmed_at || user.is_anonymous === true || !['viewer', 'editor', 'admin'].includes(role)) return reply(403, '내부 가이드 열람 승인이 필요합니다. 관리자에게 문의하세요.');
    return res.status(200).json({ role, tokens, articles });
  } catch {
    return reply(503, '권한을 확인할 수 없습니다. 잠시 후 다시 시도하세요.');
  }
}
module.exports = handler;
