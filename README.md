# 🛡️ Sentinel.ax: Active Defense for Mantle
> The active immune system for Mantle smart contracts. Detects reentrancy, flashes, and anomalies in the mempool, then formulates and executes 1-click rescue transactions before the exploit finalizes.

![Mantle](https://img.shields.io/badge/Network-Mantle_Sepolia-black?style=for-the-badge&logo=mantle)
![Next.js](https://img.shields.io/badge/Frontend-Next.js_14-black?style=for-the-badge&logo=next.js)
![Python](https://img.shields.io/badge/Agent-Python_3.10-black?style=for-the-badge&logo=python)
![Solidity](https://img.shields.io/badge/Smart_Contracts-Solidity_0.8.24-black?style=for-the-badge&logo=solidity)

## ⚡ The Problem & Solution
Smart contract exploits cost the Web3 ecosystem billions annually. Most protocols rely on reactive measures—audits (which catch bugs *before* deployment) and insurance (which pays out *after* the hack). 

**Sentinel.ax provides an active defense layer.** 
By acting as an intelligent watchdog over your deployed Vaults, Sentinel.ax scans live blocks and mempools. When an anomaly is detected (like a malicious Reentrancy loop), the Python AI Agent instantly formulates a defensive payload and broadcasts a `pause()` transaction to the Mantle network, locking the vault and saving user funds before the attacker can drain them.

## 🏗️ Live Deployments (Mantle Sepolia)
- **SentinelRegistry:** `0xea3C039795B5b04105B795c8B0cB85e0a42Cc85C`
- **TargetVault (Vulnerable Demo):** `0x596Ff2Ca0f781a2CED29EC685cD1ba038378dE02`

## 🧠 Architecture Overview
1. **The Python Sentinel Agent**: Runs off-chain, listening to Mantle Sepolia blocks and simulating pending mempool transactions. It evaluates transaction calldata for malicious intent using heuristic and LLM analysis.
2. **The Target Vault & Registry**: The `TargetVault` contains a deliberate vulnerability, but implements an `onlySentinelOrOwner` pause mechanism. It is registered on the `SentinelRegistry`.
3. **The Next.js Command Center**: A stunning, real-time dashboard that visualizes the Agent's telemetry via Server-Sent Events (SSE) and allows developers to manage their registered protocols.

## 🚀 Quick Start (Demo the Attack Simulator!)

### 1. Setup & Install
```bash
git clone https://github.com/yourusername/sentinel.ax.git
cd sentinel.ax

# Install Frontend
cd frontend && npm install

# Install Contracts
cd ../contracts && npm install

# Install Python Agent
cd ../agent
python -m venv venv
source venv/Scripts/activate # Windows
pip install -r requirements.txt
```

### 2. Run the Command Center & Agent
In Terminal 1 (Frontend):
```bash
cd frontend
npm run dev
```
In Terminal 2 (Python Agent):
```bash
cd agent
python main.py
```

### 3. Trigger the On-Chain Attack!
Watch the magic happen. In Terminal 3, run the exploit simulator script. This script deploys a malicious contract and attempts a Reentrancy attack against the live Vault.
```bash
cd contracts
npx hardhat run scripts/simulateAttack.ts --network mantle_sepolia
```
**Look at the Dashboard and the Python terminal:** The agent will catch the `withdraw()` loop, calculate a 98% threat confidence, and execute an emergency `pause()` transaction directly to Mantle Sepolia, mitigating the threat.

---
*Built with ❤️ for the Mantle Ecosystem.*
