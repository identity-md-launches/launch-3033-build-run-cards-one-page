# Validation: compact Sample cards

Complete for the stated scope. This is a worker's local verification record, not independent certification.

The only application source changes are `web/src/Samples.tsx` and the sample-specific rules in `web/src/styles.css`. The existing application, contracts, addresses, ABIs, wallet stack, RPCs, simulations, polling, sample inputs and seed/cache implementation are preserved. The export is `dist/`. No contract was written, deployed or called with a state-changing request.

The visual idea remains the existing dark monospace game dashboard, with orange actions, blue accents and pixel card art. Only the sample comparison is denser. A single title element wraps naturally on phones; it is not clipped or forced onto an overflowing line. At desktop widths, cards may shrink below the 140px cap to fit four cards in each of the two run-group columns within the unchanged page container.

## Commands and results

Checked with Node 24.21.0, npm 12.2.0, Playwright 1.56.1 and Chromium 141.0.7390.37. To honor protected dependency paths, copied the unchanged `web/` manifest, lockfile and configuration with the application into `test/scratch/build/`, installed there, and copied the finished `test/scratch/dist/` export to root `dist/`. Byte comparisons confirmed build inputs match final `web/` and all exported files match the build output. No dependency, manifest, lockfile, build configuration or ignore-file changes are included.

| Check | Actual command / method | Result |
| --- | --- | --- |
| Install | `npm ci --prefix test/scratch/build --cache test/scratch/npm-cache --no-audit --no-fund` | Exit 0, using the existing lockfile. |
| Typecheck | `npm --prefix test/scratch/build run typecheck` | Exit 0; `tsc --noEmit`. |
| Production build | `npm --prefix test/scratch/build run build` | Exit 0; TypeScript and Vite 5.4.11; 4,908 modules, Vite completed in 11.22s. Existing dependency annotation warnings were nonfatal. |
| Existing renderer | `node test/scratch/prepare.mjs` | Exit 0; sixteen read-only `eth_call` responses from `RunCardRenderer.svg(card)` at the unchanged renderer address, via `https://ethereum-sepolia-rpc.publicnode.com`. All decoded as SVG. |
| Browser availability | `PLAYWRIGHT_BROWSERS_PATH=test/scratch/browsers node test/scratch/browser-launch.mjs` | Chromium launched. WebKit launch failed because required host libraries are missing. |
| Interactions | `PLAYWRIGHT_BROWSERS_PATH=test/scratch/browsers node test/scratch/validate.mjs` | Exit 0; **13/13 checks passed**, served from a bounded foreground server under `/preview/`. |
| Pinned design probe | `PLAYWRIGHT_BROWSERS_PATH=test/scratch/browsers IMD_PLAYWRIGHT="$PWD/test/scratch/tools/node_modules/playwright/index.mjs" node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste --offline` | Exit 0; **12/16 categories passed**. Four existing flags, below. Probe completion does not mean every category passed. |
| Baseline probe | Same probe with target `test/scratch/baseline/dist` and output `test/scratch/taste-baseline`, offline | Exit 0; the same twelve passing and four flagged categories. |
| Integrity | Baseline file hashes, source/build/export byte comparisons, relative asset checks and file-size audit | Application changes confined to the two stated source files; public images unchanged; old hashed output removed; complete static export and existing lockfiles retained. Export: **1,474,128 file bytes**. |

Scratch scripts, raw logs, fixture responses, dependency installations and screenshots are disposable test scaffolding, excluded from the delivered product. They are removed before submission. Build logs are `test/scratch/typecheck.log` and `build.log`; browser results are `test/scratch/interactions.log` and `validation-results.json`; probe results are `test/scratch/taste-output.json`, `taste-baseline-output.json` and each probe's `taste.json`.

## Interaction and responsive evidence

The thirteen checks covered:

