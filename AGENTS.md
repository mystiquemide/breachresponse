# AGENT RULES & CONVENTIONS

## Stack
- Frontend: Next.js 14 (App Router), TailwindCSS, Wagmi, viem, RainbowKit.
- Backend/Agent: Python 3.11+, Web3.py, Byreal Skills CLI.
- Smart Contracts: Solidity 0.8.24, Hardhat or Foundry.

## Architectural Rules
1. **No generic AI wrappers**: The Python agent must interact with a real local blockchain fork.
2. **Web3 Strictness**: Handle all wallet states (disconnected, wrong network, pending, failed). Never expose private keys.
3. **Demo First**: The architecture must support a "Demo Mode" where the exploit script triggers instantly for judges.
