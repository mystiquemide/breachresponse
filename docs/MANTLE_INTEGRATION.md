# Mantle Integration

BreachResponse targets Mantle because incident response for high-throughput DeFi systems needs low-latency monitoring, clear operator UX, and explicit on-chain control paths.

## Current integration points

- Mantle Sepolia RPC support through frontend and agent environment variables.
- Mantle network switching through Wagmi.
- Registry contract deployed on Mantle Sepolia and wired into the frontend.
- Live block and transaction telemetry in the Command Center.
- Simulation contracts proving pause-based defense against a reentrancy path.

## Environment

```text
MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
NEXT_PUBLIC_MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
NEXT_PUBLIC_REGISTRY_ADDRESS=0xea3C039795B5b04105B795c8B0cB85e0a42Cc85C
```

## Deployment record

| Field | Value |
| --- | --- |
| Network | Mantle Sepolia |
| Registry address | `0xea3C039795B5b04105B795c8B0cB85e0a42Cc85C` |
| Contract explorer | https://explorer.sepolia.mantle.xyz/address/0xea3C039795B5b04105B795c8B0cB85e0a42Cc85C |
| Deployment transaction | https://explorer.sepolia.mantle.xyz/tx/0x0dac721b1ed137bf93132222348aab39bae48ed3a6e8b8e6ed0d0ee9d91f2b07 |
| Deployer | `0x9f758be3ae3d985713964339e2f0bd783fc6015c` |
| Verified source | Pending on Mantlescan |

## Next integration milestones

1. Add redundant Mantle RPC providers.
2. Verify the registry source on Mantlescan.
3. Add explorer links to the Command Center.
4. Add sentinel policy configuration for multiple Mantle protocols.
5. Add incident replay from historical Mantle transactions.
