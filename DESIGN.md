# Run Cards design

## Overview

Run Cards is a one-page Sepolia game interface for people joining Squeektoshi's runs with 30,000 test $MILES. The existing design uses a near-black page, outlined boxes, monospace copy, orange actions, blue accents and a dot-matrix title. The current source keeps that system: Sample cards is a compact comparison of the same sixteen live-drawn examples with each card's odds above it, and Rarity odds stays a table at every width. The current revision aligns the top bar and footer with the box content, sets body text at 14px, moves the Squeekchain block into The wheel's stats, centers the Sample cards titles, evens the odds columns, mutes How it works and tightens Questions. `dist/` was rebuilt from that source.

The source of truth is `web/src/styles.css`, with page composition in `web/src/App.tsx` and shared `Box` and `Stat` components in `web/src/ui.tsx`. The committed static export lives in `dist/`.

## Colors

All tokens are defined on `:root` in `web/src/styles.css`. The existing notation is hexadecimal; `color-scheme` is dark.

| Token | Value | Implemented role |
| --- | --- | --- |
| `--bg` | `#09090c` | Page background |
| `--box` | `#101015` | Boxes and connection dialog |
| `--raised` | `#17171e` | Secondary buttons, art placeholders and progress track |
| `--line` | `#24242d` | Box outlines, dividers, dialog rows |
| `--line-strong` | `#34343f` | Button outlines |
| `--text` | `#ededf2` | Body text and focus ring |
| `--muted` | `#9a9aa6` | Descriptions, notes, secondary text, How it works steps |
| `--dim` | `#62626e` | Stat labels and table headings |
| `--orange` | `#f5a83a` | Primary actions, links, run marker, notes, How it works lead-ins |
| `--orange-hover` | `#ffc46b` | Primary/link hover |
| `--on-orange` | `#1a1006` | Text on orange buttons |
| `--blue` | `#5b8cff` | Title, wallet/sample markers, Rare, price line |
| `--green` | `#3ddc84` | Running/success, buys, progress and wheel marker |
| `--purple` | `#c26bff` | Cards/rarity markers and Epic |
| `--red` | `#ff5b6b` | Errors, sells and negative price changes |

Secondary hover uses `#1f1f28` / `#44444f`; pressed controls use `#272732`, or `#e88b1f` for the primary action. Status text carries the meaning in addition to color. Rendered contrast limitations, including the existing dim labels, are recorded in `VALIDATION.md`; this is not a claim of full accessibility compliance.

## Typography

No downloadable font is required. `--font-mono` is `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`; it is used for body copy, labels, headings and controls. `--font-num` is `"Arial Narrow", "Roboto Condensed", Arial, sans-serif`; it is used for the tagline, stat values and odds numbers. Actual system fallbacks depend on the visitor's device.

| Token | Size | Role |
| --- | --- | --- |
| `--fs-label` | 11px | Stat/table/attribute labels; below 560px also the brand line, the Rarity odds note and the footer small print |
| `--fs-ui` | 12px | Box headings, notes, buttons, desktop brand line; below 640px the Sample cards titles; below 560px the footer links |
| `--fs-small` | 14px | Lede, captions, table cells, notes, footer links from 560px |
| `--fs-body` | 14px | Body text, card names and subsection headings. It now equals `--fs-small`; the two tokens stay separate because the source uses both |
| `--fs-value` | 20px | Stat values and dialog close glyph |
| `--fs-tag` | 34px | Tagline; 24px below 560px |

Two literal sizes sit outside the tokens. 13px is used for Questions summaries and answers at every width, and below 560px for the How it works steps and the Rarity odds percentages. 9px is used for the Rarity odds column headings below 560px (the table text there is `--fs-ui`, 12px). The design probe counts six sizes at 390px and five at 1440px; see `VALIDATION.md`.

Weights are 400 and 700. Body line-height is 1.55; headings and controls use 1.2, the tagline 1.1, stats 1.25 and odds 1.3. Box headings are uppercase with 2.2px tracking; the top brand line uses 2px, reduced to 1px below 560px. Stat labels, table headings and buttons retain their existing uppercase treatment. Paragraphs use `text-wrap: pretty`; the tagline uses `balance`, and its blue sentence ("Get a card when it ends.") is its own block line, also balanced. In the brand line, `.nowrap` keeps "RUN CARDS · SEPOLIA" together, so narrow screens break only after "WHEEL MILES ·". The lede has an 80ch measure. Changing numbers use tabular figures; stat values allow wrapping anywhere.

