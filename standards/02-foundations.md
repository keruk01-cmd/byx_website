# 02 — Design Foundations
**Status:** DRAFT 0.2.0. All numerical presets below are PROVISIONAL unless stated LOCKED.

## Color architecture
**LOCKED:** white-first black-and-white. The brand graphic system, headings, lines and UI chrome default to achromatic color. Color may appear in project photography and explicitly selected accent areas only. An accent is not a compulsory part of any page.

| Semantic role | Proposal HEX | Media usage |
| --- | --- | --- |
| background | #FFFFFF | Primary canvas |
| foreground | #000000 | Primary content / logo |
| text-secondary | #595959 | Readable small text on white |
| text-muted | #666666 | Supporting information |
| line | #D8D8D8 | Delimiters on white |
| surface-soft | #F5F5F5 | Optional functional UI field grouping, never default brand block |
| inverse | #000000 / #FFFFFF | Occasional black panels |
| accent-candidate | #00A88D | RESERVED / disabled by default; explicit project only |

- Allow unrestricted project-image color; it does not imply a global accent.
- Color is never the sole vehicle for status or instruction. Provide text, shape or position too.
- Web text must meet WCAG 2.2 AA contrast where applicable: 4.5:1 normal text, 3:1 large text; UI boundaries also need adequate contrast. Don't use gray #8E8E8E as small essential copy on white without checking.
- For print, proof grayscale output, rich black, total ink coverage and CMYK conversions with the actual printer. Do not assume HEX matches CMYK on press.
- Do not introduce colored shadows, glass gradients or ambient background tints into formal brand material.

## Typography
**LOCKED:** body and explanatory Korean/Latin text uses Wanted Sans.  
**PENDING REVIEW:** Display Latin font with very heavy geometric, relatively square proportions and low pre-existing corporate character. Evaluate Dela Gothic One, Rubik Mono One, Archivo Black, and a custom wordmark. Gasoek One is a useful aesthetic comparator; don't silently substitute display fonts. Confirm individual font licenses, character coverage and font weights before distributing assets.

Provisional roles:
| Role | Print example | Digital example |
| --- | --- | --- |
| Display / identity | 48–90 pt | clamp(44px, 8vw, 128px) |
| Heading 1 | 30–40 pt | clamp(32px, 4vw, 64px) |
| Heading 2 | 20–26 pt | clamp(24px, 3vw, 40px) |
| Body | 10–11 pt | 16 px / line-height 1.55–1.7 |
| Caption / metadata | 8–9 pt | 12–14 px |
| UI input labels | n/a | 14–16 px |

- Use only purpose-specific type sizes and weights. Never manually horizontally stretch glyphs or simulate extra weight with strokes.
- Use left-aligned body by default; reserve centered alignment for short identity messages.
- Uppercase English metadata, dates, numbers and project codes may use consistent tracking. Avoid wide tracking in long Korean body copy.
- Prefer no more than two font families in any one deliverable (display + Wanted Sans); system fallback is allowed in software.
- For tabular specifications, align decimals, preserve digit readability, use appropriate numeral settings.
- Formal technical documents privilege legibility and drafting requirements over decorative display type.

## Spacing and grid
Base rhythm: **4-unit** system for screens; print templates translate spacing into consistent mm/pt increments rather than assuming a pixel-to-mm equivalence.
- Digital spacing candidates: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px.
- Desktop web: 12-column layout optional, 24–32 px gutters; content area and responsive margins must be tested.
- Mobile web: 4-column layout optional; minimum body side padding 16 px.
- White space is an active element. Avoid gratuitous dividers, containers and ornamental rectangles.
- For pages intended for reading, use narrow comfortable line lengths; long text ideally about 55–80 characters per line where practical.
- Align headings, rules, project cards and pagination to a common underlying baseline.
- Reference existing website's --pad and --hair; do not break its layout by hard-coding new margins before migration.

## Geometry, lines, icons and shape
- Typographic X expressions derive from the display typeface's X, without a separately commissioned Master X. Keep identity-focused X treatments crisp, angular and free of synthetic fillets.
- Interface and functional components may have small radii to improve affordance and interaction clarity; this does not authorize fillets in the logo or identity X.
- Use consistent stroke families for diagrams (e.g. 1 px UI separators; 1.5/2 px symbols at a defined viewing size); avoid vague optical blurring.
- Icons: use a coherent outline family, consistent viewBox, stroke and optical size; default black, not decorative multicolor icons.
- Prefer SVG vectors for logos and diagrams. Do not use Unicode icons for production-critical symbols.
- Graphic rules must survive one-color print and simple SVG export.

## Photography, diagrams and charts
- Project photography is the visual protagonist. Do not recolor architecture imagery to force a palette.
- Allow image crops only when the subject remains truthful and important architecture is not obscured.
- Label actual scale, units, source and dates for charts and diagrams; never use graph shapes as factual data without underlying real values.
- X supergraphics may crop imagery on identity-led pages, but not legal drawings, factual renderings or essential detail photographs.
- Use thin neutral annotations, consistent numbering and restrained captions.
- Supply alt text and descriptive labels for informative web images.

## Motion and UI interaction
- Interface motion: provisional 120–240 ms; brand expression: provisional 300–800 ms; adjust to content.
- Motion must explain state or express variable behavior, not obscure navigation.
- Offer a static alternative and respect prefers-reduced-motion.
- Native text cursor, selection, form input, resize and drag take priority over experimental X cursor. Keep targets keyboard-accessible and focus visible.
- X expressions may vary in number and form across projects; animate typographic width, crop, layers and layout without synthetic fillet or corner rounding.
- Ensure responsive behavior, zoom and touch-screen use.

## Branding vs accessibility vs media
Brand identity defines the visual voice; it does not override accessible interactions, construction drawing line weights, architectural notations, legal labels, or publishing specs. When in doubt, choose clarity.
