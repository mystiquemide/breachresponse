# BreachResponse Demo Video Plan
## Mantle Turing Test Hackathon 2026

### Video Specs
- Duration: 2:45 - 3:00 minutes
- Style: Voiceover + screen recording + captions
- Tone: Security-infra, serious, operator-focused
- Visual: Dark command center, Mantle-mint accents, no hype fluff

---

## SCENE-BY-SCENE SCRIPT

### SCENE 0: Cold Open (0:00 - 0:10)
**Visual:** Black screen fades into BreachResponse logo on dark command-center grid

**Voiceover:** "Most DeFi security tools tell you what happened after the damage. BreachResponse is built for the window before things spread."

**Caption:** AI-assisted incident response for Mantle smart contracts

---

### SCENE 1: Problem + Architecture (0:10 - 0:30)
**Visual:** Simple dark flow diagram appearing step by step

Mantle Activity → Sentinel Detection → LLM Analysis → Response Proposal → GenLayer Guard → Operator Approval

**Voiceover:** "When a smart contract exploit is detected, speed matters. But so do guardrails. BreachResponse separates the flow: AI handles detection and analysis. Execution stays behind human approval. And GenLayer provides external consensus validation before any high-risk action reaches the operator."

**Caption:** Detection → Analysis → Guard → Operator Approval

---

### SCENE 2: Landing Page + Live Monitoring (0:30 - 0:55)
**Visual:** Screen recording of breachresponse.vercel.app landing page
- Show the initialization sequence (INITIALIZING → MANTLE RPC → SYNC → READY)
- Scroll to Mempool Radar showing live transaction hashes streaming
- Show Defense Matrix Ledger with live block samples
- Highlight the three suspicious transactions with their statuses

**Voiceover:** "The Command Center runs live against Mantle Sepolia. Every few seconds, real block samples stream through the mempool radar. The Defense Matrix Ledger shows actual transactions, their target protocols, verification types, and response status. Two of these are flagged as Response Ready, one is clean."

**Caption:** Live Mantle Sepolia block streaming — real data, no mocks

---

### SCENE 3: Wallet Connect + Dashboard Entry (0:55 - 1:15)
**Visual:** 
- Click "Connect and Enter" or "Enter Command Center"
- RainbowKit wallet modal appears
- Connect wallet (show Mantle Sepolia network indicator)
- Dashboard loads with cybernetic grid, HUD panels, stats strip

**Voiceover:** "Operators connect through RainbowKit with full wallet state management. Wrong network detection, disconnect handling, and shared wallet control across all routes. Once connected, the Command Center gives you live telemetry, threat classification, and response controls in one view."

**Caption:** RainbowKit + Wagmi wallet bridge on Mantle Sepolia

---

### SCENE 4: Protocol Registration (1:15 - 1:35)
**Visual:**
- Navigate to Sentinel Registry section
- Show register-a-protocol flow
- Enter a protocol name and contract address
- Submit transaction through wallet
- Show the registered protocol appearing in the list
- Point out the live SentinelRegistry contract address

**Voiceover:** "Protocol teams register their Mantle contracts through the SentinelRegistry. This is a real deployed contract on Mantle Sepolia. Registration binds the protocol to the monitoring system and sets up the permission scope for response actions."

**Caption:** Live SentinelRegistry on Mantle Sepolia — 0x48c3...502b0

---

### SCENE 5: Threat Detection + AI Analysis (1:35 - 2:00)
**Visual:**
- Show a flagged incident appearing in the dashboard
- Click into the incident modal
- Show AI analysis output: threat class, confidence score, evidence summary
- Show the proposed response action (pause protocol / quarantine address)

**Voiceover:** "When the sentinel detects suspicious patterns, it doesn't just fire an alert. The AI analysis layer converts raw chain activity into a structured incident report: threat classification, confidence scoring, evidence summary, and a scoped response proposal. The operator sees exactly what happened and what the recommended action is."

**Caption:** LLM-assisted incident analysis — threat class, confidence, evidence

---

### SCENE 6: GenLayer Consensus Guard (2:00 - 2:20)
**Visual:**
- Switch to GenLayer guard panel in the dashboard
- Show the consensus validation flow
- Highlight the guard's role: validates the AI proposal before it reaches the operator
- Show the allowlisted action types: pause_protocol, quarantine_address, monitor_only, alert, multisig_proposal

**Voiceover:** "Before a high-risk response proposal reaches the operator, it passes through the GenLayer consensus guard. This is an external validation layer running on GenLayer StudioNet. Validators independently assess the incident and vote. Only scoped emergency actions make it through: pause protocol, quarantine address, monitor only, alert, and multisig proposal."

**Caption:** GenLayer intelligent contract — validator consensus for high-risk actions

---

### SCENE 7: Operator Approval Gate (2:20 - 2:40)
**Visual:**
- Show the operator review screen
- Display the full incident context + AI analysis + GenLayer consensus result
- Click "Approve" or "Reject"
- Show the response status updating
- Point out the audit trail being recorded

**Voiceover:** "This is where the operator decides. Full incident context, AI analysis, and GenLayer consensus results are presented together. The operator approves or rejects the action. No autonomous execution. No blind model output signing transactions. This is controlled incident response with a recorded review trail."

**Caption:** Human approval is the default — no autonomous execution

---

### SCENE 8: Closing (2:40 - 2:55)
**Visual:** Return to architecture diagram, then BreachResponse logo

**Voiceover:** "BreachResponse is Mantle-specific security infrastructure for protocol teams. Real RPC monitoring, LLM-assisted analysis, GenLayer consensus guardrails, and operator-gated execution. Built for the window that matters."

**Caption:** BreachResponse — AI-assisted incident response for Mantle smart contracts
**Caption:** github.com/mystiquemide/breachresponse | breachresponse.vercel.app

---

## RECORDING CHECKLIST

Before recording:
- [ ] Fresh browser profile, no extensions visible
- [ ] Dark mode OS or browser theme
- [ ] Wallet already has testnet MNT (pre-funded)
- [ ] Dashboard pre-loaded to avoid loading spinners
- [ ] Close all other tabs and apps
- [ ] Hide bookmarks bar, set browser to full screen
- [ ] Test mic levels, no background noise
- [ ] 1080p recording, 30fps

During recording:
- [ ] Smooth cursor movement, no jitter
- [ ] Pause briefly on key UI elements
- [ ] No typos in wallet addresses or input fields
- [ ] Keep transactions pre-signed where possible (speed)

After recording:
- [ ] Trim dead air at start and end
- [ ] Add captions (burned in, not optional)
- [ ] Normalize audio levels
- [ ] Add subtle background audio (dark ambient, low volume)
- [ ] Export 1080p MP4

---

## POST-RECORDING PRODUCTION

- Voiceover: Record clean, then edit into timeline
- Captions: Burn-in, white text with subtle dark background, security-font style
- Transitions: Simple cuts, no flashy effects (keep it serious)
- Background: Dark gradient or subtle grid during title cards
- Audio: Low dark ambient under voiceover, ducked during key moments
- End card: Logo + GitHub + Live URL + "Built for Mantle Turing Test Hackathon 2026"
