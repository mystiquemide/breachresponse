# Agent Rules and Conventions

## Stack

- Frontend: Next.js App Router, Tailwind CSS, Wagmi, Viem, RainbowKit.
- Backend/agent: Python 3.11+, Web3.py, AI-assisted incident analysis.
- Smart contracts: Solidity 0.8.24 and Hardhat.

## Architectural rules

1. The Python agent must interact with real local or testnet blockchain data when validating response flows.
2. Wallet UX must handle disconnected, wrong-network, pending, failed, and confirmed states.
3. Never expose private keys, wallet seeds, API keys, or production RPC credentials.
4. Human approval is the default response mode.
5. Autonomous response paths must be scoped to allowlisted contracts, function selectors, value caps, and emergency actions.
6. Public docs should read like serious product infrastructure, not temporary event collateral.
