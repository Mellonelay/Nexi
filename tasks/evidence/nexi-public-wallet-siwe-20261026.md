# Public MetaMask SIWE browser authentication — 2026-10-26

## Scope and identity

Fresh browser verification of the Public wallet connection and SIWE login at `https://www.nexitrading.app/dashboard/wallet`, using the owner's existing Chrome profile and selected Account 1. This proves the authentication path and read-only wallet page requests only. It is not a financial acceptance or full wallet-flow result.

The source checkout was `main@56da6ce67d7f53410fae9d66d777967793b94fc3`, equal to `origin/main` at the live check. Existing dirty files were preserved. The browser result is tied to the observed production URL; this check did not independently read the deployed release marker.

## Observed flow

- The page initially showed a connected account and the current session was authenticated, despite the owner reporting that they had signed out. The app's **Disconnect wallet** control was used to perform the intended logout; the browser recorded `POST /auth/logout` 201 and the wallet chooser appeared.
- The NEXI chooser offered MetaMask. MetaMask's connection request identified `www.nexitrading.app` and Account 1. The connection permissions covered viewing the selected account/address/balance/activity and allowing the site to request transactions; MetaMask stated it could not move funds without separate permission. The site connection was approved.
- MetaMask then presented a distinct **Sign-in request**: request origin `www.nexitrading.app`, URL `https://www.nexitrading.app`, Account 1, Ethereum Mainnet, chain ID 1, statement “Sign in to NEXI.”, a fresh 32-character nonce, current issued-at time, and “Estimated changes: No changes.” The masked wallet address matched the previously observed `0x339a…8b33` account. The signature was confirmed as an off-chain authentication step; no transaction, gas payment, token approval, transfer, order, or other financial action was submitted.
- The active browser tools exposed the MetaMask side panel as a tab. `mcp__playwright__browser_tabs` listed and selected that extension tab; `mcp__playwright__browser_snapshot` exposed the request details; the fresh snapshot's **Connect** and **Confirm** controls were used. Chrome DevTools remained the application page diagnostics route.
- The MetaMask structured accessibility snapshot did not display an expiration field. The current Backend source contract is stronger evidence for the signed challenge content: `backend/src/auth/wallet-auth.service.ts` builds the SIWE message with an `Expiration Time` (lines 43–45, 67–76), stores the challenge with a TTL, and requires the message's expiry to match the stored record and remain in the future before consuming the nonce (lines 79–96). This matches EIP-4361, where expiration is optional in the general message format; NEXI currently includes and enforces it. The successful verification response confirms this submitted challenge was accepted. See [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361).

## Browser proof

At a 440×956 CSS viewport, the observed production network sequence was:

| Request | Result |
| --- | --- |
| `POST /auth/wallet/challenge` | 201 Created |
| `POST /auth/wallet/verify` | 201 Created |
| `GET /auth/me` | 200 OK |
| `GET /wallet/overview` | 200 OK |
| `GET /wallet/activity` | 200 OK |

The Public Wallet page rendered with the shortened Account 1 button `0x339a…8b33`, wallet sections, and activity state. No response bodies, balances, tokens, cookies, signatures, full address, private keys, or seed phrases were copied into the receipt. The browser reported zero errors and six warnings; the warnings were not individually triaged in this authentication check.

## Limits

- No source or production application configuration was changed; no test suite was run for this browser-only check.
- Only the selected MetaMask Account 1 on Ethereum Mainnet was exercised. Other providers, accounts, networks, rejection/retry, and economic wallet actions remain outside this proof.
- This proves the observed connection, SIWE verification, authenticated identity read, and two wallet read requests. It does not prove financial correctness, Ledger invariants, transaction behavior, broader Public acceptance, or owner acceptance.
