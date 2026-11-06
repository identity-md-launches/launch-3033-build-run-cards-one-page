# Run Cards

An unofficial fan site for Squeekchain's Run Cards game on Ethereum Sepolia (chain 11155111). Squeektoshi, a real hamster, runs on a wheel. While he runs, you lock 30,000 test $CARDIO. When his run ends, anyone presses Deliver, and every runner gets an on-chain pixel-hamster card plus their $CARDIO back.

This is a static one-page site. It has no backend, no analytics and no keys. It only reads from and calls the already-deployed RunCards contract. Test coins and cards have no value.

| Contract | Address |
| --- | --- |
| RunCards (ERC-721) | `0x79224b71fec04bbd1c34d0922e04a11da56d56cf` (deploy block 12074980) |
| $CARDIO (ERC-20) | `0x1CCcE5C1D320F931B9e409C480F532Ca95C0A26B` |
| SqueekCore | `0xfd6c166d4b8e2962e65746a13e5a0797cd4de0c4` |

## Install, preview, rebuild

You need Node 18 or later (this revision was checked with Node 24.21.0 and npm 11.19.0).

```sh
npm ci            # install the exact versions in package-lock.json
npm run dev       # local dev server with hot reload
npm run build     # tsc --noEmit, then vite build into dist/
npm run preview   # serve the built dist/ locally
npm run typecheck # tsc --noEmit only
```

The committed `dist/` is the deliverable. Vite's `base` is `./`, so every asset URL is relative and the export works under an IPFS gateway subpath or an ENS name. Rebuild after any source change and commit `dist/` together with the source.

## Layout

| Path | What it holds |
| --- | --- |
| `index.html` | Title, description, favicon, og:title, og:image |
| `public/favicon.svg`, `public/og.png` | Pixel hamster favicon and 1200×630 share image |
| `src/config.ts` | Chain, the three addresses, RPC list, ABIs, fixed gas limits, links |
| `src/rpc.ts` | JSON-RPC client: public RPCs in order, next one on any error or a 15 s timeout; `eth_getLogs` in windows of at most 10,000 blocks |
| `src/chain.ts` | Reads (runs, wallet, cards), eth_call simulations that decide each button, and sending |
| `src/errors.ts` | Every RunCards custom error as one plain sentence |
| `src/wallet.ts`, `src/useWallet.ts` | EIP-6963 discovery (falls back to `window.ethereum`), switching to Sepolia (adds it if missing), "Open in" links for phones |
| `src/App.tsx` | The page |
| `src/styles.css` | Design tokens and components (see `DESIGN.md`) |

## How the page behaves

- **Live wheel:** `GET https://api.squeekchain.com/v1/status` (`measurement.coreStatus`, `measurement.speedMmPerSecond` → km/h = mm/s × 0.0036) and `SqueekCore.state()` for the settled round. Polls every 30 s.
- **Polling:** runs only while the tab is visible. After an error, including a card scan failure, the next poll waits 5 minutes. Retained readings are labelled as last known; failed chain/account reads disable actions until fresh wallet checks succeed. Late results from a previous wallet or refresh cannot replace the current wallet's data.
- **This run:** `runCount()`, `openRun()`, `running()`, `runInfo()`. If no joinable run has started since deployment, the page says so. Run 1 is the `startedEarly` run and cannot be joined.
- **Older runs:** the Past runs table shows eight rows. Action discovery reads all runs in batches of eight, so Leave, Deliver and Reveal have no history cutoff. Eligible reveals are also identified before connecting a wallet.
- **Wallet discovery:** EIP-6963 providers appear on desktop and phones, even without `window.ethereum`. Mobile Open in links are the fallback when no provider is found.
- **Buttons:** each one is enabled only after a free `eth_call` simulation from the connected wallet succeeds:
  - **Approve 30,000 $CARDIO:** offered while the allowance is below 30,000. It approves exactly 30,000.
  - **Join:** also enabled when the simulation fails only with `NotApproved`. Clicking it then approves first and joins after. On `NotCaughtUp` it sends `sync()` until `sync` returns true, then joins.
  - **Leave:** shown for each undelivered run the wallet joined.
  - **Deliver:** offered when the simulation succeeds. When it says `RunNotEnded` but the settled rounds show 24+ rounds without work (and the wheel is not running for the open run), the page offers "Sync and deliver", which sends `sync()` first.
  - **Reveal:** offered when `revealOf` gives a settled round and the run is not revealed.
