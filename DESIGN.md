# Run Cards design

The site is one dark page. A warm orange accent marks the one primary action, cards have rounded corners, and a pixel-art hamster is the only illustration. All values below come from `src/styles.css`, `src/App.tsx` and `src/Hamster.tsx` as built.

## Colors

The color system has two tiers. Primitives name a value. Components use only the role tokens.

| Role token | Primitive | Value | Used for |
| --- | --- | --- | --- |
| `--color-bg` | `--brown-950` | `#15100c` | Page background, image wells |
| `--color-surface` | `--brown-900` | `#1f1712` | Cards, connect sheet |
| `--color-surface-raised` | `--brown-850` | `#2a2019` | Secondary buttons, sheet rows, status line |
| `--color-border` | `--brown-800` | `#3a2d23` | Card borders, table and FAQ dividers, hover fill |
| `--color-border-strong` | `--brown-700` | `#54422f` | Button borders, resting dot |
| `--color-text` | `--sand-100` | `#f6ece1` | Body text, headings |
| `--color-text-muted` | `--sand-300` | `#c9b8a6` | Labels, captions, FAQ answers |
| `--color-accent` | `--orange-400` | `#ff9a45` | Primary button fill, links, step titles, "not revealed" note |
| `--color-accent-hover` | `--orange-300` | `#ffb06b` | Primary hover, link hover |
| `--color-on-accent` | `--orange-950` | `#1a0e04` | Text on the primary button |
| `--color-ok` | `--green-300` | `#8fdc9a` | Running dot, "You are in run N", success status edge |
| `--color-err` | `--red-300` | `#ff9c8c` | Wallet notes, error status edge |
| `--color-focus` | `--sand-100` | `#f6ece1` | Focus ring |

`color-scheme: dark`. The taste probe measured every rendered text pair at 4.5:1 or better (3:1 for large text). That run covered the page's connection-error state. The live-data state uses the same tokens.

Hamster art colors live in `src/Hamster.tsx`:

| Part | Color |
| --- | --- |
| Fur | `#e8913a` |
| Cream | `#f7dfbd` |
| Pink | `#f4a3ad` |
| Eye | `#1b1310` |
| Highlight | `#fff7ec` |

## Typography

There is one family, `--font-sans` (`system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`). `--font-mono` (`ui-monospace, "SF Mono", Menlo, Consolas, monospace`) is defined for addresses in the wallet stats. No web fonts are loaded.

The type scale has five sizes:

| Token | Size | Role |
| --- | --- | --- |
| `--fs-xl` | 2rem / 32px | `h1` "Run Cards": weight 800, -0.02em, line-height 1.15 |
| `--fs-lg` | 1.375rem / 22px | `h2` section headings: weight 800, -0.01em |
| `--fs-md` | 1.125rem / 18px | `h3`, live state, stat values, sheet title: weight 600 |
| `--fs-base` | 1rem / 16px | Body (line-height 1.5), buttons (weight 600, line-height 1.25) |
| `--fs-sm` | 0.8125rem / 13px | Captions, stat labels, hints, table, card attributes |

- **Weights:** 400, 600 and 800 only. `strong` is set to 600.
- **Wrapping:** headings use `text-wrap: balance` and paragraphs use `pretty`.
- **Line length:** the lede is capped at 60ch, How-it-works at 70ch and FAQ answers at 65ch.
- **Numbers:** changing values use `font-variant-numeric: tabular-nums` (`.num`, `.stat dd`).
- **Casing:** no all-caps text and no tracked labels anywhere.

## Spacing, radius, motion

- **Spacing:** a 4px base, with `--space-1` to `--space-6` = 4, 8, 12, 16, 24, 32px.
- **Grid gap:** `--grid-gap` is 16px on mobile and 24px from 60rem.
- **Card padding:** 16px on mobile and 24px from 60rem.
- **Radius:** `--radius-card` 20px (cards, sheet), `--radius-control` 12px (buttons, rows, card images, status line), and 3px squares for the live dot.
- **Easing:** `--ease: cubic-bezier(0.2, 0, 0, 1)`. Transitions name their properties: background-color, border-color, color and scale, all over 150ms.
- **Press:** a pressed button scales to 0.96.
- **Live dot:** pulses only under `prefers-reduced-motion: no-preference`.
- **Surfaces:** a border only, never a border and a shadow together. Cards are never nested.

