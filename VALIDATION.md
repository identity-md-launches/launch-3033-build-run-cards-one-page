# Validation: design fix and rebuilt export

This is the worker's own local check record. It is not independent certification.

## Scope

This revision applies the brief's 20 edits verbatim (3 in `web/src/App.tsx`, 17 in `web/src/styles.css`) and rebuilds `dist/`.

- A script confirmed each original text occurred exactly once before replacing it.
- No other file under `web/` changed: no other source, package files, lockfile or config.
- `README.md`, `VALIDATION.md` and `DESIGN.md` were updated to describe the final source.
- No contract was written, deployed, or sent a state-changing call.

## Commands and results

Tools: Node 24.22.1, npm 11.19.1, Playwright 1.64.1, Chromium 154.0.8037.0.

| Check | Command | Result |
| --- | --- | --- |
| Install | `npm --prefix web ci --no-audit --no-fund` | Exit 0, from the existing lockfile, into the ignored `web/node_modules/`. |
| Typecheck | `npm --prefix web run typecheck` (`tsc --noEmit`) | Exit 0. |
| Production build | `npm --prefix web run build` (`tsc --noEmit && vite build`, `outDir ../dist`, `emptyOutDir`) | Exit 0. Vite 5.4.11 transformed 4,908 modules and built in 16.11s. See the note on repeat builds below. The existing Rollup annotation warnings from dependencies are not fatal. |
| Export contents | `dist/index.html`, inspection of `dist/assets/`, `git status` | `index.html` loads `./assets/index-CuAy6CPQ.js` and `./assets/index-CtDLoLa9.css`; all URLs are relative. See the notes below this table. |
| Rebuilt-export browser check | `node test/scratch/check.mjs`: Playwright Chromium, export served under `/preview/` | **89 of 90 checks passed** in one run on the delivered export. The failure is described below. |
| Design probe | `node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste` | Exit 0, with the browser path set as described below. **11 of 16 categories passed.** Five flagged categories, below. |

Notes on the export:
- Seven old hashed files were removed by `emptyOutDir`: `index-BMsMAg6p.js`, `index-BEOsvjTu.js`, `index-Di_u_STu.js`, `index-DaTZeLlc.css`, `ccip-BTl4LZcx.js`, `localBatchGatewayRequest-r6jI2QJd.js` and `secp256k1-BWI4AIdD.js`.
- Every file left in `dist/assets/` is referenced by the new build.
- `favicon.svg` and `og.png` are copied unchanged from `web/public/`.
- The export is 1,475,356 bytes (`du -sb`).
- **Repeat builds differ.** A second build from identical source produced new JavaScript hashes; the CSS hash stayed the same. Every result in this file was therefore measured again on the second build, which is the delivered one, and checksums confirmed the checks did not alter `dist/`.

How the browser was run on this machine:
- **Live reads:** this machine's browser could not fetch the public endpoints directly (`net::ERR_FAILED`), although curl and Node reached them and they return correct CORS headers. So the check forwarded the browser's Sepolia RPC and Squeekchain status requests through Node, using the same URLs the site calls. The responses are real: 488 were forwarded with no errors. A direct browser-to-endpoint read was not observed in this run.
- **Probe:** it ran without that forwarding, so it saw the page's unavailable state, as `test/scratch/taste/shots/390.png` shows.
- **Browser build:** the probe's Playwright expects Chromium build 1248 and this machine has build 1246, so a link pointed one at the other.

Live values at check time: speed 0.0 km/h (resting), settled round 405, Chain block 1,140, one past run.

The logs, scripts and screenshots under `test/scratch/` are disposable. They are not delivered.

## The brief's CHECK, on the rebuilt export

