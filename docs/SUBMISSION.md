# BreachResponse - Hackathon Submission

## Track

**AI DevTools** - Mantle-specific smart contract audit assistant and runtime security tooling

---

## Project Name

BreachResponse

## Tagline

Post-deployment audit assistant and runtime security console for Mantle smart contracts.

---

## Problem

Mantle developers ship contracts and then have no ongoing security visibility. The gap between "deployed" and "exploited" is wide and dark.

Static audit firms review code once, pre-deployment. After that, protocol teams are flying blind. When something breaks on Mantle - a reentrancy attack, a flash loan drain, unusual call sequences - developers find out from block explorer transactions or worse, from users. There's no tool that continuously audits deployed contracts, classifies active threats with AI, and presents structured response options before damage spreads.

Current options are generic alerting bots with no intelligence, post-mortem tools that only help after the loss, or manual block explorer monitoring. None of them close the loop from detection to approved response in a single developer workflow.

---

## Solution

BreachResponse is the security layer between deployed and hacked. It combines an on-demand contract audit assistant with live runtime monitoring, giving Mantle developers both pre-incident visibility and structured incident response.

The system has a deliberate separation of concerns that maps directly to the Turing Test hackathon's Human vs. AI dynamic:

- **Audit** - Developer pastes any Mantle contract address. BreachResponse fetches verified Solidity source (via Sourcify) or bytecode, runs AI-powered security analysis, and returns a structured audit: risk score, vulnerability classes, dangerous opcode detection, gas optimization flags, and actionable recommendations.
- **Detect** - Python sentinel agent scans Mantle RPC telemetry and monitors registered protocol addresses for anomalous patterns.
- **Analyze** - AI classifies threat type, confidence, and recommended response calldata. Gas anomaly detection flags transactions consuming abnormally high gas relative to the operation type.
- **Validate (Human vs. AI)** - Ambiguous or low-confidence incidents route through GenLayer StudioNet for external validator consensus before reaching the operator. AI proposes. Validators verify. Human decides.
- **Approve** - Human operator reviews the full incident context: AI analysis, GenLayer consensus result, gas anomaly data, and proposed response. The operator approves or rejects. AI cannot execute without this gate.
- **Execute** - Approved response transaction goes to Mantle. The registry records the event for audit trail review.

This is the Turing Test dynamic made concrete: AI generates the assessment, human holds the execution key.

---

## How It Works

### Contract Audit Assistant

Any Mantle Sepolia contract can be scanned on-demand. BreachResponse first attempts to fetch verified Solidity source from Sourcify. If source is available, the AI analyzes actual contract logic. If not, bytecode is analyzed: dangerous opcode detection (SELFDESTRUCT, DELEGATECALL, CREATE, CREATE2), function selector extraction, and pattern matching. Analysis runs via Groq LLM and returns a risk score (0-100), vulnerability list with severity ratings, gas optimization flags, and developer recommendations.

### Gas Analysis

Two layers of gas intelligence. The gas estimator endpoint accepts any contract address and calldata, runs `eth_estimateGas` against Mantle Sepolia RPC, fetches the current gas price, and returns an AI-generated optimization report with potential savings. The incident analyzer additionally surfaces gas anomaly detection during active threats: gas consumption significantly above the baseline for a given operation type is a reliable exploit signature.

### Runtime Monitoring

The Python sentinel agent connects to Mantle Sepolia RPC and monitors registered protocol addresses. It detects repeated event patterns, unusual call sequences, and known exploit setups. Live telemetry streams into the Command Center terminal in real time.

### AI Analysis

Suspicious activity is submitted to the AI analysis layer as structured incident context. The model returns a JSON verdict:

```json
{
  "is_exploit": true,
  "confidence_score": 0.98,
  "exploit_type": "Reentrancy",
  "recommended_calldata": "0x8456cb59",
  "gasUsed": 187420,
  "expectedGas": 45000,
  "gasAnomalyFactor": 4.2
}
```

High-confidence incidents go straight to human approval. Low-confidence or ambiguous ones route to GenLayer first.

### GenLayer Consensus Guard

BreachResponse submits Mantle incident context to a GenLayer intelligent contract on StudioNet. GenLayer validators run consensus on the classification and return a decision. The Command Center uses the consensus result as a gate before presenting a Mantle-side action to the operator.

Normal users and protocol operators keep their wallet on Mantle throughout. The GenLayer signer is app-managed infrastructure, not a second wallet the user has to configure.

### Mantle Execution

The on-chain registry contract (`0xea3C039795B5b04105B795c8B0cB85e0a42Cc85C`) lives on Mantle Sepolia. It tracks registered sentinels, protected protocols, and authorized response paths. All emergency response transactions execute on Mantle after operator approval.

---

## AI Infrastructure

