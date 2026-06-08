# Deployment

This guide covers local verification, frontend deployment, agent deployment, and post-deploy checks.

## Prerequisites

- Node.js 22+
- npm 10+
- Python 3.11+
- Mantle Sepolia RPC access
- WalletConnect project ID for wallet UX
- Dedicated low-balance testnet key for agent testing

## Environment

Copy the template and fill in local values:

```bash
cp .env.example .env
```

Do not use production keys during development. Production signing should use a multisig, hardware wallet, or scoped policy signer.

## Frontend

```bash
cd frontend
npm ci
npm run lint -- --max-warnings=0
npx tsc --noEmit
npm run build
npm run dev
```

For Vercel or similar hosting:

1. Set the public frontend environment variables.
2. Build from the `frontend` directory.
3. Use `npm run build` as the build command.
4. Use `.next` as the output managed by Next.js.

## Contracts

```bash
cd contracts
npm ci
npm run compile
npm test
```

Verify the Mantle Sepolia registry source through Sourcify:

```bash
cd contracts
npm run compile
npm run verify:sourcify
```

The verification script submits the Solidity standard JSON input from Hardhat build info, the compiler version, the contract identifier, and the deployment transaction hash to Sourcify. Override the defaults with `REGISTRY_ADDRESS`, `CHAIN_ID`, `CREATION_TX_HASH`, or `CONTRACT_IDENTIFIER` if a new registry is deployed. The default contract identifier is `project/contracts/SentinelRegistry.sol:SentinelRegistry`, matching Hardhat 3 build info.

Deployments should be recorded with:

- network name
- contract address
- transaction hash
- deployer address
- source commit
- verification status

Current Mantle Sepolia registry:

| Field | Value |
| --- | --- |
| Network | Mantle Sepolia |
| Registry contract address | `0xea3C039795B5b04105B795c8B0cB85e0a42Cc85C` |
| Contract explorer | https://sepolia.mantlescan.xyz/address/0xea3C039795B5b04105B795c8B0cB85e0a42Cc85C#code |
| Deployment transaction | https://sepolia.mantlescan.xyz/tx/0x0dac721b1ed137bf93132222348aab39bae48ed3a6e8b8e6ed0d0ee9d91f2b07 |
| Deployer | `0x9f758be3ae3d985713964339e2f0bd783fc6015c` |
| Source verification | Verified on Mantlescan and Sourcify |

Current GenLayer StudioNet consensus guard:

| Field | Value |
| --- | --- |
| Network | GenLayer StudioNet |
| Consensus guard contract address | `0x86369EC44fbB5EB682729368557176858aBe0c73` |
| Deployment transaction | `0xec4e0f05378f1f9ebd0d3d47fc1b6ee815ff3b0a4cd271988f0c1d5ab3b9970a` |
| Deployer | `0x65567Bf52e47A20C10793748C36597fAC2E3056D` |
| Verification | `genlayer schema` and `genlayer call get_stats` succeeded on StudioNet |

## Agent

The agent uses Mantle RPC plus an LLM-assisted analysis client. Keep `SENTINEL_RESPONSE_MODE=manual` for reviewer walkthroughs and production pilots unless an explicit policy signer setup has been reviewed.

Relevant environment variables:

| Variable | Purpose |
| --- | --- |
| `MANTLE_RPC_URL` | Mantle RPC endpoint used by the sentinel scanner |
| `FRONTEND_API_BASE_URL` | Next.js API base used by the agent for logs, heartbeats, and sentinel lookup. Use `http://127.0.0.1:3000/api` locally or the hosted HTTPS origin plus `/api`. |
| `OPENAI_API_KEY` | API key for LLM-assisted exploit analysis |
| `OPENAI_BASE_URL` | Optional OpenAI-compatible provider endpoint |
| `LLM_MODEL` | Model used for analysis, default `gpt-4o-mini` |
| `SENTINEL_RESPONSE_MODE` | `manual` proposes actions, `autonomous` can broadcast scoped emergency actions |
| `PRIVATE_KEY` | Testnet-only agent signer for local execution |

```bash
cd agent
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m compileall -q .
python main.py
```

Production agents should run under systemd or another supervised process manager.

Example systemd shape:

```ini
[Unit]
Description=BreachResponse Sentinel Agent
After=network-online.target

[Service]
WorkingDirectory=/opt/breachresponse/agent
ExecStart=/opt/breachresponse/agent/.venv/bin/python main.py
Restart=always
RestartSec=5
EnvironmentFile=/opt/breachresponse/.env

[Install]
WantedBy=multi-user.target
```

## Post-deploy checks

- Frontend build succeeds.
- Command Center loads without console errors.
- Wallet connection handles disconnected, wrong-network, and connected states.
- Agent connects to Mantle RPC.
- Registry contract address matches the configured network.
- Incident response workflow displays the expected proposal and approval path.
- Logs do not expose secrets.
