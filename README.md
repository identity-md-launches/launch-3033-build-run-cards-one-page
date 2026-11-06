# Run Cards

The existing one-page Run Cards interface on Ethereum Sepolia (11155111). Holders lock 30,000 test $MILES while Squeektoshi runs. After delivery, each runner gets their coins back and an on-chain card. Test coins and cards have no value.

This revision changes only the Sample cards box: compact cards capped at 140px from 640px, two run groups per row from 960px, one heading combining the run name, distance and existing rarity odds, and centered rarity-only captions. Phones below 640px retain two cards filling each row. The same sixteen inputs are drawn live by the existing renderer, lazy-loaded and cached. All other boxes, copy, visual tokens, contracts, wallet connections, reads and transaction flows are preserved. Nothing was deployed on chain.

## Install, preview and rebuild

The active application is in `web/`; use its existing manifest and lockfile. Checked with Node.js 24.21.0 and npm 12.2.0.

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

Dependencies were installed using the unchanged `web/package-lock.json` in a disposable copy under `test/scratch/build/`. This respected the protected repository dependency paths. Its source and configuration matched `web/`; the final export was copied to `dist/`, and obsolete hashed assets were removed. Scratch dependencies, browser binaries and caches are excluded from delivery by the existing ignore rules. No manifest, lockfile, build configuration, dependency or ignore-file change is included.

The explicit typecheck and production build passed. Direct Chromium validation passed **13/13 checks** against the export under `/preview/`, covering fourteen viewport widths, exact sample inputs, live renderer SVGs, lazy loading, caching, retries, keyboard interactions and representative wallet transaction boundaries. At 1280px, the sample box shrank from about 2,003px to 568px. The pinned taste@1 probe completed on the input and final exports: **12/16 categories passed**, with the same four existing appearance/contrast flags. Actual commands, six-domain coverage and limitations are recorded in [VALIDATION.md](VALIDATION.md). Scratch verification scripts and screenshots are disposable and are not part of the submitted site.

Wallet tests use local fixtures and reject transaction requests at the wallet boundary. They do not establish successful real-wallet signing or mining. Sixteen read-only calls to the existing renderer succeeded; broader live service behavior was not audited. The provided browser connector failed with “Socket path too long”; direct Playwright Chromium supplied rendered evidence. WebKit could not launch because required system libraries were missing. Screen-reader, physical-device and native browser-zoom checks were not performed. Existing appearance-related probe flags are documented, including dim-label contrast; this bounded change preserves the requested look.
