# Review Workflow

Use this path when showing BreachResponse to reviewers, operators, or protocol teams.

## Review path

1. Open the landing page and point to the top-level product promise: AI-assisted runtime review for Mantle activity.
2. Click **Features**. It should land on **Pipeline Execution**, the monitor, detect, propose, approve, and execute flow.
3. Click **Enter Command Center**. The app opens the operator dashboard.
4. Connect a Mantle Sepolia wallet if you want to show live wallet state. Without a wallet, the dashboard still shows the safe disconnected state and keeps guard actions disabled. After connecting, confirm the header exposes an intentional disconnect control.
5. Review the Command Center cards:
   - **Blocks Scanned** shows monitored activity.
   - **Active Sentinels** shows registered monitoring nodes.
   - **Value Monitored** shows read-only RPC balance aggregation from active sentinel addresses.
   - **Response Proposals** tracks operator-review items that still require approval before execution.
6. Review **Register Sentinel Guard**. The guard initialization action stays disabled until a Mantle wallet is connected and the operator supplies a contract address.
7. Review **GenLayer Consensus Guard**. Explain that normal users keep their wallet on Mantle. The app layer submits ambiguous Mantle incident context to GenLayer StudioNet, then uses the validator consensus result before proposing a Mantle-side response.
8. Use **Threat History** to show past incident records and post-incident review.
9. Use browser back or the **BACK** button to return to the landing page. The Command Center should not trap users after disconnecting or navigating back. Disconnecting should return the dashboard to a safe readable state.

## What to say

BreachResponse helps Mantle builders review suspicious activity, understand possible risk, and turn raw onchain signals into structured response context. Mantle remains the execution network for registry state, wallet UX, monitored assets, and approved response transactions. GenLayer acts as an external validator-consensus guard for ambiguous AI/security decisions.

## What not to say

- Do not say the GenLayer contract runs on Mantle.
- Do not say normal users switch their wallet to GenLayer.
- Do not say AI can freely execute emergency actions.

## Expected product behavior

- The **Features** navigation target lands on **Pipeline Execution**.
- Disconnected wallet state is safe and readable.
- Guard actions are disabled until the required wallet and input state exists.
- Reconnect works after disconnect.
- The connected wallet state exposes a clear disconnect control.
- Wrong-network and disconnected states are readable and keep protected actions gated.
- Browser back returns users to the landing flow instead of trapping them in Command Center.
- GenLayer language clearly says users stay on Mantle and GenLayer validates decisions through the app layer.

## Current product screenshots

### Landing hero

![Landing hero](./assets/hero.png)

### Command Center

![Command Center](./assets/product-screen-dashboard.png)

### Mobile landing

![Mobile landing](./assets/product-screen-mobile.png)

## Product-safe review narrative

Use this story when presenting the product:

1. A Mantle protocol registers a protected contract.
2. The sentinel monitors Mantle activity.
3. Suspicious repeated event patterns trigger an anomaly.
4. The incident analyzer classifies the likely exploit and prepares a scoped response proposal.
5. The operator approves or rejects the action.
6. The dashboard records the incident for review.

Avoid DEX automation, Byreal Skills CLI, liquidity farming, and agentic wallet claims in the product walkthrough. Those are outside the product boundary for a Mantle runtime security and response workflow.
