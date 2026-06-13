# BreachResponse - Demo Video Script
## Mantle Turing Test Hackathon 2026 | Target: 2:30 - 3:00 min

---

## PRE-RECORDING SETUP

- Clear browser cache so the boot sequence fires fresh
- Wallet: MetaMask or OKX, pre-funded with test MNT on Mantle Sepolia
- Keep a test contract address ready: `0xea3C039795B5b04105B795c8B0cB85e0a42Cc85C` (registry itself works as a demo target)
- Start at: https://breachresponse.xyz
- Screen: 1080p, full-screen browser, bookmarks bar hidden
- Dark OS theme

---

## SCENE 1 - Cold Open (0:00 - 0:10)

**Screen:** Black. BreachResponse logo fades in on a dark grid background.

> "Most security tools tell you what happened after the damage. BreachResponse is built for the window before it spreads."

---

## SCENE 2 - Landing Page (0:10 - 0:30)

**Screen:** breachresponse.xyz loads. Scroll slowly down the hero.

> "This is BreachResponse - an AI-assisted incident response console for Mantle smart contracts. Protocol operators get real-time threat detection, LLM-powered analysis, and GenLayer consensus validation, all before a single response transaction touches the chain."

**Action:** Scroll to the Features section. The Pipeline Execution steps animate in.

> "The pipeline is simple: monitor Mantle activity, detect anomalies, analyze with AI, validate with GenLayer, get operator approval, execute. Every step is explicit. Nothing runs autonomously."

---

## SCENE 3 - Enter Command Center (0:30 - 0:50)

**Action:** Click "Enter Command Center."

**Screen:** First-load preloader appears briefly - "Initializing..." - then the boot sequence fires:
- MANTLE RPC LINKED... OK
- SENTINEL REGISTRY FOUND... OK
- EXTERNAL CONSENSUS GUARD READY... OK
- COMMAND CENTER ONLINE... READY

> "The Command Center boots and links to Mantle Sepolia. You're looking at live RPC telemetry, a deployed on-chain registry, and the GenLayer consensus guard - all in one view."

---

## SCENE 4 - Dashboard Overview (0:50 - 1:05)

**Screen:** Stats strip across the top:
- Blocks Scanned (incrementing live)
- Active Sentinels
- Worker Checks (LIVE badge)
- Value Monitored (RPC balance, dollar value)
- Response Proposals

> "Five live metrics. Blocks scanned from Mantle Sepolia. Active sentinel registrations. Worker checks from the background agent. Value monitored is a read-only RPC aggregation - no signer, no transaction, just real balance data. And response proposals ready for operator review."

---

## SCENE 5 - Connect Wallet (1:05 - 1:20)

**Action:** Click "Connect Wallet" in the header. RainbowKit modal appears. Select MetaMask. Approve connection. Network switches to Mantle Sepolia.

> "Operators connect through RainbowKit. The system reads your network state - wrong network locks guard actions automatically. On Mantle Sepolia, the register form and incident controls unlock."

**Screen:** Register Sentinel Guard card now shows active button.

---

## SCENE 6 - Register a Sentinel (1:20 - 1:45)

**Action:** In "Register Sentinel Guard":
- Type in the name field: `MNT Vault Guard`
- Paste a contract address
- Click "Register sentinel guard"
- Wallet approval prompt appears - approve it
- "Confirming on-chain..." state shows
- Confirmation: "Sentinel confirmed and registered on Mantle Sepolia"

**Screen:** Terminal on the right logs: `[SYS] Sentinel confirmed on-chain and registered: 0x...`

> "Registration writes to a live Solidity registry on Mantle Sepolia. The contract address, sentinel name, and owner wallet are recorded on-chain. The terminal confirms the transaction, and the sentinel node appears in the monitored list."

---

## SCENE 7 - GenLayer Consensus Guard (1:45 - 2:15)

**Screen:** Scroll to "GenLayer Consensus Guard" panel on the left.

> "This is the consensus guard. When the AI analysis is low-confidence or ambiguous, BreachResponse escalates the incident to GenLayer StudioNet. Operators keep their wallet on Mantle - the app manages the GenLayer signer internally."

**Action:** Click "Prepare guard signer."

