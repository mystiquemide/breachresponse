# Demo Flow

Use this path when showing BreachResponse to judges, reviewers, or protocol teams.

## Judge walkthrough

1. Open the landing page and point to the top-level product promise: AI-assisted incident response for Mantle smart contracts.
2. Click **Features**. It should land on **Pipeline Execution**, the three-stage Monitor, Formulate, Intercept flow.
3. Click **Enter Command Center**. The app opens the operator dashboard.
4. Connect a Mantle Sepolia wallet if you want to demonstrate live wallet state. Without a wallet, the dashboard still shows the safe disconnected state and keeps guard actions disabled.
5. Review the Command Center cards:
   - **Blocks Scanned** shows monitored activity.
   - **Active Sentinels** shows registered monitoring nodes.
   - **Value Secured** is clearly marked as simulated demo value.
   - **Mitigated Attacks** tracks successful controlled responses.
6. Review **Deploy Sentinel Guard**. The guard initialization action stays disabled until a Mantle wallet is connected and the operator supplies a contract address.
7. Review **GenLayer Consensus Guard**. Explain that normal users keep their wallet on Mantle. The app layer submits ambiguous Mantle incident context to GenLayer StudioNet, then uses the validator consensus result before proposing a Mantle-side response.
8. Use **Threat History** to show past incident records and post-incident review.
9. Use browser back or the **BACK** button to return to the landing page. The Command Center should not trap users after disconnecting or navigating back.

## What to say

BreachResponse protects Mantle smart contracts by turning suspicious activity into scoped response proposals. Mantle remains the execution network for registry state, wallet UX, monitored assets, and approved response transactions. GenLayer acts as an external validator-consensus guard for ambiguous AI/security decisions.

## What not to say

- Do not say the GenLayer contract runs on Mantle.
- Do not say normal users switch their wallet to GenLayer.
- Do not say AI can freely execute emergency actions.

## Expected product behavior

- The **Features** navigation target lands on **Pipeline Execution**.
- Disconnected wallet state is safe and readable.
- Guard actions are disabled until the required wallet and input state exists.
- Reconnect works after disconnect.
- Browser back returns users to the landing flow instead of trapping them in Command Center.
- GenLayer language clearly says users stay on Mantle and GenLayer validates decisions through the app layer.

## Current product screenshots

| Landing hero | Command Center |
| --- | --- |
| ![Landing hero](./assets/hero.png) | ![Command Center](./assets/product-screen-dashboard.png) |

| Mobile landing |
| --- |
| ![Mobile landing](./assets/product-screen-mobile.png) |
