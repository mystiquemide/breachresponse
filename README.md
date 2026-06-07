# BreachResponse

Autonomous incident response infrastructure for Mantle smart contracts.

![Mantle Sepolia](https://img.shields.io/badge/Mantle-Sepolia_Testnet-10B981?style=flat-square&logo=ethereum)
![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python)
![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?style=flat-square&logo=solidity)
![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)

BreachResponse helps protocol operators detect exploit patterns, simulate blast radius, and route emergency defense actions before damage spreads. The platform combines a Mantle-aware monitoring agent, Solidity defense contracts, and a Command Center UI for human-approved or policy-approved response.

![BreachResponse Command Center](./docs/assets/hero.png)

## Why it matters

Smart contract teams usually learn about an exploit after funds move. BreachResponse is built around the opposite operating model:

1. Monitor Mantle activity and sentinel telemetry.
2. Detect suspicious transaction patterns and protocol anomalies.
3. Explain the incident in operator language.
4. Prepare a pause, quarantine, or rescue transaction.
5. Route the action to a wallet, multisig, or approved autonomous policy.
6. Record the response for post-incident review.

## Core capabilities

- Mantle sentinel registry for protocol onboarding and agent permissions.
- Next.js Command Center for incident triage, defense approval, and live telemetry.
- Python monitoring agent for Mantle RPC scanning and alert forwarding.
- Solidity simulation contracts that prove the vulnerable path and the paused defense path.
- Safe environment templates with no committed keys or production secrets.
- CI checks covering frontend, contracts, agent syntax, and dependency audits.

## Product screens

| Command Center | Mobile overview |
| --- | --- |
| ![Dashboard](./docs/assets/product-screen-dashboard.png) | ![Mobile overview](./docs/assets/product-screen-mobile.png) |

## Architecture

```text
Mantle RPC / protocol telemetry
          |
          v
Python sentinel agent -> exploit classifier -> proposed defense payload
          |                                      |
          v                                      v
Next.js Command Center <------------------ operator approval
          |
          v
Mantle registry + protected protocol contracts
```

See [Architecture](./docs/ARCHITECTURE.md) for the full system design.

## Quick start

### Prerequisites

- Node.js 22+
- Python 3.11+
- npm 10+
- Mantle Sepolia RPC access

### Clone

```bash
git clone https://github.com/mystiquemide/breachresponse.git
cd breachresponse
cp .env.example .env
```

Fill `.env` with your own local or testnet values. Never use production private keys while testing.

### Frontend

```bash
cd frontend
npm ci
npm run lint -- --max-warnings=0
npx tsc --noEmit
npm run build
npm run dev
```

Open http://localhost:3000.

### Contracts

```bash
cd contracts
npm ci
npm run compile
npm test
```

The contract tests cover both sides of the incident model:

- the vulnerable vault path can be drained when unprotected
- the same attack reverts when the sentinel pauses the vault

### Agent

```bash
cd agent
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m compileall -q .
python main.py
```

## Verification commands

Run these before opening a PR:

```bash
cd frontend
npm ci
npm run lint -- --max-warnings=0
npx tsc --noEmit
npm run build
npm audit --audit-level=moderate

cd ../contracts
npm ci
npm run compile
npm test
npm audit --audit-level=moderate

cd ../agent
python -m compileall -q .
```

## Repository layout

```text
agent/       Python monitoring and payload formulation agent
contracts/   Solidity registry, target vault, attacker simulation, tests
frontend/    Next.js Command Center and API routes
docs/        Architecture, threat model, deployment, runbooks, roadmap
.github/     CI, CodeQL, Dependabot, issue templates, PR template
```

## Production posture

BreachResponse is designed for controlled deployment. Human approval is the default response mode. Autonomous execution should only be enabled for scoped contracts, capped actions, allowlisted payloads, emergency pause functions, and monitored policy thresholds.

See [Threat Model](./docs/THREAT_MODEL.md), [Operator Runbook](./docs/OPERATOR_RUNBOOK.md), and [Deployment](./docs/DEPLOYMENT.md).

## License

MIT. See [LICENSE](./LICENSE).
