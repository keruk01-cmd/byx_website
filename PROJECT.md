# BYX 웹사이트 — 인수인계 문서

> BYX 건축사사무소 포트폴리오 웹사이트.
> 이 문서 하나만 읽으면 다른 사람(또는 다른 AI)이 이어서 작업할 수 있도록 쓴 것입니다.
> 최종 갱신 2026-08-18 / 버전 v9

---

## 0. 30초 요약

| | |
|---|---|
| 무엇 | 서울 기반 건축사사무소의 포트폴리오 사이트 + 자체 CMS |
| 기술 | 의존성 없는 순수 HTML/CSS/JS **단일 파일** + Supabase (BaaS) |
| 파일 | `index.html` (약 516KB — 폰트 2종이 base64로 내장되어 있음), `vercel.json` |
| 빌드 | **없음.** 번들러·npm·트랜스파일 전부 없음. 파일을 열면 그게 사이트 |
| 배포 | GitHub → Vercel 자동 배포 |
| 데이터 | Supabase Postgres 3개 표 + Storage 1개 버킷 + Auth |
| 관리 | `사이트주소/admin` 으로 접속해 로그인 → 글·이미지 편집 |
| 디자인 | 순수 흑백. 1px 헤어라인. Anton(제목) + SUIT(본문) |

---

## 1. 왜 이런 구조인가 — 가장 중요한 제약

**클라이언트는 건축가이고, 개발 언어에 능숙하지 않습니다.**
이 한 문장이 지금까지의 거의 모든 기술 결정을 만들었습니다.

그래서 다음을 지켜주세요. 이걸 깨면 클라이언트가 사이트를 유지할 수 없게 됩니다.

1. **빌드 단계를 도입하지 마세요.** npm install, 번들러, 프레임워크 전부 금지.
   지금은 GitHub 웹 편집기에서 파일을 고치고 커밋하면 30초 뒤 반영됩니다.
   빌드가 생기는 순간 클라이언트는 아무것도 못 고칩니다.
2. **파일을 쪼개지 마세요.** 단일 파일이라 드래그 한 번으로 어디든 올라갑니다.
   유일한 예외가 `vercel.json` 이고, 그건 6줄짜리 라우팅 설정입니다.
3. **런타임 의존성을 늘리지 마세요.** 지금 외부에서 불러오는 건 supabase-js 하나뿐입니다.
   폰트조차 CDN이 아니라 파일에 내장되어 있습니다.
4. **설정은 파일 맨 위 `window.BYX_CONFIG` 한 곳에만.** 17~21번째 줄.
   62KB짜리 폰트 base64 뒤에 숨어 있으면 클라이언트가 못 찾습니다.

이 제약을 지키는 한, 나머지는 자유롭게 바꿔도 됩니다.

---

## 2. 파일 구조

```
byx-website/
├── index.html      # 사이트 전체 (1,656줄)
├── vercel.json     # /admin 경로 rewrite (6줄)
├── PROJECT.md      # 이 문서
├── CLAUDE.md       # Claude Code 작업 규칙
└── 배포-가이드.md    # 클라이언트용 배포·운영 매뉴얼 (비개발자 대상)
```

### index.html 내부 지도

| 줄 | 내용 |
|---|---|
| 1~25 | `<head>`, **`window.BYX_CONFIG`** (Supabase 설정) |
| 26~30 | `@font-face` 2개 — Anton, SUIT Variable (base64, 약 460KB) |
| 31~70 | CSS 변수 (`:root`), 리셋 |
| 71~160 | 헤더 / 슬롯머신 / 네비 / 모바일 메뉴 CSS |
| 161~318 | 페이지 셸, 타이포 스케일, PROJECT 그리드·인덱스 CSS |
| 319~450 | 리스트, ABOUT/CONTACT, 폼, ADMIN, 푸터 CSS |
| 451~500 | 반응형 (880px / 520px 두 구간) |
| 500~535 | `<body>` 마크업 — 헤더·모바일메뉴·`#app`·푸터 |
| 540 | `CFG` — BYX_CONFIG 읽기 |
| 543~570 | 0. 유틸 (`$`, `$$`, `esc`, `uid`, `toast`, PRNG) |
| 572~636 | 1. **절차적 흑백 아트** (`svgArt`) |
| 639~741 | 2. 시드 데이터 (데모 콘텐츠 겸 폴백) |
| 743~843 | 3. **데이터 레이어** (`DB` 객체 — Supabase / 메모리 양쪽) |
| 845~920 | 4. **슬롯머신** |
| 922~953 | 5. 해시 라우터 |
| 955~1196 | 6. 공개 페이지 뷰 함수들 |
| 1198~1605 | 7. **ADMIN** (목록·에디터·이미지 업로드·블록 에디터) |
| 1607~1630 | 8. 페이지별 이벤트 바인딩 |
| 1631~1656 | 9. 헤더 동작 + 부트 |

