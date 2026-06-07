# Product Requirements

## Objective

BreachResponse gives protocol operators a real-time incident response console for Mantle smart contracts. It detects exploit patterns, explains the threat, and routes a scoped defense action through human approval or predefined policy controls.

## Primary users

- Protocol founders and security leads
- On-chain operations teams
- Multisig signers
- Security partners monitoring protocol health

## Core requirements

1. Monitor Mantle network activity and sentinel telemetry.
2. Detect suspicious patterns that resemble exploit setup or active exploitation.
3. Display clear incident context in the Command Center.
4. Prepare a proposed response transaction with target, selector, value, and risk notes.
5. Default to human approval before execution.
6. Support scoped autonomous policies for emergency pause and quarantine actions only.
7. Record response status for post-incident review.

## Non-goals

- Custody of protocol treasury funds.
- Unbounded autonomous wallet control.
- Production execution without allowlists, value caps, and operator override.

## Success metrics

| Metric | Target |
| --- | --- |
| Frontend build reliability | CI passes on every PR |
| Contract safety simulation | Exploit and mitigation tests pass |
| Agent readiness | Python dependency install and syntax check pass |
| Operator clarity | Incident card explains threat, target, and action |
| Deployment readiness | Mantle env and registry setup documented |

## Roadmap alignment

The product should move from reliable operator demo to production pilot, then to multi-protocol monitoring and formal response policy controls.