Sample group headings use the 14px small-text token (`--fs-ui`, 12px, below 640px), weight 400 and line-height 1.55, centered over their group's cards; only the run name is bold (700). Each heading holds only the run name and distance in one `h3` (for example "**Slow run** under 7.5 km"). It stays on one line at the checked widths and would wrap rather than clip. Each card has two centered bold captions in its rarity's color, the odds above the art ("60%") and the rarity name below it: Common in the normal text color, Rare blue, Epic purple and Legendary orange. Both captions are 14px from 640px and `--fs-label` (11px) below 640px. Edition numbers remain in the artwork and image alt text.

`DotTitle` in `web/src/DotTitle.tsx` renders the accessible h1 as fixed SVG dots. The existing orange/blue wordmark, pixel hamster, circular logo, favicon and local share-image assets are retained.

## Layout

The `.wrap` container has a 1200px maximum width, centered with 16px inline padding, 12px top padding and 28px bottom padding. `.page` and `.row` have 12px gaps. Spacing tokens are `--s1` through `--s6`: 4, 8, 12, 16, 20 and 28px. Boxes use 16px padding and 12px internal gaps. The top bar uses 16px inline padding (`--s4`) and the footer `calc(var(--s4) + 1px)`, so the logo, Connect, every box's content and the footer text share the same left and right edges (33px and 342px at 375 wide).

The page retains this sequence: header, hero, wheel/run/wallet row, $MILES, transaction status, My cards/Deliver and reveal, Sample cards, Rarity odds, Past runs, How it works/Questions, footer.

| Width | Implemented behavior |
| --- | --- |
| Below 960px | All `.row` layouts have one column. The three boxes follow DOM order: **The wheel → The run → Your wallet**. No `order` override is applied. |
| 960px and wider | `.row-3` has three equal columns, wheel/run/wallet left to right. `.row-2-1` uses a 2:1 split. |
| Below 640px | Each sample group keeps all four cards in one row: `repeat(4, minmax(0, 1fr))` with a 6px gap (about 73px cards at 375px). The connect dialog becomes a bottom sheet with safe-area padding. |
| 640px and wider | Each sample group has one left-aligned row of four cards, 12px apart. Tracks use `repeat(4, minmax(0, 140px))`, shrinking when needed and never exceeding 140px. `.sample-row` is capped at 596px (four tracks and three gaps) so its centered title stays over the cards. `.stats-4` retains four columns. |
| 960px and wider, Sample cards | `.sample-rows` uses two equal columns with a 20px gap: Slow / Normal, then Good / Great. Below 960px the groups stack in that same DOM order. |
| Below 560px | 24px tagline and smaller brand line; disconnect text is hidden visually. Past runs (every table except `.odds`) becomes one labelled two-column block per run. Rarity odds stays a table with one row per run: 12px text, 6px cell padding, 9px headings, and four centered nowrap 13px percentage columns that are only as wide as their content, each percentage centered under its heading, so the run label takes the remaining width; its note drops to `--fs-label`. How it works steps are 13px with an 8px gap. The footer tightens to a 4px gap, `--fs-ui` links and `--fs-label` small print. |

Stats use two columns by default. The wheel's `.stats-3` has three equal columns at every width (Speed, Settled round, Chain block). At narrow columns (under about 92px: 320 and 960 wide, and 360 and 1024 wide once the speed has two digits) the Speed value wraps onto two lines, "0.0" over "km/h", while the row stays one row. From 560px the four Rarity odds percentage columns are each 13% wide, so they are equal. My cards retain the auto-fill grid with a 150px minimum tile width. Card artwork keeps its 400:560 aspect ratio, width 100%, `object-fit: contain` and `image-rendering: pixelated`; images are not cropped to a different shape. The $MILES chart is 170px tall. Past runs keeps its data in mobile blocks; both tables have an overflow wrapper. `min-width: 0`, wrapping and responsive grids prevent page overflow without clipping the page.

The rebuilt export was checked in Chromium at 320, 360, 375, 390, 559, 560, 639, 640, 768, 959, 960, 1024, 1280, 1440 and 1920px, with no page overflow, and the probe ran at 320, 390 and 1440px (see `VALIDATION.md`). At 1280px, samples measure about 130×182px. Above the existing 1200px page maximum, cards stay that size. At 390×844 the product name and enabled Connect control are on the first screen. Detailed measurements and limitations are in the validation record.