---

## 3. 아키텍처

### 3-1. 라우팅
해시 라우터입니다. `#/project`, `#/blog/{slug}` 형태.

```
#/                     → 프로젝트 그리드 (= 홈)
#/project/{code}       → 프로젝트 상세
#/news
#/blog  /  #/blog/{slug}
#/about
#/contact
#/admin                → 관리자
```

`parseHash()` 가 해시를 `{page, arg}` 로 파싱하고, `render()` 가 `viewXxx()` 함수의
문자열을 `#app.innerHTML` 에 넣은 뒤 `bindPage()` 로 이벤트를 붙입니다.
가상 DOM 없음. **모든 뷰는 템플릿 리터럴을 반환하는 순수 함수**입니다.

`/admin` 만 진짜 경로처럼 동작합니다. 부트 시점에 `location.pathname` 이 `/admin` 으로
끝나면 `history.replaceState` 로 `/#/admin` 으로 넘깁니다. `vercel.json` 의 rewrite가
그 경로에서 index.html을 내려주는 역할입니다.

### 3-2. 데이터 레이어 — `DB` 객체
Supabase가 있든 없든 **똑같은 API**를 제공합니다. 이게 이 코드의 핵심 설계입니다.

```js
DB.projects / DB.news / DB.posts   // 배열
DB.demo                            // sb === null 이면 true
DB.lastError                       // 왜 연결이 안 됐는지
await DB.init()                    // 부트 시 1회
await DB.refresh()                 // 3개 표 다시 읽기
await DB.save(table, row)          // upsert
await DB.remove(table, id)
await DB.upload(file)              // → 공개 URL (데모에선 data URL)
await DB.login(email, pw) / DB.logout()
```

**데모 모드**: `CFG.url`/`CFG.key` 가 비었거나 연결에 실패하면 `sb = null` 이 되고
`SEED_*` 배열을 메모리에 복사해 씁니다. 편집도 되지만 새로고침하면 초기화됩니다.
덕분에 파일을 그냥 더블클릭해도 완성된 사이트가 보이고, 기능을 전부 시험할 수 있습니다.
**이 폴백은 유지해주세요.** 클라이언트가 로컬에서 확인할 때 쓰는 유일한 수단입니다.

연결 실패 시 `DB.lastError` 에 메시지를 담고, ADMIN → SETUP 탭에서
`hintFor()` 가 "표가 아직 없습니다 → SQL 실행하세요" 같은 한국어 해결책을 붙여 보여줍니다.

### 3-3. 무한 스크롤
`PV.shown` 만큼만 카드를 그리고, `#more` 센티넬을 `IntersectionObserver` 로 감시하다가
`BATCH`(6개)씩 `insertAdjacentHTML` 로 **덧붙입니다**. 전체 재렌더가 아니라서
스크롤 위치가 튀지 않습니다. INDEX(표) 뷰는 전체를 한 번에 그립니다 — 표는 훑어보는
화면이라 끊기면 오히려 불편합니다.

---

## 4. 디자인 시스템

### 4-1. 색
**순수 흑백만.** 회색은 칠하지 않고 이미지가 스스로 만들게 합니다.

```css
--bg:    #ffffff
--fg:    #000000
--mute:  #8e8e8e   /* 보조 텍스트 */
--faint: #d8d8d8   /* 내부 구분선 */
--hair:  1px       /* 모든 경계선의 두께 */
```

구분선은 전부 1px입니다. 그리드는 `gap: 1px` + 검은 배경으로 만들어서
셀 사이에 헤어라인이 생기게 했습니다 (`.grid`, `.people`, `.numgrid` 등).

> 다크모드 토글이 있었지만 클라이언트 요청으로 삭제했습니다. `--bg`/`--fg` 만
> 뒤집으면 되도록 설계는 남아 있으니, 필요하면 `html[data-inv]` 규칙 하나로 복구 가능합니다.

### 4-2. 서체

| 역할 | 폰트 | 라이선스 | 비고 |
|---|---|---|---|
| 제목·로고·네비 | **Anton** | SIL OFL 1.1 | Compacta 계열 초압축 헤비 산세리프 |
| 본문·라벨 | **SUIT Variable** | SIL OFL 1.1 | 한글/영문. 400–700 구간만 인스턴싱 |

