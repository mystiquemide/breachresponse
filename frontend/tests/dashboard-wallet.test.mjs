import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const dashboardSource = readFileSync(new URL('../src/app/dashboard/page.tsx', import.meta.url), 'utf8');
const historySource = readFileSync(new URL('../src/app/history/page.tsx', import.meta.url), 'utf8');
const landingSource = readFileSync(new URL('../src/app/page.tsx', import.meta.url), 'utf8');
const providerSource = readFileSync(new URL('../src/app/Web3Provider.tsx', import.meta.url), 'utf8');
const walletControlSource = readFileSync(new URL('../src/components/WalletConnectControl.tsx', import.meta.url), 'utf8');

for (const [name, source] of [
  ['landing', landingSource],
  ['dashboard', dashboardSource],
  ['history', historySource],
]) {
  assert.match(source, /WalletConnectControl/, `${name} should render the shared RainbowKit wallet control`);
  assert.doesNotMatch(source, /connectWalletWithWagmi/, `${name} should not own custom route-level wallet connection`);
  assert.doesNotMatch(source, /useConnect|useReconnect|connectAsync|reconnectAsync/, `${name} should not run route-local connect or reconnect logic`);
  assert.doesNotMatch(source, /Install MetaMask|Unlock MetaMask|Open MetaMask/, `${name} wallet copy should stay wallet-agnostic`);
}

for (const [name, source] of [
  ['dashboard', dashboardSource],
  ['history', historySource],
]) {
  assert.doesNotMatch(source, /walletNotice|connectError|WALLET_REQUEST_PENDING_NOTICE/, `${name} should not render stale custom wallet notice state`);
}

assert.match(walletControlSource, /ConnectButton\.Custom/, 'shared wallet control should use RainbowKit ConnectButton.Custom');
assert.match(walletControlSource, /openConnectModal/, 'shared wallet control should let RainbowKit own wallet connection');
assert.match(walletControlSource, /openChainModal/, 'shared wallet control should let RainbowKit own network switching');
assert.match(walletControlSource, /account\.displayName/, 'shared wallet control should display the connected wallet account');

assert.match(providerSource, /RainbowKitProvider/, 'Web3Provider should wrap the app in RainbowKitProvider');
assert.match(providerSource, /@rainbow-me\/rainbowkit\/styles\.css/, 'Web3Provider should load RainbowKit styles');
assert.match(providerSource, /WagmiProvider/, 'Web3Provider should keep WagmiProvider for wallet state');
assert.match(providerSource, /injected\(/, 'Web3Provider should keep injected wallet fallback support');
assert.match(providerSource, /ssr:\s*true/, 'Web3Provider should keep SSR-safe Wagmi config');

assert.match(landingSource, /setIsLaunchingCommandCenter\(true\);\s*window\.sessionStorage\.setItem\('breachresponse_launching_command_center', 'true'\);/s, 'landing wallet CTA should mark Command Center intent before RainbowKit opens');
assert.match(landingSource, /Connect and Enter/, 'landing primary wallet CTA should explain that connect continues into Command Center');

assert.match(dashboardSource, /Mantle Faucet/, 'dashboard should expose a Mantle faucet card');
assert.match(dashboardSource, /https:\/\/faucet\.mantle\.xyz/, 'dashboard faucet card should link to the Mantle faucet');
assert.match(dashboardSource, /Need test MNT\?/, 'dashboard faucet card should explain why users need faucet funds');

assert.doesNotMatch(dashboardSource, /!hasOnboarded\s*\|\|\s*shouldOpenTour/, 'dashboard should not auto-open onboarding over wallet controls');
assert.match(dashboardSource, /get\('tour'\) === '1'/, 'dashboard should still support explicit tour replay');
