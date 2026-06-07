# BreachResponse Frontend

Next.js Command Center for BreachResponse, built for Mantle incident triage, sentinel registration, operator approval, and GenLayer consensus fallback.

This app is the operator surface for the repository. It connects the public landing page, dashboard, incident history, Mantle registry metadata, and GenLayer StudioNet escalation panel.

## Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Wagmi, Viem, and Ethers for wallet and contract interactions
- GenLayer JS for the consensus fallback panel

## Environment

Set these values before building or deploying:

```env
NEXT_PUBLIC_REGISTRY_ADDRESS=0xea3C039795B5b04105B795c8B0cB85e0a42Cc85C
NEXT_PUBLIC_MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
NEXT_PUBLIC_GENLAYER_CONSENSUS_GUARD_ADDRESS=0x86369EC44fbB5EB682729368557176858aBe0c73
NEXT_PUBLIC_GENLAYER_STUDIO_URL=https://studio.genlayer.com/api
MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
```

Use safe testnet values only. Do not put private keys, wallet seeds, production RPC credentials, or API secrets in frontend env files.

## Local development

```bash
npm ci
npm run lint -- --max-warnings=0
npx tsc --noEmit
npm run build
npm run dev
```

Open http://localhost:3000.

## Production run

```bash
npm ci
npm run build
npm run start -- --hostname 0.0.0.0 --port 8900
```

The current VPS deployment runs from this directory under `breachresponse-frontend.service` with the same public Mantle and GenLayer configuration.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Public product landing page |
| `/dashboard` | Operator Command Center, sentinel registration, live telemetry, and GenLayer fallback |
| `/history` | Incident and mitigation history |
| `/api/vault/status` | Mantle RPC-backed vault status probe |
| `/api/logs/stream` | Local server-sent event stream for sentinel logs |
| `/api/sentinels` | Sentinel registry API surface |

## Verification

Expected clean checks:

```bash
npm run lint -- --max-warnings=0
npx tsc --noEmit
npm run build
npm audit --audit-level=moderate
```

Browser smoke checks should cover:

- Landing page loads without console errors.
- `/dashboard` loads without console errors.
- GenLayer panel shows `CONTRACT LINKED` when the deployed guard address is configured.
- `Prepare GenLayer signer` creates a local browser signer and enables the escalation control.
- Wallet UX handles disconnected state cleanly.

## Safety posture

The UI should stay manual-first by default. Do not add unchecked autonomous execution, hidden signer behavior, or claims that a transaction executed unless the user approved it and the chain result is verified.
