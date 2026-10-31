# BYX Graphic Standards
**Version:** 0.2.0 · **Status:** DRAFT / REVIEW REQUIRED · **Date:** 2026-10-31  
**Owner:** ARCHITECTS BYX (바이엑스건축사사무소)

## Purpose
This is the cross-media source of truth for BYX-branded output: website, software, presentations, documents, drawings, business stationery, and social media. The purpose is consistent **design decisions**, not identical layouts across media.

BYX is a two-architect design studio. The name is pronounced 바이엑스. Official English name: **ARCHITECTS BYX**; Korean: **바이엑스건축사사무소**. The open syntax **[DISCIPLINE] BY X** extends to ARCHITECTURE, FURNITURE, LANDSCAPE, UIUX and other disciplines.

The X has two linked interpretations:
- **Variable X:** project-specific conditions and inputs (client, site, regulations, material, budget, constraints).
- **eXperience X:** designers' accumulated judgement, decisions and craft.
BYX designs not only outcomes but the rules/functions through which outcomes are made.

ABYX recalls game-controller letter buttons and the pleasure of making. Architectural axes and X/Y coordinates are secondary references. Neither is required as a separate core motif.

## Normative design system
1. [01 — Typographic X expression system](01-brand-identity.md)
2. [02 — Foundations: typography, color, grid, accessibility](02-foundations.md)
3. [03 — Applications: print, slides, drawings, software, web](03-applications.md)
4. [04 — X Expression Library / motion patterns](04-x-expression-library.md)
5. [Design tokens — platform-neutral JSON](tokens.json)
6. [Visual page preview](preview.html)
7. [Decision and revision log](CHANGELOG.md)

## Decision hierarchy
1. Laws, professional drawing standards, accessibility and technical requirements override aesthetics.
2. The above brand principles and approved identity rules and typography take priority over individual templates.
3. Medium-specific templates define their own dimensions and output constraints.
4. Project imagery may use its own colors; brand chrome remains black-and-white unless explicitly approved.

## Status language
- **LOCKED:** confirmed principle. White-first B&W; typography-derived X with no synthetic fillets; Variable X + eXperience X as two principles with many expressions; Wanted Sans body; restrained color.
- **PROVISIONAL:** candidate measurements, typography scale, emerald sample, display-face candidates, geometry proportions.
- **TO DESIGN / APPROVE:** display typeface, BYX wordmark, X behavior library and visual prototypes; print templates; RGB/CMYK/Pantone equivalents.

A proposal becomes LOCKED only after review by BYX's two architects. No fallback glyph is approved logo artwork. **No dedicated geometric Master X is required.**

## Repository integration / important legacy constraint
This repository currently serves a build-free **single-file index.html** with embedded Anton + SUIT, four site color tokens, and Supabase. This version of the standard is **documentation-first**. It does not silently replace the existing website's fonts, CSS tokens, favicon, cursor, CMS, route behavior, or deployment.

- Read PROJECT.md and CLAUDE.md before website modifications.
- Keep current index.html and its four original CSS tokens intact until a separately reviewed migration.
- Do not add a framework, npm/build pipeline, external font CDN or runtime assets solely to implement these standards.
- New materials should follow the standard from inception; legacy materials are migrated explicitly.
- JSON is a canonical cross-media token catalogue; it is not automatically loaded by the current website.

## Reference sources
- NASA Graphics Standards Manual (1976): https://www.nasa.gov/wp-content/uploads/2015/01/nasa_graphics_manual_nhb_1430-2_jan_1976.pdf
- Apple Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/
- XR / Athletics brand system (conceptual inspiration only): https://athleticsnyc.com/work/xr

Reference systems inspire clarity, documentation, adaptability and motion principles; do not copy protected logo artwork.
