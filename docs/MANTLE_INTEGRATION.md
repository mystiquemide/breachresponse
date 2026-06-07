# Mantle Integration

BreachResponse targets Mantle because incident response for high-throughput DeFi systems needs low-latency monitoring, clear operator UX, and explicit on-chain control paths.

## Current integration points

- Mantle Sepolia RPC support through frontend and agent environment variables.
- Mantle network switching through Wagmi.
- Registry contract designed for Mantle deployment.
- Live block and transaction telemetry in the Command Center.
- Simulation contracts proving pause-based defense against a reentrancy path.

## Environment

```text
MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
NEXT_PUBLIC_MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
NEXT_PUBLIC_REGISTRY_ADDRESS=<registry contract address>
```

## Deployment record template

| Field | Value |
| --- | --- |
| Network | Mantle Sepolia |
| Registry address | `<address>` |
| Deployment transaction | `<explorer link>` |
| Source commit | `<git sha>` |
| Verified source | `<yes/no>` |

## Next integration milestones

1. Add redundant Mantle RPC providers.
2. Record verified registry deployment metadata in this doc.
3. Add explorer links to the Command Center.
4. Add sentinel policy configuration for multiple Mantle protocols.
5. Add incident replay from historical Mantle transactions.
