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

assert.doesNotMatch(historySource, /connectError\?\.message/, 'history should not render raw Wagmi error messages with library versions');
assert.match(historySource, /Connected:/, 'history should label the connected wallet state');
assert.match(historySource, /address \? `\$\{address\.slice\(0, 6\)\}\.\.\.\$\{address\.slice\(-4\)\}` : 'Syncing address'/, 'history should use a hydration copy instead of vague wallet connected text');
assert.match(historySource, />\s*Disconnect\s*</, 'history should keep disconnect as a separate visible action');

assert.match(landingSource, /setIsLaunchingCommandCenter\(true\);\s*window\.sessionStorage\.setItem\('breachresponse_launching_command_center', 'true'\);\s*if \(!isConnected\)/s, 'landing wallet connect should mark Command Center intent before connecting');
assert.match(landingSource, /Connect and Enter/, 'landing primary wallet CTA should explain that connect continues into Command Center');

assert.match(dashboardSource, /Mantle Faucet/, 'dashboard should expose a Mantle faucet card');
assert.match(dashboardSource, /https:\/\/faucet\.mantle\.xyz/, 'dashboard faucet card should link to the Mantle faucet');
assert.match(dashboardSource, /Need test MNT\?/, 'dashboard faucet card should explain why users need faucet funds');

assert.doesNotMatch(dashboardSource, /!hasOnboarded\s*\|\|\s*shouldOpenTour/, 'dashboard should not auto-open onboarding over wallet controls');
assert.match(dashboardSource, /get\('tour'\) === '1'/, 'dashboard should still support explicit tour replay');
assert.match(providerSource, /injected\(/, 'Web3Provider should keep injected wallet fallback support');
