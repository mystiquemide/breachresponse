# Security Policy

BreachResponse is security infrastructure, so the default posture is conservative.

## Supported versions

| Version | Supported |
| --- | --- |
| Latest `main` | Yes |
| Older commits | No |

## Reporting a vulnerability

Do not disclose exploitable issues publicly. Use GitHub private vulnerability reporting if it is available for this repository, or contact the repository owner directly.

Please include:

- affected component: frontend, agent, contracts, CI, docs, or deployment
- clear reproduction steps
- impact assessment
- suggested fix if known
- whether any secret, wallet, or private key exposure is involved

## Secret handling

- No real API keys, wallet seeds, private keys, or production RPC credentials belong in the repository.
- `.env.example` must only contain placeholders and public testnet values.
- Testnet keys must be dedicated low-balance keys.
- Production signing should go through a multisig, hardware wallet, or policy engine.

## Autonomous response safety

Human approval is the default mode. Autonomous execution must be scoped with:

- allowlisted contracts
- allowlisted function selectors
- maximum action value caps
- emergency pause and quarantine actions before fund movement actions
- logging and alerting on every attempted action
- manual override and kill-switch support

## Known risk areas

- The validation contracts intentionally include a vulnerable target vault to prove the defense path in tests.
- The monitoring agent is only as reliable as its RPC provider and configured policies.
- AI-generated payloads must be validated against allowlists before execution.
