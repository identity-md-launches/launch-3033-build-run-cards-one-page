# Run Cards

The existing one-page Run Cards interface on Ethereum Sepolia (11155111). Holders lock 30,000 test $MILES while Squeektoshi runs. After delivery, each runner gets their coins back and an on-chain card. Test coins and cards have no value.

This revision is a small design fix, applied verbatim to `web/src/App.tsx` and `web/src/styles.css`, and `dist/` was rebuilt so it goes live. `dist/index.html` now loads `assets/index-CuAy6CPQ.js`. The changes:
- The top bar and footer align with the box content.
- Body text is 14px.
- On phones the tagline is 24px and the brand line breaks only after "WHEEL MILES ·".
- The Squeekchain block is now a third stat in The wheel, labelled Chain block.
- Sample cards titles are centered over their cards.
- Rarity odds has even columns, with percentages centered under their headings on phones.
- How it works is muted, Questions is compact and evenly spaced, and the footer uses small print on phones.

Contracts, addresses, the wallet stack, reads and flows are as before. Nothing was deployed on chain.

## Install, preview and rebuild

The active application is in `web/`; use its existing manifest and lockfile. Rebuilt with Node.js 24.22.1 and npm 11.19.1.

```sh
npm --prefix web ci
npm --prefix web run dev
npm --prefix web run typecheck
npm --prefix web run build
npm --prefix web run preview
```

`build` runs TypeScript (`tsc --noEmit`) and Vite, writing the production site to the repository-root `dist/`. `preview` serves that export. Rebuilding the same source can change the JavaScript hashes, so check `dist/index.html` for the current file name after any rebuild. Vite's existing `base: "./"` makes asset references relative for static hosting, including gateway subpaths. Deliver `dist/index.html` and all of `dist/assets/`, `dist/favicon.svg` and `dist/og.png` together. The app uses one page, so it needs no server-side routing or backend.

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
| `web/src/styles.css` | Visual tokens, type scale and responsive layout |
| `web/src/config.ts`, `rpc.ts`, `chain.ts`, `poll.ts` | Existing chain configuration, reads, simulations, transactions and polling |
| `web/src/wagmi.ts`, `useWallet.ts`, `ConnectSheet.tsx`, `open-in.ts` | Existing wallet connections and sheet |
| `web/src/Miles.tsx`, `miles.ts`, `Samples.tsx`, `samples.ts` | Existing price/curve panel and sample cards |
| `dist/` | Finished static export |
| `DESIGN.md` | Implemented design system and responsive behavior |
| `VALIDATION.md` | Actual commands, interaction results, six-domain review and limitations |

## Validation

`npm --prefix web ci`, `npm --prefix web run typecheck` and `npm --prefix web run build` all exited 0 (Vite 5.4.11, 4,908 modules). Vite emptied `dist/` and wrote the new export, so the seven old hashed files are gone and every file left in `dist/assets/` is used. Only `web/src/App.tsx` and `web/src/styles.css` changed under `web/`.

I checked the rebuilt export in Playwright Chromium, served from a `/preview/` subpath, with live Sepolia and Squeekchain reads. **89 of 90 checks passed** in one run on this exact export.

At 375px:
- Logo, Connect, box content and footer text share the same edges (33px and 342px).
- The wheel shows Speed, Settled round and Chain block in one row.
- Sample cards titles are centered over their cards, and all 16 cards drew.
- Rarity odds has one row per run, with each percentage centered under its heading.
- There is no sideways scroll.

At 1280px the three top boxes are equal (381×215px) and the four odds columns are equal (147.4px).

At 390px the product and Connect are on the first screen, and the Connect sheet and the five Questions work from the keyboard.

**The one failed check is a small defect, left as is.** In the wrong-network state at 320 to 323px wide, the "Switch to Sepolia" button overlaps the end of the no-wrap brand line by up to 2.8px. It comes from the requested `.nowrap` edit, and the brief allowed no other change under `web/`. It does not happen from 324px up, or with Connect or a connected address at any checked width.

The Speed value wraps onto two lines at 320 and 960px, and at 360 and 1024px once the speed has two digits. The stats stay in one row.

The pinned taste probe passed **11 of 16 categories**, up from 10, because the type scale now passes with six sizes at 390px. Four flags are existing look choices that earlier briefs kept on purpose (contrast, casing, tracking, type-faces). The fifth is the existing 4px clip of the "Drawing…" placeholder at 320px, which shows only while art is loading or unreachable.

The commands, six-domain review and limitations are in [VALIDATION.md](VALIDATION.md).

No real wallet signing, mining, WebKit, screen reader, physical device or native browser zoom was tested. The wallet states were reached with a test provider in the page that signs nothing.