둘 다 **base64로 index.html에 내장**되어 있습니다. CDN 의존 없음, 오프라인 동작,
기기 간 렌더링 동일. 대신 파일이 516KB입니다. 이건 의도된 트레이드오프입니다.

**⚠️ 한글 굵기 함정**
Anton에는 한글 글리프가 없습니다. "SLIT HOUSE 착공" 같은 제목에서 한글만 SUIT로
폴백되면서 얇게 떨어져 나옵니다. 그래서 제목류 셀렉터에

```css
font-variation-settings:'wght' 680
```

를 걸어뒀습니다. 가변 폰트인 SUIT에만 적용되고 정적 폰트인 Anton은 무시하므로
한글만 정확히 굵어집니다. **새 제목 스타일을 추가하면 이 셀렉터 목록에도 추가하세요.**
(index.html에서 `font-variation-settings` 로 검색)

### 4-3. 타이포 스케일
전부 `clamp()` 유동형입니다. 미디어쿼리로 폰트 크기를 바꾸지 마세요.

```css
.h-xl  clamp(44px, 11.5vw, 168px)
.h-l   clamp(30px,  6vw,    74px)
.h-m   clamp(20px,  2.9vw,  38px)
본문    clamp(13px,  1.02vw, 15px)
라벨    10~11.5px, letter-spacing .06~.12em, 대문자
```

### 4-4. 여백
```css
--pad:    clamp(16px, 3.2vw, 44px)    /* 모든 좌우 여백의 기준 */
--head-h: clamp(74px, 10.4vw, 108px)  /* 고정 헤더 높이 */
```
좌우 패딩은 **항상 `var(--pad)`** 를 쓰세요. 숫자를 직접 넣으면 정렬이 깨집니다.

### 4-5. 톤
- 라벨·메타데이터는 **영문 대문자 + 넓은 자간**. 도면의 주기(註記) 같은 인상
- 본문은 한국어, 건조하고 단정한 문어체. 감탄사·수식어 최소
- 애니메이션은 `--ease: cubic-bezier(.22,.61,.36,1)`. 튀지 않게
- 호버는 대부분 **흑백 반전** (`background:var(--fg); color:var(--bg)`)

---

## 5. 핵심 기능 구현

### 5-1. 슬롯머신 로고 — `_______BY X`

사이트 정체성의 핵심입니다. 함부로 바꾸지 마세요.

**개념**: 사무소 이름의 앞자리를 비워뒀습니다. 로고를 누르면 그 빈칸이 슬롯머신처럼
돌면서 우리가 다룰 수 있는 디자인 영역 단어에 멈춥니다. `LANDSCAPE BY X`, `CHAIR BY X`.

**구조** (이 분리가 중요합니다):
```html
<span id="slotwrap">        <!-- 위치 기준 -->
  <span id="slot">          <!-- overflow:hidden, 회전 중 blur가 걸리는 대상 -->
    <span id="reel">…</span><!-- translateY 로 움직이는 릴 -->
  </span>
  <span id="rule"></span>   <!-- 밑줄. slot 바깥이라 절대 안 움직이고 안 흐려짐 -->
</span>
```
밑줄이 `#slot` 밖에 있는 게 핵심입니다. 안에 넣으면 릴과 같이 움직이고 blur도 먹습니다.

**단어 풀** — 저장공간을 거의 안 씁니다.
- 착지 단어: `LANDING` 배열 (실제 의미 있는 디자인 영역 어휘 약 150개)
- 회전 중 스쳐가는 단어: `PRE`(30) + `ROOT`(60) + `SUF`(30) 조각을 `makeWord()` 가
  즉석 조합 → 수만 가지. 어차피 블러 처리되어 안 읽힙니다.

**애니메이션** — 42칸 릴, 2,700ms, WAAPI 4키프레임:
| 구간 | 이징 | 효과 |
|---|---|---|
| 0 → 34% | `cubic-bezier(.42,0,.72,.42)` | 가속, 거의 등속 |
| 34% → 93% | `cubic-bezier(.08,.55,.22,1)` | 감속 |
| 93% → 100% | 살짝 오버슛 후 복귀 | 물리적인 정지감 |

블러는 CSS 클래스 `.sp1`(1.6px) → `.sp2`(0.7px) → `.sp3`(0) 으로 3단 감쇠.

