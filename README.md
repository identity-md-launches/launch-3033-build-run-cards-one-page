# Run Cards

The existing one-page Run Cards interface on Ethereum Sepolia (11155111). Holders lock 30,000 test $MILES while Squeektoshi runs. After delivery, each runner gets their coins back and an on-chain card. Test coins and cards have no value.

This revision is a rebuild only. The previous revision changed `web/src/styles.css` and `web/src/Samples.tsx` but did not rebuild `dist/`, so the live export still loaded `assets/index-D7aOAm6y.js`. `dist/` has now been rebuilt from the unchanged source, and `dist/index.html` loads `assets/index-BMsMAg6p.js`. The three changes now in the export: on phones, Rarity odds stays a table with one row per run; each Sample cards run kind shows its four cards in one row with the odds above each card in that rarity's color; and the run titles show only the name and distance (for example "Slow run under 7.5 km"). No file under `web/` was changed. Contracts, addresses, the wallet stack, reads, flows and every other box are as before. Nothing was deployed on chain.

## Install, preview and rebuild

The active application is in `web/`; use its existing manifest and lockfile. Rebuilt with Node.js 24.21.0 and npm 11.19.0.

```sh
npm --prefix web ci
npm --prefix web run dev
npm --prefix web run typecheck
npm --prefix web run build
npm --prefix web run preview
```

`build` runs TypeScript (`tsc --noEmit`) and Vite, writing the production site to the repository-root `dist/`. `preview` serves that export. Vite's existing `base: "./"` makes asset references relative for static hosting, including gateway subpaths. Deliver `dist/index.html` and all of `dist/assets/`, `dist/favicon.svg` and `dist/og.png` together. The app uses one page, so it needs no server-side routing or backend.

The logo, favicon and share image are unchanged. Samples require a reachable Sepolia RPC to draw; the static export retains the existing loading and Draw again states when a read fails.

## Existing chain and wallet configuration

| Item | Value |
| --- | --- |
| Network | Ethereum Sepolia, chain 11155111 |
| RunCards | `0x4ee0160d3e9d9a24e7ab2d933d3cf29c32774b3c` |
| RunCards deployment block | `12075794` |
| $MILES | `0xA5C662B042136D00E5A142112DF4f47bd9ae1B81` |
| $MILES Wheelpad curve | `0x1Ae975c860D22AEA8d6C6B3398164CfEfd3b7f7E` |
| SqueekCore | `0xfd6c166d4b8e2962e65746a13e5a0797cd4de0c4` |
| Card renderer | `0xa54b14c031e047c32f63b82301d948647422996d` |

`web/src/config.ts` retains addresses, ABIs, public RPCs, gas limits and links. The site reads the wheel status from `https://api.squeekchain.com/v1/status` and Sepolia through the existing public RPC fallback list. No address, ABI or RPC configuration changed.

The existing wagmi/viem stack uses EIP-6963 discovery, browser-wallet injection, Coinbase Wallet/Smart Wallet, and phone Open in links for MetaMask, Coinbase Wallet, Rabby and Phantom. There is one connection control and no required project ID, private credential or relay account.

Every transaction action retains its free wallet `eth_call` checks. Healthy account reads recheck Join every 30 seconds; the dedicated Join retry remains available during read-error backoff. Polling pauses while the document is hidden. The run-1 sentence in The run box remains until a later run starts. Exact 30,000 $MILES approvals, fixed transaction gas limits, sync handling, owned cards, samples, rarity odds, past runs and footer links are retained.

## Source map

| Path | Purpose |
| --- | --- |
| `web/index.html` | Title, description, favicon and Open Graph metadata |
| `web/public/` | Local favicon and share image |
| `web/src/App.tsx` | Page, five Questions disclosures and transaction controls |
| `web/src/styles.css` | Existing visual tokens and scoped sample-card responsive grids |
| `web/src/config.ts`, `rpc.ts`, `chain.ts`, `poll.ts` | Existing chain configuration, reads, simulations, transactions and polling |
| `web/src/wagmi.ts`, `useWallet.ts`, `ConnectSheet.tsx`, `open-in.ts` | Existing wallet connections and sheet |
| `web/src/Miles.tsx`, `miles.ts`, `Samples.tsx`, `samples.ts` | Existing price/curve panel and sample cards |
| `dist/` | Finished static export |
| `DESIGN.md` | Implemented design system and responsive behavior |
| `VALIDATION.md` | Actual commands, interaction results, six-domain review and limitations |

## Validation

`npm --prefix web ci` installed dependencies from the unchanged `web/package-lock.json` into the ignored `web/node_modules/`. `npm --prefix web run typecheck` and `npm --prefix web run build` both exited 0 (Vite 5.4.11, 4,908 modules). Vite emptied `dist/` and wrote the new export, so the seven old hashed files (`index-D7aOAm6y.js`, `index-CEn7KBlC.js`, `index-xaYGtov2.js`, `index-oe9QRP0h.css`, `ccip-B1k1dpxZ.js`, `localBatchGatewayRequest-CJS1sTnw.js`, `secp256k1-CMqpQZy4.js`) are gone and only files the new `index.html` uses remain. `git status` showed no change under `web/`.

I checked the rebuilt export in Playwright Chromium, served from a `/preview/` subpath, with live Sepolia and Squeekchain reads. **25 of 27 checks passed.** At 375px:
- Rarity odds is a table with one row per run; the run labels take two lines; the percentages are in their rarity colors.
- Past runs shows one labelled block per run.
- All four sample groups have four cards in one row, with the odds above and the rarity below each card in matching colors.
- The titles read "Slow run under 7.5 km" and so on.
- All 16 renderer images drew, and there was no sideways scroll.

At 1280px the same checks passed in desktop layout. At 390px the product and Connect are on the first screen, and the Connect sheet and the five Questions work from the keyboard.

The two failed checks are the same thing, once at each width: an aborted fetch of the page's own URL by the Coinbase Wallet SDK's `checkCrossOriginOpenerPolicy`. The previous export does exactly the same, and it has no visible effect.

The pinned taste probe passed **10 of 16 categories**. Four flags are existing look choices that earlier briefs kept on purpose. Two are new, and both come from the previous revision's source, which this brief says not to change:
- 7 type sizes at 390px, from the phone odds table's 9px and 13px text.
- A 4px clip of the "Drawing…" placeholder in the narrower phone cards at 320px. It only shows when the probe runs offline.

The commands, six-domain review and limitations are in [VALIDATION.md](VALIDATION.md).

No real wallet signing, mining, WebKit, screen reader, physical device or native browser zoom was tested.
