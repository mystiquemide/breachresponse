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
- Python monitoring agent for Mantle RPC scanning, LLM-assisted incident analysis, and alert forwarding.
- Solidity simulation contracts that prove the vulnerable path and the paused defense path.
- Safe environment templates with no committed keys or production secrets.
- CI checks covering frontend, contracts, agent syntax, and dependency audits.

## AI incident analysis

BreachResponse uses an LLM-assisted analysis layer to convert suspicious Mantle activity into structured incident reports and response proposals. The model classifies the likely exploit, assigns confidence, recommends scoped calldata, and passes the result into the operator approval path.

The LLM does not get unchecked execution authority. Human approval is the default response mode, and autonomous policies should only be enabled for allowlisted contracts, capped actions, emergency selectors, and monitored thresholds.

See [AI Incident Analysis](./docs/AI_INCIDENT_ANALYSIS.md) for the model input/output shape and safety model.

## GenLayer consensus fallback

BreachResponse includes a GenLayer intelligent contract fallback for cases where the fast LLM path is unavailable, malformed, low-confidence, conflicting, or recommends a risky emergency action. Judges and reviewers can inspect it directly here:

| File | Purpose |
| --- | --- |
| [`contracts/genlayer/IncidentConsensusGuard.py`](./contracts/genlayer/IncidentConsensusGuard.py) | GenLayer intelligent contract that stores incidents, calls validator-side LLM reasoning, enforces the emergency-action allowlist, and records consensus decisions. |
| [`tests/direct/test_incident_consensus_guard.py`](./tests/direct/test_incident_consensus_guard.py) | Direct-mode GenLayer tests for approval, rejection, low-confidence escalation, malformed validator output, unsafe action rejection, duplicate incidents, and execution marking. |
| [`frontend/src/lib/genlayerConsensus.ts`](./frontend/src/lib/genlayerConsensus.ts) | Real `genlayer-js` read/write integration used by the Command Center fallback panel. |
| [`frontend/src/app/dashboard/page.tsx`](./frontend/src/app/dashboard/page.tsx) | Operator UI panel for preparing the local GenLayer signer, reading consensus records, and escalating incidents once a deployed guard address is configured. |

The contract uses GenLayer nondeterminism and validator consensus through `gl.nondet.exec_prompt(...)` and `gl.vm.run_nondet_unsafe(...)`. It is not a getter/setter demo. It only approves scoped emergency actions such as `pause_protocol`, `quarantine_address`, `recommend_multisig`, `reject_incident`, and `require_human_approval`.

Validate it with:

```bash
genvm-lint check contracts/genlayer/IncidentConsensusGuard.py --json
python -m pytest tests/direct/test_incident_consensus_guard.py -q
```

To enable live frontend escalation after deployment, set:

```bash
NEXT_PUBLIC_GENLAYER_CONSENSUS_GUARD_ADDRESS=<deployed GenLayer contract address>
NEXT_PUBLIC_GENLAYER_STUDIO_URL=https://studio.genlayer.com/api
```

## Mantle Sepolia deployment

The current SentinelRegistry deployment used by the frontend is:

| Field | Value |
| --- | --- |
| Network | Mantle Sepolia |
| Registry contract address | `0xea3C039795B5b04105B795c8B0cB85e0a42Cc85C` |
| Explorer | https://sepolia.mantlescan.xyz/address/0xea3C039795B5b04105B795c8B0cB85e0a42Cc85C#code |
| Deployment transaction | https://sepolia.mantlescan.xyz/tx/0x0dac721b1ed137bf93132222348aab39bae48ed3a6e8b8e6ed0d0ee9d91f2b07 |
| Deployer | `0x9f758be3ae3d985713964339e2f0bd783fc6015c` |
| Source verification | Verified on Mantlescan and Sourcify |

## Product screens

| Command Center | Mobile overview |
| --- | --- |
| ![Dashboard](./docs/assets/product-screen-dashboard.png) | ![Mobile overview](./docs/assets/product-screen-mobile.png) |

## Architecture

```text
Mantle RPC / protocol telemetry
          |
          v
Python sentinel agent -> LLM incident analysis -> response proposal
          |                         |                  |
          v                         v                  v
Next.js Command Center <------ safety checks <---- operator approval
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

GenLayer fallback checks:

```bash
genvm-lint check contracts/genlayer/IncidentConsensusGuard.py --json
python -m pytest tests/direct/test_incident_consensus_guard.py -q
```

## Repository layout

```text
agent/                Python monitoring and payload formulation agent
contracts/            Solidity registry, target vault, attacker simulation, tests
contracts/genlayer/   GenLayer intelligent contract fallback for consensus incident review
frontend/             Next.js Command Center and API routes
tests/direct/         GenLayer direct-mode tests
docs/                 Architecture, threat model, deployment, runbooks, roadmap
.github/              CI, CodeQL, Dependabot, issue templates, PR template
```

## Production posture

BreachResponse is designed for controlled deployment. Human approval is the default response mode. Autonomous execution should only be enabled for scoped contracts, capped actions, allowlisted payloads, emergency pause functions, and monitored policy thresholds.

See [Threat Model](./docs/THREAT_MODEL.md), [Operator Runbook](./docs/OPERATOR_RUNBOOK.md), and [Deployment](./docs/DEPLOYMENT.md).

## License

MIT. See [LICENSE](./LICENSE).