**함정**: `fill:'forwards'` 애니메이션은 끝나도 인라인 transform을 계속 덮어씁니다.
`onfinish` 에서 반드시 `setStatic()` **후에** `anim.cancel()` 을 호출해야 합니다.
순서를 바꾸면 로고가 사라집니다. (실제로 겪은 버그)

**긴 단어**: `fitItems()` 가 슬롯 너비를 넘는 단어에 `scaleX()` 를 걸어 줄입니다.
덕분에 단어 길이와 무관하게 `BY X` 위치가 절대 안 흔들립니다.

### 5-2. 절차적 흑백 아트 — `svgArt(seed)`

사진이 없는 항목의 자리를 채웁니다. 프로젝트 코드를 씨앗으로 SVG를 그립니다.
같은 코드 → 항상 같은 그림. 6가지 변형: 직교 평면 / 해칭 / 동심원 / 지층 / 매스 / 도트매트릭스.

`mulberry32` PRNG + FNV-1a 해시로 결정론적입니다. `Math.random()` 을 쓰면 안 됩니다.

`artOf(record)` 가 `record.img` 가 있으면 그걸, 없으면 생성 아트를 돌려줍니다.
**실사진을 올리면 자동으로 대체됩니다.** 회색 박스가 절대 안 보이게 하려는 장치입니다.

### 5-3. 프로젝트 2뷰

| 뷰 | 성격 | 구현 |
|---|---|---|
| GRID | 보여주기 위한 화면 | `.grid` 카드, 썸네일 기본 `grayscale(1)` → 호버 시 컬러 |
| INDEX | 확인하기 위한 화면 | `table.idx`, 열 제목 클릭 정렬, 행 클릭 이동 |

"표는 가장 압축된 형태의 도면"이라는 게 이 사무소의 관점입니다. INDEX는 부록이 아니라
본편으로 취급합니다. 유형 필터는 있었지만 클라이언트 요청으로 삭제했습니다.

### 5-4. ADMIN

`#/admin` (또는 `/admin`). 사이트 어디에도 링크가 없습니다 — 주소를 아는 사람만 들어옵니다.

- 탭: PROJECT / NEWS / BLOG / SETUP
- `AD.draft` 에 편집 중인 레코드 사본을 두고, 입력할 때마다 갱신 (**재렌더 안 함** — 포커스 유지)
- 이미지 추가·블록 이동 등 구조가 바뀔 때만 `refreshAdmin()` 으로 다시 그림 (스크롤 위치 보존)
- 블로그 본문은 블록 배열: `{t:'p'|'h'|'q'|'img', v:'…', c:'캡션'}`
- 이미지: 드래그&드롭 또는 클릭 → `DB.upload()` → Supabase Storage 공개 URL
- SETUP 탭에 SQL 전문과 설정 순서가 들어 있습니다 (클라이언트가 문서를 잃어버려도 됨)

---

## 6. Supabase

### 6-1. 현재 설정 (index.html 17~21줄)
```js
window.BYX_CONFIG = {
  url: 'https://uvkcpzmjcpcdaeozvysv.supabase.co',
  key: 'sb_publishable_nD-EQ8iq0PhcOwk_AB8fXw_v0kdHBsP',
  bucket: 'media'
};
```
publishable(구 anon) 키는 **공개되어도 되는 키**입니다. RLS가 읽기만 허용합니다.
`service_role` / `secret` 키는 절대 파일에 넣지 마세요.

> Supabase가 `anon` JWT를 `sb_publishable_...` 형식으로 교체하는 중입니다.
> supabase-js는 둘 다 받습니다.

### 6-2. 스키마
```sql
projects(id uuid pk, code, name, client, type, loc, year int, status,
         area, role, img, shots jsonb, descr, sort int, created_at)
news    (id uuid pk, d, t, k, x, sort int, created_at)
posts   (id uuid pk, slug unique, d, k, t, x, body jsonb, sort int, created_at)
```
- 열 이름이 짧은 건 초기 시드 데이터 구조를 그대로 옮겼기 때문입니다
  (`d`=날짜, `t`=제목, `k`=분류, `x`=요약)
- `descr` 은 `desc` 가 SQL 예약어라서 그렇게 지었습니다
- `sort` 가 클수록 위. 정렬은 `order('sort', {ascending:false})`

### 6-3. 보안
- 3개 표 모두 RLS 켜짐. `select` 는 누구나, 그 외는 `auth.role() = 'authenticated'`
- **Authentication → Email → "Allow new users to sign up" 반드시 OFF**
  이걸 켜두면 아무나 가입해서 글을 고칠 수 있습니다. 정책의 전제가 무너집니다
