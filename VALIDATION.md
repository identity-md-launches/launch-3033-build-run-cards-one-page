# Run Cards: bounded revision validation

## Scope and completion

**Complete for the stated scope.** Removed the two specified FAQ entries and their answers; the five remaining question/answer pairs are byte-for-byte unchanged and in the requested order. Removed the mobile `order: -1` rule for The run. The existing DOM now supplies The wheel → The run → Your wallet at every width. No other section was reordered.

The source and export are delivered together. No contract was written or deployed. Addresses, ABIs, RPCs, wallet connectors, transaction code, reads, simulations and polling source are unchanged. All product copy outside the two deleted FAQs, the footer destinations and disclaimer, logo, favicon and existing visual tokens are preserved. One input inconsistency was resolved: `web/public/og.png` had a different image from the previous `dist/og.png`. The source now uses the previous export's image, so the final exported share image is unchanged.

The review followed the pinned Better Interface workflow and all six domains, with the brief's exact-preservation requirement taking precedence over general style preferences. The visual idea remains a dark monospace game dashboard with a dot-matrix title and orange/blue accents. This report records worker checks, not independent certification.

## Commands and actual results

Checked with Node 24.21.0 and npm 11.19.0. To respect protected dependency paths, copied `web/` source, public assets, configuration, manifest and lockfile to `test/scratch/build/` and installed there. Byte comparisons confirmed that this build copy matched the final application. No dependency, manifest, lockfile, build configuration or ignore file was changed in the submission.

| Check | Actual command / method | Result |
| --- | --- | --- |
| Install | `npm ci --prefix test/scratch/build --cache test/scratch/npm-cache --no-audit --no-fund` | Exit 0; installed the existing lockfile. Deprecation notices from existing dependencies. |
| Explicit typecheck | `npm --prefix test/scratch/build run typecheck` | Exit 0, `tsc --noEmit`. |
| Final production build | `npm --prefix test/scratch/build run build` | Exit 0; TypeScript and Vite 5.4.11. Final Vite build completed in 21.79s. Existing dependency pure-annotation warnings were nonfatal. |
| Export | Copied `test/scratch/dist/` to `dist/`, removed obsolete hashed files; compared every output file | Pass; source/build/export agree. 1,474,110 file bytes in the final export. |
| Interaction validation | `PLAYWRIGHT_BROWSERS_PATH=test/scratch/browsers node test/scratch/validate.mjs` | Exit 0, **15/15 checks passed** on the final export, served under `/preview/`. |
| Design probe, final | `PLAYWRIGHT_BROWSERS_PATH=test/scratch/browsers IMD_PLAYWRIGHT="$PWD/test/scratch/tools/node_modules/playwright/index.mjs" node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste --offline` | Exit 0; **12/16 checks passed**. Four reported flags described below. Exit 0 means the probe completed, not that every check passed. |
| Design probe, baseline | Same probe against `test/scratch/baseline/dist`, output `test/scratch/taste-baseline`, offline | Exit 0; **12/16 checks passed**, the same four categories as final. |
| Integrity | File comparisons, relative-URL/file existence checks, protected-path diff and submission-size checks | Pass; complete local assets, no obsolete export chunks or packaged dependency caches. |

The final build log is `test/scratch/final-build.log`; interaction log and structured results are `test/scratch/final-interactions.log` and `test/scratch/validation-results.json`; probe outputs are `test/scratch/taste-output.json` and `test/scratch/taste-baseline-output.json`. These are disposable worker evidence and are removed with scratch before submission. `README.md` contains the normal rebuild/preview commands; `DESIGN.md` documents the final source.

## Interaction and responsive evidence

All chain and wallet responses in the interaction suite were explicit local fixtures. External services were intercepted; no wallet key, signature, broadcast transaction or real receipt was used. A fixture wallet rejected each transaction at `eth_sendTransaction`. This verifies routing to the wallet boundary, not mining.

The 15 passing checks cover:

1. Exactly five unchanged FAQ pairs in the required order. Each native disclosure opens with Enter and closes with Space.
2. Correct wheel/run/wallet visual order with `order: 0` at 320, 375, 390, 559, 639, 640, 768, 959, 960 and 1440px. Single column below 960px and three equal columns starting at 960px. No page overflow at any of those widths.
3. Product and enabled Connect control visible on the 390×844 first screen; title, favicon, description, `og:title` and relative `og:image` present. Brand tokens remain `#09090c`, `#f5a83a`, `#5b8cff` and the existing monospace stack.
4. All four exact footer destinations and the exact line “Unofficial, Sepolia testnet only: test coins and cards have no value.”
5. The exact run-1 sentence remains in The run box for the early-run fixture and disappears in the run-2 fixture. An unavailable-data fixture keeps Connect usable and Join disabled.
6. Desktop EIP-6963 named-provider discovery, Coinbase row, keyboard connection-sheet opening, Escape, focus return, connect and disconnect.
7. Phone sheet with MetaMask, Coinbase Wallet, Rabby and Phantom Open in links and Coinbase Smart Wallet, using the existing page URL.
8. Join disabled before connection, enabled after a successful simulation from the mock wallet, simulated again on click, then sent to the original contract with `join()` and gas 1,500,000.
9. Approval simulated before enabling, sent to the original MILES contract with exactly 30,000 × 10^18 and the original RunCards spender.
10. Leave run 4, Deliver run 2 and Reveal run 3 in a representative history fixture. Each retained the preceding successful wallet simulation, correct calldata and gas limits of 400,000 / 40,000,000 / 400,000. Rejected requests produce an inline error and return controls from the busy state.
11. Visible-tab Join rechecking using a virtual clock installed before application startup. No extra Join simulation during the early interval, another after the 30-second deadline, none during 90 seconds of hidden time, and a fresh successful check when visible again. The source interval remains 30,000ms. The test allows asynchronous RPC responses to settle after clock advancement.
12. Owned-card event/read/metadata/SVG display and unrevealed notice; sixteen sample slots with successful lazy SVG drawing; four rarity-odds rows and representative Past runs.
13. Reduced-motion media state disables transitions and has no running animations.
14. Preserved sections have identical HTML to the baseline under identical fixture data; the desktop first-screen screenshots are byte-identical. At 375px, the moved boxes retain their widths, heights, padding, borders, radii, font, colors and gaps.
15. No uncaught page errors or missing local resources in the closed, checked contexts.

In the healthy disconnected run-2 fixture at 390×844, Connect ends at y=61px, The wheel begins at y≈458px, The run at y≈645px, and the full Join button ends at y≈841px. The Join control is correctly disabled while disconnected. The product and enabled Connect remain on the first screen in the unavailable-data state too; longer error text can push Join lower. At 375px, page width and scroll width both measure 375px. At 959px the boxes stack; at 960px they share the same top edge.

Screenshots actually captured and inspected include `test/scratch/shots/final-390.png`, `final-1440.png`, `faq-390.png`, `run1-390.png`, `wallet-phone-390.png`, the baseline/comparison desktop screenshots, and the probe's 390/1440 first-screen/full-page captures under `test/scratch/taste/shots/`. The FAQ capture also shows its keyboard focus ring. Fixture screenshots show test data, not claimed live readings. No screenshots are required runtime assets; scratch captures are not submitted.

## Better Interface coverage

