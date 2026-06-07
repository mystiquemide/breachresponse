# Contributing

BreachResponse accepts focused, reviewable changes that improve reliability, security, product quality, or Mantle integration.

## Pull request rules

1. Branch from `main`.
2. Keep changes scoped.
3. Update docs when behavior changes.
4. Add or update tests when logic changes.
5. Run the verification commands before opening a PR.
6. Do not commit secrets, private keys, wallet seeds, production RPC credentials, or local `.env` files.

## Verification

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

## Review focus

Reviewers should check:

- security regressions
- wallet and network state handling
- unsafe autonomous execution paths
- API or schema changes that break the frontend
- missing environment documentation
- unverified claims in docs