**Screen:** App-managed signer shows a truncated address. Status updates to "GenLayer guard signer ready 0x3f...4a2b"

> "Five validators watch the GenLayer intelligent contract. Each has equal weight. They're idle until an incident comes in."

**Action:** Click one of the allowlisted action buttons - "Pause."

**Screen:** Button highlights in green with glow effect. After 600ms: "Action queued: Pause - pending GenLayer consensus approval"

> "Scoped actions are allowlisted before anything runs. Pause, quarantine, monitor-only, alert, multisig proposal. That's it. No arbitrary execution paths."

**Action:** Click "Validate incident."

**Screen:** Status updates through:
- "Submitting incident to GenLayer validator network..."
- "Validators receiving incident - awaiting LLM consensus..."
- Validator dots turn yellow, animate pulsing ("Validating...")
- Then all five turn green ("Approved")
- "Consensus finalized - 5/5 validators approved response"
- Terminal: `[SYS] GenLayer consensus finalized: 5/5 validators approved`

> "Five validators reached supermajority. The consensus result is returned to the app and queued for operator review on the Mantle side. No wallet switch, no GenLayer gas from the operator."

---

## SCENE 8 - Trigger Incident + AI Analysis (2:15 - 2:40)

**Action:** In the terminal, type `trigger incident` and press Enter.

**Screen:** Terminal logs:
```
[ALERT] INITIALIZING INCIDENT RESPONSE WORKFLOW...
[SYS] LOADING HIGH-RISK TRANSACTION CONTEXT...
```

After 1.5s, the Attack Modal opens.

> "The incident response workflow opens. This is a live Groq AI analysis - not a mock. The model receives structured Mantle incident context: transaction calldata, event patterns, suspected exploit class."

**Screen:** AI analysis result appears:
- Exploit type: Reentrancy
- Confidence: 0.98
- Recommended calldata: 0x8456cb59 (pause())
- Evidence summary

> "Groq returns a structured JSON verdict. Exploit type, confidence score, supporting evidence, recommended calldata. The default response selector maps to the emergency pause function. The operator reviews all of this before anything runs."

**Action:** Show approve/reject buttons. Hover over them but do not click approve.

> "Approve or reject. Human sign-off is the default. The AI is advisory. It cannot bypass this gate."

**Action:** Close the modal.

---

## SCENE 9 - Threat History (2:40 - 2:50)

**Action:** Click "Threat History" in the nav.

**Screen:** History page loads. Real past incident records show with timestamps, protocol, threat type, and status.

> "Every incident is recorded for post-incident review. The history feeds from real Mantle block data - no fake seeds."

---

## SCENE 10 - Closing (2:50 - 3:00)

**Action:** Click "Back" to return to the landing page.

**Screen:** Landing page. Fade to logo card.

> "BreachResponse. AI-assisted runtime security for Mantle. Real monitoring, real analysis, real guardrails."

**Caption:** github.com/mystiquemide/breachresponse | breachresponse.xyz
**Caption:** Registry: 0xea3C039795B5b04105B795c8B0cB85e0a42Cc85C on Mantle Sepolia
**Caption:** Built for the Mantle Turing Test Hackathon 2026 - AI DevTools Track

---

## RECORDING NOTES

**Before you hit record:**
- Clear localStorage so the boot sequence fires: open DevTools → Application → Local Storage → delete `breachresponse_boot_seen`
- Pre-fund the wallet with test MNT from https://faucet.mantle.xyz
- Have a dummy contract address ready to paste in Scene 6 (the registry address works: `0xea3C039795B5b04105B795c8B0cB85e0a42Cc85C`)
- Hide the bookmarks bar (`Ctrl+Shift+B`)
- Close all other tabs

**During recording:**
- Slow down cursor movement - viewers need to follow you
- Pause 1-2 seconds on key elements before moving on
- The wallet approval prompt will break your flow - practice the click path before recording
- Type `trigger incident` cleanly in the terminal - no typos

**After recording:**
- Trim the dead air during wallet confirmation (blockchain wait time)
- Speed up on-chain confirmation wait to 2x if it drags past 5 seconds
- Burn in captions - do not make them optional
- Export 1080p MP4
- Keep total duration under 3 minutes for the submission
