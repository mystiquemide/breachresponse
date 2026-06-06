# TASK LIST: Sentinel.ax (BreachResponse)

| Task ID | Description | Complexity | Dependency | Status |
|---|---|---|---|---|
| T1 | Initialize project repo (Next.js, Tailwind, Hardhat/Foundry) | S | None | To Do |
| T2 | Set up `AGENTS.md`, `memory.md`, `.env.example` | S | T1 | To Do |
| T3 | Build local vulnerable Solidity contract (TargetVault.sol) | M | T1 | To Do |
| T4 | Build Byreal Skills CLI integration for AI agent | L | T1 | To Do |
| T5 | Build Python Mempool Anomaly Scanner (listen to local fork) | L | T3 | To Do |
| T6 | Develop Sentinel Agent logic (detect -> formulate tx) | L | T4, T5 | To Do |
| T7 | Develop Next.js Admin Dashboard UI (Landing & Dashboard) | M | T1 | To Do |
| T8 | Integrate WalletConnect / wagmi for multisig signer | M | T7 | To Do |
| T9 | Connect Sentinel Agent to Dashboard (Websockets/Polling) | M | T6, T7 | To Do |
| T10| Implement "God Mode" (Fully autonomous execution bypass) | M | T6 | To Do |
| T11| Write exploit script (attacker) to simulate the hack | M | T3 | To Do |
| T12| QA: Run full end-to-end exploit and defense simulation | L | All | To Do |
| T13| DevOps: Deploy contracts to Mantle Testnet | S | T12 | To Do |
| T14| DevOps: Deploy frontend to Vercel | S | T12 | To Do |
