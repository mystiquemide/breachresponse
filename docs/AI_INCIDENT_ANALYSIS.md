# AI Incident Analysis

BreachResponse uses an LLM-assisted analysis layer to convert suspicious Mantle activity into structured incident reports and response proposals.

The model is advisory by default. It does not get unchecked authority to move funds or execute arbitrary transactions. It classifies the threat, explains the evidence, recommends a scoped action, and passes the proposal into the operator approval path.

## Where it runs

The LLM integration lives in the Python sentinel agent:

- `agent/main.py` scans Mantle RPC activity and local sentinel telemetry.
- `agent/byreal_client.py` sends suspicious activity to the configured OpenAI-compatible model.
- `agent/reporter.py` streams logs and heartbeat events into the Command Center.

## Inputs

The agent can submit structured incident context such as:

- transaction calldata or activity summaries
- monitored contract address
- repeated event/log patterns
- suspected exploit class
- observed protocol state
- expected mitigation selector

For the current review workflow, reentrant log patterns are classified as a reentrancy incident and mapped to the emergency pause selector.

## Model output

The LLM response is expected as strict JSON:

```json
{
  "is_exploit": true,
  "confidence_score": 0.98,
  "exploit_type": "Reentrancy",
  "recommended_calldata": "0x8456cb59"
}
```

The agent stores the latest analysis and uses it to prepare a response proposal. The default pause selector is `0x8456cb59`, which maps to `pause()`.

## Safety model

AI output is never treated as final authority.

BreachResponse separates three decisions:

1. Detection: suspicious activity was observed.
2. Analysis: the LLM classified the likely exploit and suggested a response.
3. Execution: a human operator or scoped policy decides whether the action can be signed.

Production execution should keep `SENTINEL_RESPONSE_MODE=manual` unless the protocol has allowlisted contracts, selectors, value caps, signer limits, and monitoring thresholds.

## Environment

```bash
OPENAI_API_KEY=replace_with_openai_api_key
OPENAI_BASE_URL=
LLM_MODEL=gpt-4o-mini
SENTINEL_RESPONSE_MODE=manual
SENTINEL_ALLOWED_ACTIONS=pause,quarantine
SENTINEL_MAX_ACTION_VALUE=0
```

If no API key is configured, the agent falls back to deterministic mock analysis for local demo and CI-safe testing.

## Operator output

A response proposal should include:

- threat class
- confidence score
- supporting evidence
- target contract
- recommended calldata
- expected effect
- safety notes
- execution mode

This keeps the product useful without asking operators to blindly trust generated text.
