# Run Cards

An unofficial fan site for Squeekchain's Run Cards game on Ethereum Sepolia (chain 11155111). Squeektoshi, a real hamster, runs on a wheel. While he runs, you lock 30,000 test $CARDIO. When his run ends, anyone presses Deliver, and every runner gets an on-chain pixel-hamster card plus their $CARDIO back.

This is a static one-page site. It has no backend, no analytics and no keys. It only reads from and calls the already-deployed RunCards contract. Test coins and cards have no value.

| Contract | Address |
| --- | --- |
| RunCards (ERC-721) | `0x79224b71fec04bbd1c34d0922e04a11da56d56cf` (deploy block 12074980) |
| $CARDIO (ERC-20) | `0x1CCcE5C1D320F931B9e409C480F532Ca95C0A26B` |
| SqueekCore | `0xfd6c166d4b8e2962e65746a13e5a0797cd4de0c4` |

## Install, preview, rebuild

You need Node 18 or later (it was built with Node 24.22.2 and npm 11.19.1).

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
- **Polling:** runs only while the tab is visible. After an error the next poll waits 5 minutes.
- **This run:** `runCount()`, `openRun()`, `running()`, `runInfo()`. If no joinable run has started since deployment (today run 1 is the `startedEarly` run and `openRun()` is 0), the page says so.
- **Buttons:** each one is enabled only after a free `eth_call` simulation from the connected wallet succeeds:
  - **Approve 30,000 $CARDIO:** offered while the allowance is below 30,000. It approves exactly 30,000.
  - **Join:** also enabled when the simulation fails only with `NotApproved`. Clicking it then approves first and joins after. On `NotCaughtUp` it sends `sync()` until `sync` returns true, then joins.
  - **Leave:** shown for each undelivered run the wallet joined.
  - **Deliver:** offered when the simulation succeeds. When it says `RunNotEnded` but the settled rounds show 24+ rounds without work (and the wheel is not running for the open run), the page offers "Sync and deliver", which sends `sync()` first.
  - **Reveal:** offered when `revealOf` gives a settled round and the run is not revealed.
- **Fixed gas limits** (wallets don't estimate): join 1,500,000; leave 400,000; sync 4,000,000; reveal 400,000; deliver 40,000,000. Approve is left to the wallet's estimate because the brief gives no limit for it.
- **My cards:** `Delivered` events from block 12074980 on, filtered to the wallet, kept only if `ownerOf` is still the wallet. The page decodes `tokenURI` (base64 JSON) and shows its `data:image/svg+xml` image, name and attributes. A card from an unrevealed run says "Not revealed yet". Non-SVG or remote images are never loaded.
- **Never** asks for a seed phrase or private key: the wallet signs.

## Validation (actual results)

Run on this machine against the final build. Details and the design review are in `artifacts/validation.md`.

| Check | Command | Result |
| --- | --- | --- |
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Production build | `npm run build` | exit 0; `dist/` is 492 KB (JS 434 KB, 153 KB gzip) |
| Design probe (taste@1) | `node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste` | 16/16 checks passed at 320, 390 and 1440 |
| Interaction test (Playwright, Chromium) | scratch script `test/scratch/interact.mjs`, not committed | 21/21 passed |

The interaction test served `dist/` under a subpath (`/sub/`) and checked:

- **Live Sepolia and Squeekchain data, proxied through Node:**
  - Wheel state, km/h and settled round render.
  - The "no run has started since the contract was deployed" state renders.
  - The Past runs table shows run 1 as "Not joinable".
  - Join is disabled with no wallet.
  - No horizontal scroll at 320 or 390.
  - The connect sheet opens, shows the no-wallet message and closes on Escape.
  - No page errors.
- **Mocked RPC with a mock EIP-6963 wallet:**
  - Open run stats render.
  - 812 mm/s shows as 2.9 km/h.
  - The wallet connects through the sheet.
  - Balance and "Has 30,000" show.
  - Join is enabled when the simulation reverts only `NotApproved`.
  - Clicking Join sent `approve(RunCards, 30000e18)` and then `join()` with gas 1,500,000.
  - Leave appeared and sent `leave(2)` with gas 400,000.

### Limitations

- **No real wallet or signature.** No transaction was sent to Sepolia. The wallet flows were checked against a mock provider and mocked chain state only.
- **Deliver, Reveal, the NotCaughtUp sync loop and card rendering were not exercised end to end.** Today no run has been delivered on-chain, so there are no real cards. The `tokenURI` decoding is written against the format the brief describes.
- **Deliver's 40,000,000 gas limit may be refused.** It is the brief's value. Networks with EIP-7825 (Fusaka) cap one transaction at 16,777,216 gas, so a wallet or node may refuse the Deliver transaction. In that case lower `GAS.deliver` in `src/config.ts`. The page reports the refusal as a plain message.
- **The sandboxed probe browser could not reach the network.** So the taste probe measured the page's "Sepolia is not answering" state. The live-data state was measured separately by the interaction test at 320, 390 and 1440.
- **WebKit, real phones, a screen reader and native 200% zoom were not tested.**
- **Wallet connections are narrower than the network's wallet-connectors guide.** The brief names ethers v6 and EIP-6963, so there is no wagmi and no Coinbase Smart Wallet row. Phones get "Open in MetaMask / Coinbase Wallet / Phantom" links. There is no Rabby link because its exact deep-link form was not available.