## Elevation & Depth

The design is flat: box/raised tones and 1px borders provide structure. The live green dot has a 4px translucent green halo. The native modal dialog has a 70% black backdrop. The skip link uses `z-index: 10` and becomes visible on focus. There are no added gradients or shadows on the boxes.

## Shapes

`--r-box` is 14px; `--r-btn` is 8px. Art containers use a 10px radius; wallet icons use 6px; the focus ring uses 4px. Section markers are 10px squares. The live dot and chart dots are circles; the graduation bar is 4px tall with a 2px radius. Only art, icons and progress tracks use intentional clipping.

## Components

- **Box / Stat** (`web/src/ui.tsx`): labelled section with a colored decorative square and optional note; stats are semantic `dt`/`dd` pairs inside the caller's `dl`.
- **Buttons** (`.btn`, `.btn-primary`, `.btn-wide`, `.btn-small`): primary orange and secondary raised variants, 40px default minimum height or 32px small. Hover/pressed fills, native disabled state at 50% opacity and a 2px focus-visible ring with 2px offset. Transitions name background/border colors, last 150ms and use `--ease: cubic-bezier(0.2, 0, 0, 1)`. Reduced motion disables transitions and animations.
- **Wallet sheet** (`web/src/ConnectSheet.tsx`): one Connect control, native modal dialog, named EIP-6963 providers, Coinbase Wallet, and four phone Open in links plus Coinbase Smart Wallet. Rows are at least 48px; close is 32px. Escape/backdrop/close dismiss; the native dialog restores focus. Pending and cancellation states remain inline. Existing wrong-network and disconnect controls remain.
- **Wheel and run** (`web/src/App.tsx`): live/last-known/loading/error states, stats, Join and conditional Leave actions. The wheel shows Speed, Settled round and Chain block as stats; each shows "…" until read, and a failed read keeps the "Sepolia unavailable" note. The run-1 notice remains until a later run starts. Free wallet simulations determine actions; visible-tab Join checks remain every 30 seconds.
- **$MILES** (`web/src/Miles.tsx`): curve stats, price/trade chart, graduation indicator, Wheelpad link and existing unavailable/last-reading states.
- **Cards** (`web/src/App.tsx`, `web/src/Samples.tsx`, `web/src/samples.ts`): owned-card metadata and on-chain SVGs. `SampleRows` presents four run groups with four rarity samples each; each card's odds caption comes from the same `ODDS` values the Rarity odds table uses. The sample data, seed formula and promise cache are unchanged. Drawing starts within 400px of the viewport through `IntersectionObserver`; images retain lazy loading, asynchronous decoding and descriptive alt text. A failed read exposes the existing Draw again button and evicts its failed cache entry. Rarity captions reuse existing color tokens. These sample rules do not change the owned-card grid.
- **Deliver/reveal and status** (`web/src/App.tsx`): simulation-gated actions, existing busy labels and a persistent polite status region. Existing empty/read-error guidance remains.
- **Questions** (`web/src/App.tsx`): five native `details`/`summary` disclosures in the requested order. Removed entries leave no placeholder gap. The box has no row gap and its heading an 8px bottom margin; each disclosure has 6px block padding, with none above the first or below the last. Each summary is 13px bold and at least 28px high; answers are 13px muted with a 4px bottom margin.
- **How it works** (`web/src/App.tsx`): a numbered list in `--muted` whose bold lead-ins stay orange.
- **Footer** (`web/src/App.tsx`): four unchanged external links and the exact Sepolia/no-value disclaimer, inset to the box content edges.

## Do's and Don'ts

Reuse `Box`, `Stat`, `.row` and the existing token roles. Keep controls distinct, use the existing focus ring and preserve accompanying status text. For another surface, start inside `.wrap` / `.page`, compose the existing boxes and choose the established responsive grid; the current delivery remains one page.

Preserve the dot title, system font stacks, palette, existing copy and density. Preserve DOM order on phones rather than visually reordering focusable sections. Keep contract configuration, wallet connectors, reads and transaction code outside presentation-only changes.

Design review used the pinned Better Interface guidance by Jakub Krehel (MIT, commit `267330e1adfc66a718fb65fa6918c1f06d0a689e`). Documentation structure follows the pinned Impeccable guidance by Paul Bakaus (Apache-2.0, commit `9d715cc4f5564a990ca8345abfdd5df6dc9b41c8`).
