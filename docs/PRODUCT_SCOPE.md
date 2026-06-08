# Product Scope

## Primary product lane

BreachResponse is Mantle-specific security infrastructure for protocol teams: it monitors runtime activity, classifies suspicious behavior, prepares scoped response proposals, and keeps execution behind an operator approval gate.

## Product thesis

Pre-deployment audits are useful, but protocols also need runtime defense once contracts are live. BreachResponse gives Mantle operators a command center for suspicious onchain activity, incident analysis, and controlled emergency response.

## Why this fits security tooling

- It helps builders and security teams inspect protocol behavior during live or testnet operation.
- It combines Mantle RPC monitoring, a SentinelRegistry contract, incident analysis, and review workflows.
- It turns raw chain activity into structured operator decisions instead of unrestricted autonomous execution.
- It produces an auditable response trail for follow-up and post-incident review.

## What the product walkthrough should show

1. A Mantle protocol registers a protected contract.
2. The sentinel monitors Mantle activity and local telemetry.
3. Suspicious repeated event patterns trigger an anomaly.
4. The incident analyzer classifies the likely exploit and proposes a scoped action.
5. The operator reviews the proposal and approves or rejects it.
6. The dashboard records the incident and response status.

## Integration boundary

BreachResponse does not integrate Byreal Skills CLI in the MVP because Byreal Skills targets agentic wallet and DEX/liquidity operations. For this product, forcing DEX automation into the architecture would dilute the security story and blur the operator workflow.

The clean future path is a wallet-risk adapter: Byreal Skills output could become another risk source for DeFi position exposure while BreachResponse stays focused on monitoring, analysis, approval, and incident response.

## Explicitly out of scope

- Byreal Skills CLI execution inside the MVP.
- Autonomous DEX trading.
- Liquidity position management.
- Agentic wallet farming or copy-trading.
- Unbounded autonomous wallet control.

## Safety posture

BreachResponse intentionally keeps generated analysis behind operator approval. Security response infrastructure should not blindly let model output sign transactions or move assets. Any future autonomous mode must stay limited to allowlisted contracts, emergency selectors, value caps, signer limits, and clear monitoring thresholds.
