# Validation: rebuild of the static export

This is the worker's own local check record. It is not independent certification.

## Scope

This revision rebuilds `dist/` and does nothing else. The previous revision applied three edits to `web/src/styles.css` and `web/src/Samples.tsx`, but it did not rebuild the export. As a result, `dist/index.html` still loaded `assets/index-D7aOAm6y.js`, and none of the three edits was live.

- `dist/` was rebuilt from the current, unchanged source.
- No file under `web/` was changed: no source, styles, package files, lockfile or config.
- `README.md`, `VALIDATION.md` and `DESIGN.md` were updated. DESIGN.md got factual corrections only: it still described the old phone layouts, and the acceptance criteria require it to match the final source.
- No contract was written, deployed, or sent a state-changing call.

## Commands and results

Tools: Node 24.21.0, npm 11.19.0, Playwright 1.64.1, Chromium 154.0.8037.0.

| Check | Command | Result |
| --- | --- | --- |
| Install | `npm --prefix web ci --no-audit --no-fund` (from `web/`) | Exit 0, from the existing lockfile, into the ignored `web/node_modules/`. |
| Typecheck | `npm --prefix web run typecheck` (`tsc --noEmit`) | Exit 0. |
| Production build | `npm --prefix web run build` (`tsc --noEmit && vite build`, `outDir ../dist`, `emptyOutDir`) | Exit 0. Vite 5.4.11 transformed 4,908 modules and built in 12.72s. The existing Rollup annotation warnings from dependencies are not fatal. |
| Export contents | `dist/index.html`, inspection of `dist/assets/`, `git status` | `index.html` loads `./assets/index-BMsMAg6p.js` and `./assets/index-DaTZeLlc.css`; all URLs are relative. See the notes below this table. |
| Rebuilt-export browser check | `node test/scratch/check.mjs`: Playwright Chromium, export served under `/preview/`, live Sepolia RPC and Squeekchain status through the sandbox proxy | **25 of 27 checks passed.** The two failures are the same known request, once at each width (below). |
| Self-fetch comparison | `node test/scratch/abort.mjs`, run against the previous export (`git archive HEAD dist`) and the new one | Both exports make the same aborted request. |
| Design probe | `IMD_PLAYWRIGHT=… node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste --offline` | Exit 0. **10 of 16 categories passed.** Six flagged categories, below. |

Notes on the export:
- Seven old hashed files were removed by `emptyOutDir`: `index-D7aOAm6y.js`, `index-CEn7KBlC.js`, `index-xaYGtov2.js`, `index-oe9QRP0h.css`, `ccip-B1k1dpxZ.js`, `localBatchGatewayRequest-CJS1sTnw.js` and `secp256k1-CMqpQZy4.js`.
- Every file left in `dist/assets/` is referenced by the new build.
- `favicon.svg` and `og.png` are copied unchanged from `web/public/`.
- The export is 1,474,701 bytes.
- Nothing under `web/` is tracked as changed.

The logs, scripts and screenshots under `test/scratch/` are disposable. They are not delivered.

## The brief's CHECK, on the rebuilt export

| Width | Check | Measured result |
| --- | --- | --- |
| 375 | Loads a new hashed `index-*.js` | `./assets/index-BMsMAg6p.js`; not `index-D7aOAm6y.js`. |
| 375 | Rarity odds is a table, one row per run | `table.odds` has `display: table`. Header: Run, Common, Rare, Epic, Legendary. Four `table-row` rows. The table is 309px wide, which fits its 309px container. |
| 375 | Run labels on at most two lines | Each label cell is 36px tall at an 18.6px line height, so two lines. |
| 375 | Percentages in their colours | For example 60% `#ededf2`, 28% `#5b8cff`, 10% `#c26bff`, 2% `#f5a83a`. Every row has four distinct colors. |
| 375 | Past runs: one labelled block per run | Live data had one past run. The table is `display: block` and the row is a `grid`; the cells are labelled Run, Work, Runners, Delivered and Revealed through `::before`. |
| 375 | Four cards in one row per run kind, odds above each card, rarity below | All 16 cards are 73px wide, four per group, and all tops line up. Each odds caption ends above its art and each rarity caption starts below it, in the same color. Values: 60/28/10/2, 40/35/18/7, 25/35/28/12, 15/30/35/20. |
| 375 | Titles show only the name and distance | "Slow run under 7.5 km", "Normal run 7.5 to 9.5 km", "Good run 9.5 to 11 km", "Great run 11 km or more". |
| 375 | Live renderer art | All 16 SVGs drew. |
| 375 | No sideways scroll | `scrollWidth − innerWidth = 0`. |
| 1280 | Odds above the four cards of each run kind | Each card is 130px wide in two group columns, with the odds above and the rarity below in the matching color. Titles as above. 16/16 drawn. |
| 1280 | Rest as before | Rarity odds is a normal table. Past runs is a normal table (`display: table`, no `::before` labels). Scroll overflow is 0. |
| 390 | First screen and metadata | The product heading ends at y=143 and Connect at y=61 of 844. The title, favicon, description, `og:title` and `og:image` are present. |
| 390 | Primary interactions | Keyboard Enter opens the Connect sheet (a native dialog) and Escape closes it. All five Questions open with Enter. |

