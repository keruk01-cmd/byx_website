# 03 — Application Standards
**Status:** DRAFT 0.2.0. Measurements are initial template defaults, not final approved masters.

## Shared identity footer / document metadata
Use official name ARCHITECTS BYX and, where required, 바이엑스건축사사무소. Recommended metadata slots:
- Project title and code
- Document / drawing title
- Issue date and revision
- Responsible architect / author where appropriate
- Page / sheet / slide number
- Document status (Draft, For Review, Final) if relevant
- Scale, unit, and source where technical material needs it

Logo is an identifier, not a page ornament. Show it once in an intentional anchor position unless a long technical document needs repetition.

## Business card / stationery
- Begin with a 90 × 50 mm prototype; verify preferred local print trim and bleed with printer.
- White-first side: name / title / email / phone / address with Wanted Sans.
- Reverse: black typographic X / BYX or compact official signature. Prohibit fillets, emboss substitutes that distort form, and unnecessary colored fields.
- Suggested safe inset >= 4 mm; add printer-specific 3 mm bleed where requested.
- Use only approved wordmark artwork or properly licensed type outlines. Fonts must be embedded or outlined for print vendors as allowed by license.
- Prefer natural monochrome printing. If accent is used, explicitly approve each run.

## Presentations (PowerPoint / Keynote / Google Slides)
- Primary canvas 16:9 (13.333 × 7.5 in / 1920 × 1080 ratio).
- Default white canvas, black title, quiet metadata footer.
- Define master layouts: Cover; Divider; One Key Idea; Image Full; Image + Text; Two-Column; Diagram; Data Table; Closing.
- Typical safe margins: 0.45–0.65 in; align all elements to one common template grid.
- Typical print/viewing title 30–44 pt; readable body 16–22 pt for room presentations. Metadata 10–12 pt minimum where practical.
- Keep a project image's original color. Use X only as a major cover/section motif or subtle brand signature—not behind body content.
- Never shrink technical diagrams until dimensions become illegible; use split slides.

## Architectural drawings / CAD / BIM sheets
- All legal and technical requirements take precedence. Do not change statutory symbols, dimension conventions, scales, plotting conventions or layers to satisfy the brand.
- Branding lives primarily in the title block / sheet border / cover sheet, not within detailed technical content.
- Consistent title block fields: BYX identity, project, discipline, sheet code, drawing title, scale, date, drawn/checked/approved, revision and issue status.
- Adopt a clear office-wide sheet numbering and revision rule, documented separately per project/discipline.
- Define plotting pen weights **per scale and drawing discipline**; provisional candidate pen family: 0.13 / 0.18 / 0.25 / 0.35 / 0.50 / 0.70 mm. Test at actual output size; do not treat as mandatory for all plans.
- Never use eXperience trace overlays on technical plans. Diagram sheets may include an explanatory X graphic only where it does not imply building geometry.
- Use reliable CAD/BIM fonts where Korean character coverage and consultant interoperability matter; Wanted Sans is preferred in exported branded sheets but not mandated inside editable CAD files when missing or incompatible.

## A4 documents / reports / proposals
- A4 portrait by default. Start with 18–22 mm margins.
- Simple black type hierarchy, one clear title and section numbers; body Wanted Sans 10–11 pt (draft baseline).
- Use repeating page number, document title or project code in footer; avoid decorative header bars.
- Tables use thin strokes, strong column labels and numerical alignment.
- Figures must have titles, units, sources and references.
- Logo or X applied sparingly, usually cover and footer. Ensure exported PDF embeds permitted fonts.

## Web (existing BYX WEBSITE)
- Existing implementation is a single index.html + Supabase. Treat this as production legacy until migration approved.
- Do not introduce a framework, extra runtime fonts, stylesheets, new mandatory tokens, background accents or CDN by documenting a new standard.
- Planned future migration checklist: evaluate Wanted Sans font packaging; approve display font; define display typography and open-ended X expression rules; only replace legacy favicon/logo as part of a reviewed release; test cursor hot spots; preserve editor and admin functions.
- Preserve existing responsive layout, routes, hashing, Supabase behavior and media management.
- For future web: white-first, B&W navigation, strong identity heading, large project images, semantic components, keyboard focus and reduced-motion.
- Project photography is exempt from brand color limits. Explicitly nominated thumbnail/feature accents permitted; background green/teal UI not permitted by default.

## Software / tools made by BYX
- Reuse semantic color and typography role definitions; individual platforms use accessible native controls where appropriate.
- Favor functional corner radii, state feedback and clear input/validation/error/success content. Brand's angular typographic X is NOT a ban on normal UI corner radii.
- Buttons: distinguish primary/secondary/destructive by text, outline or weight; do not make an emerald-filled default primary button.
- Layout: consistent spacing scale, 44 × 44 CSS px touch target aspirational baseline where touch applies; at least WCAG minimums when applicable.
- Tables and forms: predictable alignment and keyboard navigation; dark mode is not mandatory.
- New products may consume standards/tokens.json through a platform-specific token adapter. Do not make this file a remote runtime dependency.

## Social / Instagram
- Prepare adaptable layout families: Project Photography; Process/Diagram; Brand/Statement; Announcement.
- Default portrait master ratio 4:5 (e.g. 1080 × 1350 px) and square 1:1 where needed; verify current publishing specifications at export time.
- Logo only once per composition; avoid X over key building details or faces.
- Use photographs at intended quality. An occasional high-impact Variable X animation is preferable to every image being a branded poster.
- Captions and hashtag styles are editorial choices, not required logo components.

## Export & deliverable QA
1. Correct naming and approved asset version.
2. No filleted/rounded brand X; no distortion of BYX wordmark.
3. White-first B&W; any accent explicitly approved.
4. Wanted Sans body where usable; fallback and font licensing documented.
5. Required metadata, revisions, scales and units present.
6. No lost text, clipped symbols or unreadable diagrams.
7. Contrast, screen-reader labels and reduced-motion tested for digital.
8. Desktop/mobile / PPT presentation / print proofs checked at actual output size.

## Governance
- Use semantic versioning for standards: 0.x exploration; 1.0 after two-architect sign-off.
- Log changes in standards/CHANGELOG.md.
- Store approved wordmarks, templates, animations and exported X stills in versioned assets under standards/assets/ later; do not silently replace them.
- Every new BYX product links to this standards/README.md or exports a versioned copy. Reuse tokens where technologically feasible.
- Separate formal brand principles (must follow) from sample layouts (may adapt).