| Role | Provider |
| --- | --- |
| Contract audit analysis | Groq (llama-3.1-8b-instant) |
| Incident threat classification | Groq (llama-3.3-70b-versatile) |
| Gas optimization suggestions | Groq (llama-3.1-8b-instant) |

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 14, Tailwind CSS, shadcn/ui |
| Wallet | RainbowKit, Wagmi, Viem |
| Monitoring | Python (Web3.py), Mantle Sepolia RPC |
| AI - Audit & Gas | Groq (llama-3.1-8b-instant) |
| AI - Incident Analysis | Groq (llama-3.3-70b-versatile) |
| Source Verification | Sourcify (chainid 5003) |
| Consensus Guard | GenLayer StudioNet intelligent contract |
| Contracts | Solidity, Hardhat, Ethers.js |
| Deployment | Railway (backend + worker), Vercel (frontend) |
| CI | GitHub Actions (lint, typecheck, build, contract tests, audit) |

---

## Contract Deployments

| Field | Value |
| --- | --- |
| Network | Mantle Sepolia |
| Registry contract | `0xea3C039795B5b04105B795c8B0cB85e0a42Cc85C` |
| Explorer | https://sepolia.mantlescan.xyz/address/0xea3C039795B5b04105B795c8B0cB85e0a42Cc85C#code |
| Deployment tx | https://sepolia.mantlescan.xyz/tx/0x0dac721b1ed137bf93132222348aab39bae48ed3a6e8b8e6ed0d0ee9d91f2b07 |
| Verified source | Verified on Mantlescan and Sourcify |

---

## Links

- **Live demo:** https://breachresponse.xyz
- **GitHub:** https://github.com/mystiquemide/breachresponse
- **Demo video:** [add before submission]

---

## Judging Criteria Alignment

### Innovation

BreachResponse is the first Mantle-native tool that combines on-demand contract audit with live runtime monitoring and AI-assisted incident response in a single operator workflow. The Human vs. AI execution gate - where AI proposes, GenLayer validators verify, and the human approves - is a direct implementation of the Turing Test hackathon's core theme. AI can assess but cannot act alone. The operator is always the final execution gate.

### Technical Execution

- Working Next.js frontend with real wallet integration on Mantle Sepolia.
- Contract audit scanner: Sourcify source fetch, bytecode analysis, dangerous opcode detection, Groq LLM analysis.
- Gas estimator: `eth_estimateGas` against Mantle RPC, current gas price, AI optimization report.
- Python sentinel agent with live Mantle RPC telemetry.
- Real AI incident classification with gas anomaly detection.
- GenLayer validators panel with consensus guard integration.
- Deployed and verified Solidity registry on Mantle Sepolia.
- Full CI pipeline covering frontend lint/typecheck/build, contract compile/test/audit, and agent syntax check.

### Mantle Ecosystem Fit

BreachResponse is built specifically for Mantle. The registry is deployed on Mantle Sepolia, wallet UX targets Mantle network, the monitoring stack reads from the Mantle RPC, and the gas estimator calls `eth_estimateGas` against Mantle Sepolia directly. This is not a chain-agnostic tool with Mantle config. It is Mantle developer security infrastructure.

### Business Potential

Every protocol deploying serious capital on Mantle is a potential customer. The audit scanner alone is useful to any Mantle developer before and after deployment. Insurance partners, audit firms, and security DAOs are adjacent partners. The roadmap moves from single-operator console to multi-protocol monitoring platform with enterprise dashboards, audit trails, and formal response policy controls.

### Completion and Deployment

- Frontend deployed and live at breachresponse.xyz.
- Contract deployed and verified on Mantle Sepolia.
- Agent deployed as Railway worker.
- All CI checks green.
- Full demo walkthrough documented in the review workflow.

---

## Demo Walkthrough

1. Open https://breachresponse.xyz and scroll to **Features** - lands on the Pipeline Execution section showing the audit, monitor, detect, propose, approve, execute flow.
2. Click **Enter Command Center**. The operator dashboard opens showing live Mantle metrics: Blocks Scanned, Active Sentinels, Value Monitored, Response Proposals.
3. Use the **Contract Audit Scanner** - paste any Mantle Sepolia contract address and click Scan. No wallet required. Results show risk score, vulnerabilities, gas flags, and AI recommendations powered by Groq.
4. Use the **Gas Estimator** - paste a contract address and function calldata to get `eth_estimateGas` results from Mantle Sepolia with AI optimization suggestions.
5. Connect a Mantle Sepolia wallet. Guard actions unlock. The Register Sentinel form accepts a contract address and sentinel name.
6. Register a sentinel. The on-chain transaction goes to the Mantle registry. Confirmation and history update.
7. The **GenLayer Consensus Guard** section shows the validator panel and allowlisted actions. Clicking an action moves it through selected and queued states.
8. Trigger an attack simulation. AI analysis returns a real structured verdict with exploit type, confidence score, gas anomaly data, and recommended calldata.
9. Disconnect. Dashboard returns to safe read-only state. Guard actions disable.
10. Use **Threat History** to view past incidents and post-incident records.

---

## What's Next

- Incident replay from historical Mantle transactions.
- Multisig routing for response approvals.
- Multi-protocol onboarding dashboard.
- Risk scoring reports for insurance partners.
- Formal verification for response payload constraints.

---

## Team

Built by MystiqueMide for the Mantle Turing Test Hackathon 2026.