| Width | Check | Measured result |
| --- | --- | --- |
| Export | `dist/index.html` loads a new `index-*.js` | `./assets/index-CuAy6CPQ.js`; the previous was `index-BMsMAg6p.js`. |
| 375 | Logo, Connect, boxes and footer share the same edges | Logo left, footer links left and footer text left are all 33px, equal to the box content's left edge. Connect right is 342px, equal to the box content's right edge. Boxes span 16 to 359px. |
| 375 | The wheel: Speed, Settled round, Chain block in one row | Three 92px columns with the same top. Values read 0.0 km/h, 405 and 1,140, each on one line, and the values line up. The "Squeekchain block" line is gone. |
| 375 | Sample cards titles centered over their cards | All four title centers are 187.5px, equal to the card row centers. Titles are 12px on one line. Four cards per row; 16/16 art drew. |
| 375 | Odds one row per run, each percentage centered under its header | `table.odds` has `display: table` with four `table-row` rows. Percentage centers are within 0.01px of their heading centers. The table is 309px wide in its 309px container. |
| 375 | No sideways scroll | `scrollWidth − innerWidth = 0`. |
| 375 | Other requested values | Body 14px. Tagline 24px, with no `<br>` and the blue sentence as a block. Steps 13px in muted `rgb(154, 154, 166)` with an 8px gap, lead-ins still orange. Footer small print 11px, links 12px, gap 4px. Odds note 11px. |
| 1280 | Equal top boxes | Wheel, run and wallet are 381.3 × 215.3px each. |
| 1280 | Equal odds columns | All four percentage columns are 147.4px wide. |
| 1280 | Other requested values | Body 14px, tagline 34px, steps muted. Logo and footer at 73px and Connect at 1207px match the box content. Titles centered at 351.5px and 928.5px; cards 130.25px. 16/16 art drew. No scroll. |
| 320 to 1920 | 13 more widths: 320, 360, 390, 559, 560, 639, 640, 768, 959, 960, 1024, 1440, 1920 | No sideways scroll, the header is clear of Connect, and titles are centered at every one. |
| Both | Questions | Row gap 0, heading margin 8px, summaries 13px and 28px high. Disclosure heights are 34, 41, 41, 41 and 35px, so the rows are evenly spaced. |
| 390 | First screen and metadata | Connect ends at y=61 and the tagline at y=265 of 844. The title, favicon, description, `og:title` and `og:image` are present. |
| 390 | Primary interactions | Keyboard Enter opens the Connect sheet (a native dialog) and Escape closes it. All five Questions open with Enter. |
| 320 to 1280 | Wallet states in the header, using a test provider in the page that signs nothing | With a connected address, 320, 375, 390 and 1280 are all clear. With Switch to Sepolia, 375, 390 and 1280 are clear; 320 fails (below). |
| 375 | Sepolia and status unreachable | The stats stay "…" in one row, and the notes read "Retrying in 5 minutes." and "Sepolia unavailable. Retrying in 5 minutes." |

Screenshots taken and inspected, all under `test/scratch/`:
- `shots/first-375.png`: top bar, 24px tagline, three stats on one row.
- `shots/full-375.png` and `shots/full-1280.png`: the whole page, live data.
- `shots/first-320.png`: Speed on two lines.
- `shots/odds-375.png`: one row per run, centered percentages.
- `shots/samples-375.png`: centered titles over four-card rows.
- `shots/faq-open-390.png`: all Questions open, visible focus ring on the last.
- `shots/foot-375.png` and `shots/foot-1280.png`: footer links and small print.
- `shots/top-wrong-network-320.png`: the failure below.
- `taste/shots/390.png`: the probe's first screen, without live data.

**The one failure.** Wrong-network state at 320px: "Switch to Sepolia" starts 2.78px before the end of the brand line, so "SEPOLIA" touches the button. Measured gaps by width:

| Width | Gap |
| --- | --- |
| 320 | −2.78px |
| 322 | −1.36px |
| 323 | −0.64px |
| 324 | 0.06px |
| 330 | 4.33px |
| 340 | 11.44px |

The requested `.nowrap` span causes it, because the text can no longer wrap to make room. The brief says to apply the edits verbatim and change nothing else in `web/`, so it is recorded and not fixed.

**Known request.** Each page load makes one aborted `GET /preview/` (`net::ERR_ABORTED`). An earlier revision traced it to the Coinbase Wallet SDK's `checkCrossOriginOpenerPolicy`, and it has no visible effect. It was treated as expected here and not traced again. There were no page errors, and no local asset failed.

