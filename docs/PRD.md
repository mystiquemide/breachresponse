# Product Requirements Document: Sentinel.ax (BreachResponse)

## Overview
Sentinel.ax is an on-chain anomaly detection and active-defense agent built primarily for the Mantle Network, with cross-chain monitoring capabilities. It uses the Byreal Skills CLI to automatically detect malicious smart money flow targeting a smart contract. It can formulate a 1-click rescue transaction routed to a developer's multisig, OR operate in a "Fully Autonomous" mode where it executes the defense instantly to save funds without human delay.

## User Roles
1. **Developer / Protocol Admin**: The human in the loop who configures the agent, receives alerts, and approves rescue transactions (in manual mode).
2. **Sentinel Agent**: The AI agent continuously monitoring the mempool across multiple chains and interacting with the Byreal Skills CLI to execute defense mechanisms.

## Core Features
1. **Cross-Chain Mempool Anomaly Detection**: Agent monitors testnet/mainnet transactions on Mantle and other EVM chains for known exploit signatures or massive sudden outflows.
2. **Automated Transaction Formulation**: Agent formulates a `pause()` or fund-recovery transaction using Byreal Skills.
3. **1-Click Human Approval (Manual Mode)**: Agent routes the transaction to the protocol's multisig. Human receives a notification with an AI-generated explanation of the attack and clicks "Approve".
4. **Fully Autonomous Execution (God Mode)**: For hyper-critical contracts, the agent is granted permissioned execution rights to bypass the multisig and immediately pause the contract if an exploit threshold is crossed.
5. **Live Attack Dashboard**: A dashboard showing the incoming attack, the agent's detection timeline, and the defense transaction status.

## User Stories
- As an Admin, I want to receive an immediate push/UI notification when my protocol is under attack, so I can react before the funds are drained.
- As an Admin, I want the AI to explain the attack in plain English, so I don't waste time deciphering bytecode during an emergency.
- As an Admin, I want to configure specific contracts for "God Mode", allowing the AI to autonomously pause them during a confirmed attack, minimizing response time to zero.
- As the Sentinel Agent, I want to monitor cross-chain mempools so I can protect protocols deployed on Mantle and other networks simultaneously.

## Acceptance Criteria
1. Agent successfully detects a simulated reentrancy or flash-loan attack on a local Mantle fork.
2. Agent formulates a valid transaction payload and optionally executes it autonomously.
3. UI dashboard updates in real-time showing the attack vector and the agent's response.
4. Admin can click "Approve" in the UI for manual-mode defenses, and the transaction executes successfully.
5. Agent can ingest mempool data from at least two different EVM networks.

## RICE-Scored Backlog
| Feature | Reach | Impact | Confidence | Effort | Score |
|---|---|---|---|---|---|
| Fully Autonomous Execution (God Mode) | 10 | 10 | 8 | 7 | 114 |
| Cross-Chain Mempool Monitoring | 8 | 9 | 7 | 6 | 84 |
| Live Attack Dashboard UI | 10 | 10 | 9 | 5 | 180 |
| Byreal Skills Tx Formulation | 10 | 9 | 8 | 4 | 180 |
| Local Fork Exploit Simulation | 10 | 10 | 7 | 6 | 116 |

## KPIs
- Time from attack detection to transaction execution (< 2 seconds in autonomous mode).
- Transaction success rate upon human approval or autonomous execution (100%).
- Dashboard rendering latency.

## Out-of-Scope
- None. (Maxed out feature set for Hackathon).