- **Fixed gas limits** (wallets don't estimate): join 1,500,000; leave 400,000; sync 4,000,000; reveal 400,000; deliver 40,000,000. Approve is left to the wallet's estimate because the brief gives no limit for it.
- **My cards:** `Delivered` events from block 12074980 on, filtered to the wallet, kept only if `ownerOf` is still the wallet. Ownership read failures show a read error rather than an empty collection. The page decodes `tokenURI` (base64 JSON) and shows its `data:image/svg+xml` image, name and attributes. A card from an unrevealed run says "Not revealed yet". Non-SVG or remote images are never loaded.
- **Never** asks for a seed phrase or private key: the wallet signs.

## Validation (actual results)

Checked against the revised production export, served under `/sub/`, using offline RPC and wallet fixtures. All eight reviewer findings reproduced before edits and were fixed. The nine direct regression scenarios (including both older-run variants) now pass. Finding-by-finding answers are in `.imd-responses.json`; evidence, design coverage and limitations are in [artifacts/validation.md](artifacts/validation.md).

| Check | Command | Result |
| --- | --- | --- |
| Typecheck | `npm --prefix test/scratch/build run typecheck` | exit 0 (`tsc --noEmit`) |
| Production build | `npm --prefix test/scratch/build run build` | exit 0; final `dist/` is 487,770 bytes, JS about 153 KB gzip |
| Design probe (taste@1) | `node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste --offline` | 16/16 checks passed at 320, 390 and 1440 |
| Interaction tests (Playwright, Chromium) | `node test/scratch/revisions.mjs extended` | 21/21 scenarios passed; no uncaught page errors |

Dependencies were installed with the unchanged lockfile in a disposable copy at `test/scratch/build`, respecting the assignment's protected root `node_modules/`. Its source/configuration matched the repository, and its export was copied into `dist/` without changes. Scratch tools and caches are excluded from delivery. The normal install, preview and rebuild commands above remain the supported workflow.

The extended checks cover older Leave/Deliver/Reveal actions, mobile provider discovery and fallback links, delayed account/card results after account changes and disconnect, failed-read labels and recovery, five-minute backoff, hidden-tab polling, RPC fallback on reverts and timeout, ownership failures and transfers, SVG/metadata display, and log windows of at most 10,000 blocks. All primary transaction controls reached a mock wallet with the expected call, amount and gas, then exercised wallet cancellation without sending a transaction. Keyboard connection/Escape/focus return, FAQ opening and reduced motion passed. No horizontal overflow was measured at 320, 375, 390, 768, 960 or 1440 pixels; the product and main action were visible on the first 390×844 screen.

### Limitations

- **Offline verification only.** No real wallet, signature, transaction, receipt or live endpoint was tested in this revision. Simulated Deliver, Reveal and sync requests were checked through the wallet boundary; successful mining and a multi-transaction sync loop remain unverified. Contract addresses, ABI and required gas limits are unchanged.
- **Rendered coverage:** the taste probe checked the initial unavailable state; separate fixture tests checked healthy, stale, connected, card and wallet-sheet states. The browser connector failed at launch with `Socket path too long`; direct Playwright Chromium worked and supplied the rendered checks and screenshots.
- **WebKit, physical phones, a screen reader, a full accessibility audit and native 200% zoom were not tested.**
- **History read cost grows with run count.** All runs are checked for pending actions, with runInfo reads batched eight at a time. Very large histories and live RPC rate limits were not load-tested.
- **Wallet connections are narrower than the network's wallet-connectors guide.** The brief names ethers v6 and EIP-6963, so there is no wagmi and no Coinbase Smart Wallet row. Phones get "Open in MetaMask / Coinbase Wallet / Phantom" links. There is no Rabby link because its exact deep-link form was not available.