- 관리자 계정은 Supabase 대시보드에서 수동 생성 (Auto Confirm User 체크)
- Storage `media` 버킷은 Public

---

## 7. 배포

```
GitHub(byx-website) --push--> Vercel --auto deploy--> https://…
```
- 빌드 설정 없음. Framework Preset `Other`, Build Command 비움
- `vercel.json` 이 `/admin` → `/index.html` rewrite (없으면 404)
- 커밋할 때마다 30초 내 자동 재배포
- 상세 절차는 `배포-가이드.md` (클라이언트용, 비개발자 기준으로 작성)

---

## 8. 의사결정 기록

시간순. **"왜 이렇게 되어 있지?"** 싶을 때 여기를 보세요.

| # | 결정 | 이유 |
|---|---|---|
| 1 | 단일 HTML 파일 | 클라이언트가 비개발자. 빌드·다중 파일은 유지보수 불가 |
| 2 | Anton으로 Compacta 대체 | Compacta는 유료. Anton이 OFL이면서 초압축 헤비로 성격이 가장 가까움 |
| 3 | 폰트 base64 내장 | PC/모바일 렌더링 일치 요구. CDN 장애·차단에도 안전 |
| 4 | 슬롯 단어 조합 생성 | "1000개 단어를 저장공간 안 쓰고" 요구 → 형태소 105개로 수만 조합 |
| 5 | 절차적 SVG 아트 | 사진 없는 상태에서도 완성된 화면. 회색 박스 금지 |
| 6 | 데모 모드 폴백 | 설정 전에도 전 기능 시험 가능. 로컬 확인 수단 |
| 7 | Supabase 채택 | GitHub 방식(Decap)은 진입장벽이 너무 높다고 판단. 즉시 반영이 필요 |
| 8 | 홈 = 프로젝트 페이지 | 히어로·마퀴·뉴스 섹션 제거. 작품이 먼저 보여야 함 |
| 9 | 밑줄을 문자에서 도형으로 | `_______` 반복은 큰 크기에서 점선처럼 끊겨 보임 → 이어진 선으로 |
| 10 | 밑줄을 릴 바깥으로 분리 | "슬롯이 움직여도 밑줄은 고정" 요구 |
| 11 | 유형 필터 삭제 | 프로젝트 18개 규모에선 불필요한 장치 |
| 12 | INQUIRY 폼 삭제 | 백엔드 없이 mailto는 어중간. 메일 주소 직접 노출이 정직 |
| 13 | 다크모드 삭제 | 흑백 사이트에서 반전은 개념적으로 중복 |
| 14 | ADMIN 링크 제거 | 주소를 아는 사람만. 푸터가 깨끗해짐 |
| 15 | 무한 스크롤 | 프로젝트가 늘어날 것을 전제. 초기 로드 경량화 |
| 16 | 썸네일 흑백→호버 컬러 | 그리드 전체의 톤 통일. 현재 생성 아트에선 효과가 안 보임(실사진 대비용) |
| 17 | 본문 폰트 SUIT | 한글 렌더링 품질. 클라이언트 지정 |
| 18 | 설정 블록을 파일 맨 위로 | GitHub 웹 편집기에서 62KB base64 뒤를 뒤지게 할 순 없음 |
| 19 | 페이지 상단 제목·설명·개수 삭제 | 메뉴에 이미 있는 정보. 콘텐츠가 바로 시작 |

### 되돌린 것들 (다시 제안하지 마세요)
- 다크모드 토글 — 삭제됨
- 프로젝트 유형 필터 칩 — 삭제됨
- CONTACT 문의 폼 — 삭제됨
- 페이지 하단 CTA 블록(SELECTED WORKS / START A PROJECT) — 삭제됨
- ABOUT의 APPROACH / SERVICES / CLIENTS 섹션 — 삭제됨
- 푸터의 STUDIO / ADDRESS / CONTACT 4열 — 삭제됨 (내용은 ABOUT·CONTACT에 있음)

---

## 9. 남은 일 / 알려진 한계

### 해야 할 일
- [ ] 실제 프로젝트 사진·텍스트 입력 (ADMIN에서)
- [ ] ABOUT의 스튜디오 소개·수상 이력·구성원, CONTACT의 주소·교통편이 **하드코딩** 상태.
      전부 제가 지어낸 더미입니다. 실제 내용으로 교체 필요.
      → 이것들도 ADMIN에서 편집 가능하게 할지는 미결정 (`settings` 표 하나 추가하면 됨)
