# BreachResponse (Sentinel.ax)

> Proactive smart contract immune system powered by Web3.py and OpenAI GPT-5.5.

![Mantle Sepolia](https://img.shields.io/badge/Mantle-Sepolia_Testnet-10B981?style=flat-square&logo=ethereum)
![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python)
![OpenAI](https://img.shields.io/badge/AI-GPT--5.5-412991?style=flat-square&logo=openai)
![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)

BreachResponse is an active-defense system built for the Mantle ecosystem. Instead of simply alerting you after your funds are stolen, BreachResponse scans the mempool, detects malicious transactions using OpenAI GPT-5.5, and automatically formulates and executes an emergency pause transaction to your smart contract before the attacker's block is confirmed.

## Features

- **Mempool Scanning**: Deep inspection of unconfirmed transactions on the Mantle Sepolia network.
- **AI Payload Formulation**: Uses GPT-5.5 to dynamically analyze exploit signatures and formulate rescue payload calldata.
- **1-Click Defense**: A premium Command Center UI that allows you to review the AI's analysis and execute a defensive transaction directly to your multisig or admin wallet using Wagmi.
- **God Mode**: Fully autonomous execution for sub-second defense without human-in-the-loop delay.
- **Mantle Registry**: Operates as a multi-tenant platform via `SentinelRegistry.sol` deployed on Mantle Sepolia.

## Tech Stack

- **Frontend**: Next.js (App Router), TailwindCSS, Framer Motion, Wagmi, Viem.
- **Backend / Agent**: Python, Web3.py, OpenAI SDK.
- **Smart Contracts**: Solidity, Hardhat.

## Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/mystiquemide/breachresponse.git
cd breachresponse
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Agent Setup
```bash
cd agent
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Environment Variables
Copy `.env.example` to `.env` in the root directory and fill in your keys:
```bash
cp .env.example .env
```
Ensure you have your `OPENAI_API_KEY`, `PRIVATE_KEY`, and `NEXT_PUBLIC_WALLETCONNECT_ID` set.

### 5. Run the Sentinel
```bash
cd agent
python main.py
```

## Repository Layout
- `/frontend`: The Next.js Command Center dashboard.
- `/agent`: The Python Sentinel logic for mempool scanning and AI evaluation.
- `/contracts`: The Solidity registry and mock target vaults for simulation.
- `/docs`: Architecture, deployment, and product specs.

## Documentation
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Architecture & Design](./docs/ARCHITECTURE.md)
- [Security Policy](./SECURITY.md)
- [Contributing](./CONTRIBUTING.md)

## License
MIT License. See `LICENSE` for details.
