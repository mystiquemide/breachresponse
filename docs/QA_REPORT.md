# QA Report

## Current verification target

BreachResponse should pass local and CI checks for frontend, contracts, and agent syntax before any release branch is merged.

## Required checks

```bash
cd frontend
npm ci
npm run lint -- --max-warnings=0
npx tsc --noEmit
npm run build
npm audit --audit-level=moderate

cd ../contracts
npm ci
npm run compile
npm test
npm audit --audit-level=moderate

cd ../agent
python -m compileall -q .
```

## Contract simulation notes

`TargetVault.sol` is intentionally vulnerable inside the simulation suite. It exists to prove the difference between an unprotected exploit path and a protected pause path.

Expected result:

- unprotected path drains the test vault
- sentinel pause path blocks deposits, withdrawals, and recursive exploit execution

## Release gate

A release branch should not merge unless:

- frontend lint, typecheck, build, and audit pass
- contract compile, tests, and audit pass at moderate threshold
- agent Python syntax check passes
- public docs contain no internal planning language
- environment files contain placeholders only
- review workflow matches the live product behavior
- screenshots are current and contain no private data or stale overlays

## Final demo QA

The current product review path is documented in [Review Workflow](./REVIEW_WORKFLOW.md). Before release, verify:

- **Features** scrolls to **Pipeline Execution**.
- **Enter Command Center** opens the dashboard.
- Disconnected wallet state keeps protected actions disabled.
- Reconnect works after disconnect.
- Browser back and **BACK** return users to the landing flow.
- GenLayer wording says users stay on Mantle and GenLayer validates ambiguous incidents through the app layer.