- [ ] OG 이미지, 실제 favicon
- [ ] 도메인 연결
- [ ] 국문/영문 전환 필요 여부 결정

### 알려진 한계
- 검색엔진에 약합니다. 해시 라우팅 + 클라이언트 렌더 → 개별 프로젝트 페이지가 색인되지 않음.
  중요해지면 정적 생성이나 `<noscript>` 폴백을 검토
- 이미지 최적화 없음. Supabase Storage 원본을 그대로 씀. 큰 사진을 많이 올리면 느려짐
- 접근성 미검증. 키보드 네비게이션, 스크린리더 테스트 안 함
- Supabase 무료 플랜은 자동 백업이 제한적. 분기별 CSV 수동 백업 권장
- 프로젝트 상세 이미지는 순서 변경 UI가 없음 (삭제 후 재업로드해야 함)

---

## 10. 작업 시 주의사항

### 절대 하지 말 것
- ❌ 빌드 도구·프레임워크·npm 도입
- ❌ 파일 분리 (`vercel.json` 외)
- ❌ `service_role` / `secret` 키를 파일에 넣기
- ❌ 데모 모드 폴백 제거
- ❌ `svgArt()` 에 `Math.random()` 사용 (결정론이 깨짐)
- ❌ 색상 추가 (흑백 + `--mute` + `--faint` 가 전부)

### 조심할 것
- 뷰 함수는 **문자열을 반환**합니다. 사용자 입력은 반드시 `esc()` 로 이스케이프
- `render()` 는 `#app` 전체를 갈아끼웁니다. 이벤트는 `bindPage()` 에서 다시 붙여야 합니다
- ADMIN에서 입력 중에는 재렌더하지 마세요 (포커스·커서 위치가 날아감)
- 새 제목 스타일에는 `font-variation-settings:'wght' 680` 셀렉터 추가
- 좌우 여백은 `var(--pad)`, 경계선은 `var(--hair)`
- Supabase 열 이름을 바꾸면 `SEED_*`, 뷰 함수, ADMIN 폼 세 군데를 같이 고쳐야 합니다

### 테스트 방법
빌드가 없으므로 파일을 브라우저로 열면 끝입니다.
Playwright로 회귀 확인하는 스니펫:

```js
// 모든 라우트가 내용을 렌더하는지 + 콘솔 에러가 없는지
const { chromium } = require('playwright');
const U = 'file:///.../index.html';
const routes = ['#/','#/news','#/blog','#/about','#/contact','#/admin','#/project/BYX-2604'];
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const h of routes) {
    const p = await b.newPage();
    p.on('pageerror', e => errs.push(h + ': ' + e.message));
    await p.goto(U + h, { waitUntil:'domcontentloaded' });
    await p.waitForTimeout(1600);
    const len = await p.evaluate(() => document.querySelector('#app').innerText.length);
    if (len < 30) errs.push(h + ' empty');
    await p.close();
  }
  await b.close();
  console.log(errs.length ? errs.join('\n') : 'OK');
})();
```

확인 항목: 데스크톱(1440) / 모바일(390) 두 폭, 슬롯머신 회전·정지,
그리드 무한 스크롤, INDEX 정렬, ADMIN 저장.

---

## 11. 콘텐츠 톤 가이드

새 문구를 쓸 일이 있으면 이 톤을 따라주세요.

- **건조하고 단정하게.** 감탄사, 과장, 마케팅 문구 금지
- **결정의 근거를 쓴다.** "아름다운 공간을 만듭니다" (X) / "선을 줄이고, 남은 선을 정확히 놓는다" (O)
- 라벨은 영문 대문자, 본문은 한국어
- 블로그는 설계 과정에서 반복해 부딪히는 질문을 짧게 정리하는 성격.
  기존 6편(`Why Black and White`, `Index as Drawing`, `The Blank Line`,
  `One Millimeter`, `Drawing with Code`, `Apartment, Again`)의 어조를 참고

예시 — 사무소의 3원칙 (ABOUT에서는 삭제했지만 톤의 기준으로 남깁니다):
1. 선을 줄인다 — 필요한 선만 남기고, 남은 선에만 두께를 준다
2. 재료가 색을 만든다 — 칠하지 않는다. 노출된 표면과 조도가 만드는 회색을 신뢰한다
3. 스케일을 가리지 않는다 — 대지 8,000㎡와 손잡이 40mm는 같은 방법으로 다뤄진다