| Domain | Coverage | Findings / limitations |
| --- | --- | --- |
| Accessibility | **Checked:** native section/heading/disclosure/button/dialog semantics, visible focus source and captured FAQ focus, keyboard FAQ and connect/Escape/focus-return paths, disabled-state descriptions and reduced motion. Probe target-spacing check passes. | Existing small/dim labels retain their contrast limitation. No screen-reader session, exhaustive focus walk, forced-colors audit, automated full accessibility audit or native 200% zoom. |
| Layout | **Checked:** DOM/visual order, 960px breakpoint and adjacent widths, source grids/wrapping, 10 rendered widths, first screen, mobile/desktop screenshots and no sideways overflow. | No RTL mirror or pseudo-localization; the existing English-only interface and copy were preserved. |
| Writing | **Checked:** exact five FAQ pairs and order, removed answers absent, run-1 notice retained, original button/error/empty-state copy and exact footer. | No other copy changes were authorized. The existing headline and vocabulary remain. |
| Typography | **Checked:** existing source/computed font stacks, 400/700 weights, scale, heading tracking, wrapping at narrow widths, tabular-number rules; baseline/final presentation comparisons. | Monospace/uppercase/tracked headings are required existing style. Physical font availability on other operating systems is not verified. |
| Colors | **Checked:** exact existing tokens, probe-computed solid-background text contrast on initial unavailable states, identical brand styling before/after. | The dim-label pair is below the ordinary small-text contrast threshold. No claim that every possible connected/disabled/image-background pair passes. No palette changes within this preservation-only task. |
| UI | **Checked:** native disclosure states, connect sheet, pending/rejected action behavior, loading/unavailable/card states, existing hover/pressed/focus CSS, restrained 150ms transitions and reduced motion. | No physical touch-device run, slow-motion animation-panel inspection or full success/mined-transaction flow. No new component or feature was added. |

## Findings, fixes and preserved exceptions

| Finding / source | Evidence and impact | Change / recheck |
| --- | --- | --- |
| Medium: extra FAQ entries, `web/src/App.tsx:460` | Baseline had seven entries, including both questions requested for removal. | Deleted those two complete `details` blocks. Five exact remaining pairs passed pointer-independent keyboard interaction and source/render checks; native flow closes the gap. |
| Medium: phone visual order, `web/src/styles.css:96` | Baseline `@media (max-width: 959px) { .row-3 > #run { order: -1; } }` moved The run before The wheel despite the correct DOM order. | Removed that rule and its now-obsolete comment. Ten-width recheck passes, including 375, 959 and 960px; desktop pixels unchanged. |
| Low: stale delivery documentation, `README.md`, `DESIGN.md` | Input documents described the older CARDIO addresses, root source layout, sans typography and older grid. | Updated to the active `web/` app, actual tokens, current contracts and observed final layout. |
| Low: source/export share-image mismatch, `web/public/og.png` | A normal rebuild initially copied a different source share image over the existing exported image. | Synchronized source to the prior export image, rebuilt, and checked byte equality with the prior `dist/og.png`. The live-facing image and favicon are unchanged. |
| Existing accessibility limitation: dim labels, `web/src/styles.css:11`, stat/table label rules | Both baseline and final probe measured `#62626e` text on `#101015` at **3.15:1**, below 4.5:1 for small text. | Preserved under “Keep everything else exactly as it is” / “The look stays exactly the current site's.” Recorded as a limitation, not a passed contrast check. |
| Existing style exceptions: `web/src/styles.css:50`, `:85`, `:113` | Both probes flag uppercase content, 2.2px heading tracking (≈0.183em), and monospace prose. | Preserved as the brief's explicit current appearance. These flags are not newly introduced and do not authorize a redesign. |

The probe's twelve passing categories are render, layout, targets, eyebrows, type-sizes, glyphs, slogans, repetition, copy-budget, chrome, motion and share. The four flagged categories are contrast, casing, tracking and type-faces. Both baseline and final have these same results. The target check reports all 12 measured controls at least 24px or sufficiently spaced, while all 12 are below its 44px comfort preference. The initial offline probe does not establish every connected state; those are covered only to the extent described in the interaction checks.

## Remaining limits

The provided browser connector failed before navigation with `Socket path too long`. Direct Playwright 1.56.1 / Chromium Headless Shell 141 supplied actual rendered verification. WebKit was downloaded and launch attempted, but it could not run because host libraries (including GTK4 and Graphene) were unavailable. No WebKit behavior is claimed.

No real wallet/passkey/mobile-app connection, signature, live service check, transaction receipt, mining, multi-transaction sync completion, long history load test, screen reader, physical phone or native browser zoom was tested. Existing chain and wallet functionality was preserved by a narrow source diff and representative mock boundary checks. These checks do not certify the contracts or external services. No unavailable requester input was needed.