1. At **390×844**, the product name and enabled Connect control are visible on the first screen. Connect ends at y=61px. The exact existing document title, favicon, description, `og:title` and `og:image` are present. Join is correctly disabled while disconnected.
2. No sample renderer calls before the sample box approaches the phone viewport. Drawing begins for nearby cards, then all sixteen original ABI inputs are requested exactly once. All sixteen actual renderer SVGs decode. Images retain `loading="lazy"`, `decoding="async"` and the original informative alt text, including edition numbers.
3. All four requested headings, with the run name alone bold; each heading uses the same four numbers as its Rarity odds row. The Work/rounds/top/blocks paragraph is removed. All sixteen captions are exactly Common, Rare, Epic or Legendary. The Sample cards heading and “examples, not cards anyone owns” note are unchanged.
4. Geometry at **320, 375, 390, 559, 639, 640, 768, 959, 960, 1024, 1280, 1440, 1920 and 2560px**. Below 640px, two equal filling card columns per group. From 640px, four left-aligned cards in one row, 12px apart, each at most 140px. Below 960px, groups stack; from 960px, Slow / Normal then Good / Great. All desktop titles fit on one rendered line in this browser. Every image keeps the 400:560 ratio, fills the art area, uses `contain` and pixelated rendering. Captions are centered in their specified colors. No page horizontal overflow at any checked width.
5. Successful renderer calls remain cached through all viewport changes, scrolling away and back, and opening/closing the connection sheet; no extra sample draws.
6. Keyboard Connect opening, native dialog Escape and focus return, plus all five unchanged Questions opening with Enter and closing with Space. A screenshot confirms the visible focus ring on the first question.
7. Every other section/row, header and footer has identical HTML and compared computed styling to the input export under identical fixture responses. The 1280px first-screen raster comparison allows only fewer than 0.01% of pixels with at most a one-channel-level difference for border antialiasing; no content/layout differences are accepted. The final run measured **zero different pixels**; earlier comparisons isolated one-level noise to rounded box edges. The full source of those surfaces is byte-identical. Sample box height falls from about **2,003px to 568px**.
8. A deliberate sample renderer rejection exposes Draw again. Keyboard activation redraws successfully; two calls total for that card confirm the failed promise was removed from the existing cache.
9. Emulated phone connection sheet retains the four Open in wallet links, marks and Coinbase Smart Wallet row.
10. Mock EIP-6963 named-wallet connection/disconnection, owned-card SVG display and unrevealed notice. Join, Deliver run 2 and Reveal run 3 retain preceding simulations, original destinations/calldata and gas limits of 1,500,000 / 40,000,000 / 400,000. A local wallet rejects each transaction; the inline error and enabled controls recover.
11. Separate fixture states reach Leave run 4 with gas 400,000 and approval of exactly 30,000 × 10^18 MILES to the original RunCards spender. Requests are rejected locally at the wallet boundary.
12. External service failure leaves Connect usable, its sheet available, and Join disabled with existing unavailable guidance.
13. Reduced motion disables transitions and leaves no running animations. No uncaught page errors or missing local resources in checked contexts.

Browser chain/account/market responses were explicit fixtures. Sample SVG responses replayed the successful real renderer reads so layout and caching checks were deterministic. No wallet key, real signature, broadcast transaction, receipt or mining was involved. The fixture results do not establish live wallet success or contract correctness.

Representative measured final geometry:

| Viewport | Card image | Sample box height | Page overflow |
| --- | --- | --- | --- |
| 375px | 148.5 × 207.9px | 2,305px | None |
| 640px | 134.5 × 188.3px | 1,115px | None |
| 768 / 959px | 140 × 196px | 1,146px | None |
| 960px | 100.25 × 140.34px | 484px | None |
| 1280 / 1440 / 1920 / 2560px | 130.25 × 182.34px | About 568px | None |

Screenshots actually captured and inspected: `test/scratch/shots/final-390.png`, `samples-375.png`, `samples-960.png`, `samples-1280.png`, `questions-keyboard-390.png`, `final-first-1280.png` and its baseline/comparison images. Additional captures include `samples-640.png`, `samples-1440.png`, `wallet-phone-390.png` and probe captures under `test/scratch/taste/shots/`. Fixture screenshots are not presented as live game state.

## Better Interface six-domain review

Applied the pinned Better Interface workflow and core principles during implementation, then reviewed the production export. The explicit brief to preserve the existing appearance governs unrelated style findings.

