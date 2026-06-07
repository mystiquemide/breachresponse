# Threat Model

## Assets protected

- Protocol funds and protected vault balances
- Emergency pause authority
- Sentinel registry integrity
- Operator wallet and multisig safety
- Incident telemetry and response logs

## Main threats

| Threat | Impact | Mitigation |
| --- | --- | --- |
| Reentrancy exploit | Vault drain | Sentinel detection and pause path |
| Oracle manipulation | Bad pricing and liquidation cascades | anomaly detection and policy thresholds |
| Compromised agent key | Unauthorized action | low-balance test keys, scoped production signers, allowlisted selectors |
| Malicious payload generation | Unsafe transaction | human approval, selector allowlist, value caps |
| RPC failure | Missed incident | provider redundancy and health checks |
| Secret leakage | account compromise | placeholders only, secret scanning, no committed `.env` |

## Trust boundaries

- The frontend is an operator interface, not a source of truth.
- The agent can propose actions, but production execution must pass approval or policy checks.
- The registry defines authorized sentinels, but protocol owners must still control admin keys safely.
- AI output is advisory until validated by deterministic rules.

## Response safety rules

1. Default to manual approval.
2. Limit autonomous mode to emergency pause or quarantine selectors.
3. Reject payloads with nonzero value unless explicitly approved.
4. Log every proposed and executed action.
5. Support operator override and agent shutdown.
6. Test policy changes against simulations before deployment.
