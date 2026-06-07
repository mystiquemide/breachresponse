# Operator Runbook

## Normal operation

1. Confirm the Command Center is connected to Mantle Sepolia or the intended Mantle network.
2. Register protected protocol contracts through the sentinel registry.
3. Run the Python sentinel agent with a dedicated testnet key.
4. Monitor heartbeat, sentinel status, and incident stream.

## Incident response flow

1. Alert appears in the Command Center.
2. Review affected protocol, threat type, confidence, and proposed action.
3. Confirm the action is an emergency pause, quarantine, or approved rescue action.
4. Sign through the connected wallet or route to multisig.
5. Confirm transaction status on the Mantle explorer.
6. Record a post-incident note with timeline and outcome.

## Manual approval checklist

- Correct network selected.
- Target contract matches the protected protocol.
- Function selector matches an approved response action.
- Transaction value is zero unless a recovery policy explicitly allows otherwise.
- Multisig or owner wallet is the expected signer.
- Operator has a rollback or unpause plan.

## Emergency shutdown

If the agent behaves unexpectedly:

1. Stop the supervised agent process.
2. Revoke or rotate the testnet agent key.
3. Remove the sentinel agent from the registry if needed.
4. Review logs for proposed payloads and rejected actions.
5. Re-enable only after the policy issue is fixed and tested.