## Components

- **Header (`.top`):**
  - Row one has the pixel hamster (32px) and the `h1` on the left and the wallet control on the right.
  - The lede and the disclaimer "Unofficial, on Sepolia testnet. Test coins only." sit under it.
  - When connected, the wallet control shows `0x1234…abcd`, and adds "· Disconnect" from 30rem. Its accessible name is always "0x1234…abcd, disconnect".
- **Buttons (`.btn`, `.btn-primary`, `.btn-wide`):**
  - Minimum height 44px, 16px inline padding.
  - Four states: rest, hover (only on `hover: hover` devices), pressed, and `:focus-visible` (2px solid focus color, 2px offset).
  - Disabled buttons drop to 50% opacity with `not-allowed`.
  - Only Join (or Connect / Switch to Sepolia) is filled orange.
- **Card (`.card`):** surface fill, 1px border, 20px radius, grid with 12px internal gap.
- **Live wheel (`.live`):** a 12px status dot (green and pulsing when running) next to "Running now / Resting · x.x km/h", with a caption for the settled round and Squeekchain block. The text carries the state; color only repeats it.
- **Stats (`.stats`):** a `dl` grid, `auto-fit, minmax(130px, 1fr)`, with a 13px muted label over an 18px semibold value.
- **Status line (`.msg`):**
  - It is always in the DOM (`role="status"`, polite), so screen readers announce each update.
  - While empty it is taken out of the grid flow (`position: absolute`), so it adds no gap.
  - With text it shows a raised fill and a 4px leading edge in accent, ok or err.
- **Connect sheet (`dialog.sheet`):**
  - It is a native modal dialog: the background is inert, Escape closes it, and so do a backdrop click and the 32px × button.
  - Rows are at least 48px tall: icon (28px), then the name, and "· opening…" while pending.
  - Up to 420px wide. Under 40rem it becomes a bottom sheet with safe-area padding.
- **My cards (`.card-grid`, `.nft`):** an `auto-fill, minmax(200px, 1fr)` list with no tile chrome.
  - The image is square, `image-rendering: pixelated`, with a 12px radius and a 1px `oklch(1 0 0 / 0.1)` outline.
  - Under the image: name, run and token, the "Not revealed yet" note, then attributes as a two-column `dl`.
- **Past runs table:**
  - The table uses 13px text with dividers only. Above 30rem cells don't wrap.
  - Under 30rem the header is visually hidden and each row becomes a two-column labelled block (`td::before { content: attr(data-label) }`), so no column is cut off.
- **How it works:** an ordered list, each step opening with an orange semibold title.
- **FAQ:** native `details`/`summary` with top dividers.
- **Footer:** links to the RunCards contract and $CARDIO on Etherscan, $CARDIO on Wheelpad, and Squeekchain. Each link has 10px block padding for touch.
- **Skip link:** the first focusable element. It is hidden until focused.

## Responsive behavior

- **Mobile first, one column.** At 390 wide the first screen shows:
  - the header with Connect;
  - the live wheel;
  - "This run" with its Join button and hint;
  - the wallet card.
- **From 60rem (960px), a two-column grid (3fr / 2fr):**

  | Row | Left | Right |
  | --- | --- | --- |
  | 1 | live (both columns) | |
  | 2 | run | wallet |
  | 3 | status line (both columns) | |
  | 4 | my cards | deliver and reveal |
  | 5 | past runs (both columns) | |
  | 6 | how it works | questions |

- **Width:** the content column is at most 1120px with 16px inline margins.
- **Measured:** no horizontal scroll at 320, 390 or 1440 (taste probe and interaction test).
- **Known wrap:** at 390 a connected wallet's address button wraps under the name. It needs about 380px beside the 32px title, which is more than the row has. It wraps cleanly and doesn't overflow.
