# BreachResponse
The active immune system for Mantle smart contracts.

BreachResponse is an on-chain anomaly detection and active-defense agent. It uses the Byreal Skills CLI to monitor mempools for malicious smart money flow and formulates 1-click rescue transactions routed to a developer's multisig.

## Architecture
- **Agent**: Python-based mempool scanner that detects exploits and uses Byreal to formulate defenses.
- **Frontend**: Next.js 14 command center for human-in-the-loop transaction approval.
- **Contracts**: Hardhat environment for deploying the target vulnerable vault and simulating exploits.

## Quick Start

### 1. Start Local Blockchain & Deploy Contracts
```bash
cd contracts
npm install
npx hardhat node
# In a new terminal:
npx hardhat run scripts/deploy.ts --network localhost
```

### 2. Start Sentinel Agent
```bash
cd agent
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
python main.py
```

### 3. Start Frontend Command Center
```bash
cd frontend
npm install
npm run dev
```
