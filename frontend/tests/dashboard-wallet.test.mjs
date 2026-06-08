import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const dashboardSource = readFileSync(new URL('../src/app/dashboard/page.tsx', import.meta.url), 'utf8');
const historySource = readFileSync(new URL('../src/app/history/page.tsx', import.meta.url), 'utf8');
const landingSource = readFileSync(new URL('../src/app/page.tsx', import.meta.url), 'utf8');
const providerSource = readFileSync(new URL('../src/app/Web3Provider.tsx', import.meta.url), 'utf8');

for (const [name, source] of [
  ['landing', landingSource],
  ['dashboard', dashboardSource],
  ['history', historySource],
]) {
  assert.match(source, /connectWalletWithWagmi/, `${name} should use the shared Wagmi wallet connect helper`);
  assert.doesNotMatch(source, /connect\(\{ connector: injectedConnector \}\)/, `${name} should not use a route-local injected connector`);
  assert.doesNotMatch(source, /Install MetaMask|Unlock MetaMask|Open MetaMask/, `${name} wallet copy should stay wallet-agnostic`);
}

for (const [name, source] of [
  ['dashboard', dashboardSource],
  ['history', historySource],
]) {
  assert.match(source, /WALLET_REQUEST_PENDING_NOTICE/, `${name} should import the pending wallet notice`);
  assert.match(source, /walletNotice !== WALLET_REQUEST_PENDING_NOTICE/, `${name} should stop showing Connecting after the wallet request times out`);
}

assert.doesNotMatch(dashboardSource, /!hasOnboarded\s*\|\|\s*shouldOpenTour/, 'dashboard should not auto-open onboarding over wallet controls');
assert.match(dashboardSource, /get\('tour'\) === '1'/, 'dashboard should still support explicit tour replay');
assert.match(providerSource, /injected\(/, 'Web3Provider should keep injected wallet fallback support');