## Better Interface six-domain review

The brief fixes the source edits verbatim, so findings outside them are recorded and not fixed. No fix was applied beyond the brief's edits.

| Domain | Status | Coverage | Findings and limitations |
| --- | --- | --- | --- |
| Accessibility | Checked | Semantic odds table and `dl` stats. Rarity named in text as well as by color. Keyboard Connect and Escape. Questions open with Enter, with a visible focus ring. Probe `targets` passed: all 12 controls it measured at 390 are at least 24px or spaced apart. | Summaries are now 28px high as requested (`web/src/styles.css:252`): above 24px, under the 44px comfortable size. No screen reader, forced colors or native zoom. |
| Layout | Checked | 15 widths in the live-data check, plus the probe at 320, 390 and 1440. No page overflow. Edges and centers measured above. | Finding 1 and finding 2, below. |
| Writing | Checked | The new label "Chain block" reads as the brief gives it. | The removed line's "Reading Sepolia…" text is gone, so while loading the wheel shows only "…" in the stats, as the brief's replacement specifies. The failure state keeps the existing "Sepolia unavailable" note. |
| Typography | Checked | The probe counts 6 sizes at 390px (9, 11, 12, 13, 14, 24) and 5 at 1440px (11, 12, 13, 14, 34), within the limit of 6. | `--fs-body` and `--fs-small` are now both 14px (`web/src/styles.css:23-24`), so the two tokens are redundant. Literal 13px and 9px sit outside the tokens. Existing uppercase and 2.2px tracking on box headings are kept on purpose. |
| Colors | Checked | Ratios computed from the rendered flat token pairs: muted steps on `#101015` 6.82:1, footer small print on `#09090c` 7.15:1, orange lead-ins on `#101015` 9.53:1. | The new Chain block label uses the existing dim `#62626e`, measured at 3.15:1 like every stat label. That is the existing look. |
| UI | Checked | Connect sheet, Questions, live, resting and unreachable states of The wheel, connected and wrong-network header states. | No real wallet flow, no physical touch device. Motion unchanged. |

Findings:

| # | Severity | Source | Evidence and impact | Action |
| --- | --- | --- | --- | --- |
| 1 | Low | `web/src/App.tsx:246`, `web/src/styles.css:59` | Wrong-network state at 320 to 323px: the button overlaps the end of the no-wrap brand line by up to 2.78px. The text stays readable and the button still works. | Not fixed: the brief fixes these edits verbatim. A later revision could allow wrapping below 340px. |
| 2 | Low | `web/src/App.tsx:267`, `web/src/styles.css:126` | The Speed value wraps to "0.0" over "km/h" at 320 and 960px, and with a two-digit speed at 360 and 1024px too (a test value was written into the page; columns under about 92px). The row stays one row. It fits at 375, 390 and 1280. | Not fixed, same reason. |
| 3 | Low | `web/src/styles.css:212` | Existing: at 320px the "Drawing…" placeholder is cut by 4px in each card while art is loading or unreachable. Live art replaces it. | Not fixed, same reason. |

The design probe's results:
- **Passed (11):** render, targets, eyebrows, type-sizes, glyphs, slogans, repetition, copy-budget, chrome, motion, share.
- **Flagged, existing look kept by earlier briefs (4):** contrast, casing, tracking, type-faces.
- **Flagged, existing defect (1):** layout, which is finding 3.

The type-sizes flag from the previous revision has cleared. The first screen at 390 has 52 words of prose against a bar of 60.

## Completion

Complete for the stated scope, with findings 1 to 3 left open because the brief allows no further change under `web/`.

## Remaining limits

- Wallet transactions were not exercised. The test provider connects and reports a chain only. It cannot sign or send, and the transaction code is unchanged.
- No real signing, mining, WebKit, screen reader, physical phone or native browser zoom was tested.
- Live data at check time had a single past run and the wheel at rest, so Past runs was seen with one row and a two-digit speed was only tested by writing a value into the page.
