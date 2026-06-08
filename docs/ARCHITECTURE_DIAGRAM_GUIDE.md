# Architecture Diagram Guide for Hackathon Judges

## Recommendation

Use architecture-as-code in the repository, not a decorative architecture image. For BreachResponse, the README should use Mermaid diagrams that GitHub renders directly from markdown.

The pitch deck can still use the polished image, but the repo should show diagrams as code so reviewers can inspect, diff, and trust the design.

## Why Mermaid fits BreachResponse

- GitHub renders Mermaid inside README and docs.
- The diagram source lives in the repo and changes show up in pull requests.
- Reviewers can read the raw markdown even if rendering fails.
- It looks technical and maintainable, not like a marketing poster.
- It can show exact boundaries between Mantle, GenLayer, app services, wallet UX, and human approval.

## Diagram types reviewers usually prefer

### 1. C4-style system or container diagram

Best for the first architecture view. It shows the main components, external systems, and ownership boundaries.

Use it to answer:

- What are the major systems?
- What talks to what?
- Which chain executes actions?
- Where does GenLayer fit?

For BreachResponse, this should show:

- Operator / Web2 user
- Next.js Command Center
- Injected wallet
- Mantle Sepolia
- Python Sentinel Agent
- LLM incident analysis
- GenLayer Consensus Guard
- Human Approval Gate
- Approved Mantle response action

### 2. Sequence diagram

Best for reviewers who care whether the system actually works at runtime. It shows the step-by-step incident path.

Use it to answer:

- What happens after an alert?
- When is GenLayer called?
- Who approves the final action?
- Where does the Mantle transaction happen?

### 3. Trust boundary diagram

Best for Web3/security projects. Judges look for safety boundaries and overclaiming.

Use it to answer:

- What runs on the user's device?
- What runs in the app layer?
- What runs on Mantle?
- What runs on GenLayer?
- Does the user need to switch to GenLayer?
- Can AI execute actions without approval?

### 4. Deployment diagram

Useful in longer docs, not always needed in README. It shows where the services run.

Use it to answer:

- Where is the frontend hosted?
- Where does the agent run?
- Which RPCs and APIs are required?
- Which env vars connect the system?

### 5. Component diagram

Useful when the codebase is complex. Keep it in docs, not above the fold.

Use it to answer:

- Which files implement the feature?
- Which modules call each other?
- Where are tests located?

## Preferred README structure

~~~markdown
## Architecture

Short paragraph explaining the architecture and the network roles.

### System Architecture

```mermaid
flowchart LR
  ...
```

### Incident Validation Flow

```mermaid
sequenceDiagram
  ...
```

See [Architecture](./ARCHITECTURE.md) for the trust boundary and full system design.
~~~

## Wording to use for BreachResponse

Use:

```txt
Mantle is the execution network for protected assets, wallet state, registry records, and approved response transactions. GenLayer is a validator-consensus layer for ambiguous incident decisions. BreachResponse bridges Mantle incident context to GenLayer through the app layer, then uses the consensus result before proposing or executing a Mantle-side response.
```

Avoid:

```txt
GenLayer runs on Mantle.
```

Avoid:

```txt
Users switch their wallet to GenLayer.
```

Avoid:

```txt
AI automatically pauses contracts.
```

Better:

```txt
Users keep their wallet on Mantle. GenLayer validates decisions in the background through the BreachResponse app layer. Emergency actions stay human-approved by default.
```

## Final BreachResponse architecture set

Use these in the repo:

1. README: Mermaid system architecture and incident sequence.
2. `docs/ARCHITECTURE.md`: full Mermaid system diagram, sequence diagram, trust boundary, layers, response modes, design decisions.
3. Pitch deck or demo page: optional polished visual image.

That gives reviewers both formats: visual polish and code-style architecture for technical review.