| Domain | Coverage | Limitations |
| --- | --- | --- |
| Accessibility | **Checked:** existing semantic headings/lists/images, informative alt text, rarity text in addition to color, keyboard retry, Questions and native dialog paths/focus return, existing visible focus ring, reduced motion, target-spacing probe. | No screen-reader session, exhaustive focus walk, forced-colors audit, full automated accessibility audit or native 200% zoom. |
| Layout | **Checked:** four-group DOM/visual order, fourteen widths and both breakpoint boundaries, left alignment, exact gaps, artwork geometry, mobile reflow, first screen, preservation comparisons and screenshots. | No RTL mirror, pseudo-localization or physical-device run; English-only content and existing layout outside samples preserved. |
| Writing | **Checked:** exact requested sample titles and captions, reuse of unchanged odds, removal of redundant work metadata, retained ownership disclaimer and unchanged other text. | No broader copy rewrite was authorized. |
| Typography | **Checked:** existing tokens/stacks/weights; 14px group titles with 400/700 distinction and 1.55 line-height; desktop single-line fit, phone wrapping and centered captions; probe scale checks. | OS-specific font fallbacks and native text enlargement not checked. Existing monospace prose, uppercase and tracked box headings are preserved by the brief. |
| Colors | **Checked:** exact unchanged tokens; rendered caption foregrounds against actual `#101015` box background. Common **16.26:1**, Rare **6.00:1**, Epic **6.18:1**, Legendary **9.53:1**, each above 4.5:1. Probe checked resolved solid-background pairs. | Existing dim stat/table labels fail ordinary small-text contrast; no claim covering every connected/disabled/image-background state. No alternate theme exists. |
| UI | **Checked:** unchanged box/art surfaces, lazy/loading/drawn/error/retry states, promise cache, dialog and action rejection recovery, restrained existing 150ms transitions and reduced motion. | No animation-panel slow playback, physical touch device or mined transaction success flow. Samples add no animation or interactive control. |

## Findings, fixes and preserved limitations

| Finding / source | Evidence / impact | Fix and recheck |
| --- | --- | --- |
| Medium: oversized samples, `web/src/styles.css:203` | Input at 1280px had four full-width run rows and a roughly 2,003px box. | Four capped tracks per group from 640px; two group columns from 960px; minimum widths permit shrinking within the existing container. Fourteen-width geometry check passes; about 568px at 1280px. |
| Medium: redundant sample metadata, `web/src/Samples.tsx:44` | The original separate headings and Work/rounds/top/blocks paragraphs repeated information in the art and omitted odds. | One title containing bold name, distance and unchanged `ODDS` values; all four exact-title/table comparisons pass. |
| Low: duplicated edition captions, `web/src/Samples.tsx:34`, `web/src/styles.css:206` | Edition appeared both on the card and below it; captions were not centered. | Removed the caption edition span and centered only sample captions. Labels and colors pass; edition remains in SVG and alt text. |
| Existing contrast limitation, `web/src/styles.css:11`, `:129`, `:219` | Both baseline and final probes measure dim `#62626e` labels on `#101015` at **3.15:1**, below 4.5:1 for small text. | Preserved under “Keep everything else exactly as it is” and “the look stays exactly the current site's.” New sample title/caption colors pass. |
| Existing style exceptions, `web/src/styles.css:50`, `:85`, `:113` | Both probes flag uppercase content, 2.2px box-heading tracking (about 0.183em) and monospace prose. | Preserved as explicitly requested appearance. No palette, font, headline or unrelated component edits. |

The twelve passing probe categories are render, layout, targets, eyebrows, type-sizes, glyphs, slogans, repetition, copy-budget, chrome, motion and share. The four flags are contrast, casing, tracking and type-faces. Both input and final exports have the same category results. These are recorded limitations, not sixteen passed categories.

## Remaining limits

The supplied browser connector failed before navigation with `Socket path too long`; direct Playwright Chromium supplied rendered screenshots and interaction verification. WebKit was installed and launch attempted but required host libraries, including GTK4 and Graphene, were unavailable. No WebKit behavior is claimed.

No real wallet/passkey/mobile-app connection, signature, receipt, mining, full sync completion, long-history load test, screen reader, physical phone or native browser zoom was tested. Broader live service availability was not audited beyond the successful sixteen renderer reads. No other UI or chain behavior was modified to work around these limitations.