Screenshots taken and inspected:
- `test/scratch/shots/odds-375.png`: four table rows, colored percentages, two-line labels.
- `test/scratch/shots/samples-375.png`: four cards per row, odds above, rarity below.
- `test/scratch/shots/samples-1280.png`: two groups per row, odds above each card.
- `test/scratch/taste/shots/390.png`: header with Connect, wordmark, tagline and lede on the first screen.

Further screenshots were captured but not discussed here: `past-375.png`, `past-1280.png`, `odds-1280.png`, `first-375.png` and `first-1280.png`.

**Known failure.** Both failed checks are the same thing, once per width: `GET /preview/` is aborted (`net::ERR_ABORTED`). It is a fetch from the Coinbase Wallet SDK's `checkCrossOriginOpenerPolicy`. A stack trace captured with an injected fetch wrapper shows it comes from that function in a vendor chunk, and the previous export makes the identical request. There were no page errors, and no local asset failed.

## Better Interface six-domain review

No source change was allowed, so this review checks the rebuilt export against the guide and records findings. It does not fix them.

| Domain | Coverage | Findings and limitations |
| --- | --- | --- |
| Accessibility | Semantic odds table (`th` row headers, `thead`). Rarity named in text as well as by color. Keyboard Connect and Escape. Questions open with Enter. Image alt text kept. | No screen reader, forced colors or native zoom. |
| Layout | Measured at 375 and 1280, plus the probe at 320, 390 and 1440. No page overflow. Cards align in one row per group. Odds table fits its container. | At 320px the probe flags the offline "Drawing…" placeholder, cut by 4px in each roughly 63px-wide `.art` (`web/src/styles.css:209`). Live art replaces it once drawn, and the Draw again state was not measured there. Left as is because `web/` is frozen. |
| Writing | The titles match the brief exactly. The odds captions are plain percentages. | None. |
| Typography | The probe counts 7 sizes at 390px against a limit of 6. The literal 9px heading and 13px cell sizes in the phone odds table (`web/src/styles.css:233`, `:235`) come on top of the token scale. Phone sample captions use 11px (`--fs-label`, `:209`). | Recorded, not fixed (`web/` is frozen). A later source revision could use `--fs-label`/`--fs-ui` for those two literals. Existing uppercase and 2.2px tracking on box headings are kept on purpose. |
| Colors | The odds and caption colors reuse the existing tokens. Earlier measurements on `#101015`: Common 16.26:1, Rare 6.00:1, Epic 6.18:1, Legendary 9.53:1, all above 4.5:1 at the new 11–13px phone sizes. | The probe still flags the existing dim `#62626e` labels at 3.15:1, including the odds table's column headings. That is the existing look. |
| UI | The lazy draw, loading text, live drawn state and promise cache work with the new four-up grid (16/16 drawn). Call counts and caching were not re-measured this run. The Connect dialog and Questions work. | No physical touch device or real wallet flow. |

The design probe's results:
- **Passed:** render, targets, eyebrows, glyphs, slogans, repetition, copy-budget, chrome, motion, share.
- **Flagged and already present in the previous record:** contrast, casing, tracking, type-faces.
- **New flags,** both from the previous revision's source edits: layout (the 320px placeholder clip) and type-sizes (7 sizes at 390).

The brief kept the look and froze `web/`, so these are recorded limitations and not fixes.

## Remaining limits

- Wallet transactions were not exercised this run. The source is byte-identical to the previous revision, whose wallet and fixture checks are in its record.
- No real signing, mining, WebKit, screen reader, physical phone or native browser zoom was tested.
- Live data at check time had a single past run, so Past runs was checked with one row.
