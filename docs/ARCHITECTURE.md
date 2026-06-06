# ARCHITECTURE: Sentinel.ax

## Overview
Sentinel.ax uses a Python-based anomaly detection agent to scan the Mantle mempool. Upon detecting an exploit, it utilizes Byreal Skills CLI to formulate a defense payload, which is pushed to a Next.js frontend for human approval via a Web3 wallet (wagmi).

## Folder Structure
```
breachresponse/
├── agent/            # Python agent, Byreal CLI integration, Mempool scanner
├── contracts/        # Solidity (Hardhat/Foundry) - Target Vault & Attacker
├── frontend/         # Next.js 14 App Router, Tailwind, Wagmi
├── docs/             # PRD, TASKS, ARCHITECTURE, DESIGN, ANALYTICS, BRANDING
├── memory.md         # Persistent context file
└── AGENTS.md         # AI coding conventions
```

## Database Schema / State
- **No external persistent database required.**
- Agent state is in-memory (or local SQLite) for tracking mempool spikes.
- Frontend uses React Context / Zustand for UI state and `wagmi` for blockchain state.

## API Contracts
- `POST /api/alert`: Agent sends detected anomaly payload to the frontend.
  - Body: `{ txHash, severity, description, proposedRescueTx: { to, data, value } }`
- Byreal CLI: Executed locally by the agent to translate "Pause the contract" into `0x8456cb59`.

## Architectural Decision Records (ADRs)
1. **ADR 1: Python for Agent**. Python is standard for data science / mempool scanning (Web3.py).
2. **ADR 2: Next.js + Wagmi for Frontend**. Industry standard for fast, reliable Web3 UIs.
3. **ADR 3: Byreal Skills CLI for Formulation**. Hackathon requirement/bonus points. Agent does not hold private keys; it only outputs raw calldata for the human to sign.
