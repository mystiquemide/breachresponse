# Design System

## Visual Core
- **Theme**: Dark Mode only. "Command Center" / "Submarine Radar" aesthetic.
- **Colors**:
  - Background: Deep Void Black (`#09090B`)
  - Surface: Dark Slate (`#18181B`)
  - Safe Accent: Mantle Mint (`#10B981`)
  - Danger Accent: Cyber Red (`#EF4444`)
- **Typography**: Space Grotesk (Headers, Mono data), Inter (Body).

## UI Components
1. **PulseRadar (Component)**: A visual circle that pulses green when safe, red when attack detected.
2. **AlertModal (Component)**: Slides in from right when an attack is intercepted. Contains the AI explanation and the "Approve & Execute" button.
3. **TxLogTable (Component)**: Real-time scrolling terminal-like log of scanned mempool transactions.

## User Flows
1. **Onboarding**: User lands, connects wallet, sees "System Secure. Monitoring Mantle Mempool."
2. **The Hack**: Terminal logs speed up, turn red. AlertModal appears.
3. **Defense**: User clicks "Approve". Wallet prompts. User signs. Screen flashes green. "Funds Secured."
