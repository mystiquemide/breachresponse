import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  aggregateValueMetrics,
  formatTokenAmount,
  parseTokenAllowlist,
  priceTokenBalances,
} from '../src/lib/valueMonitored.js';

const dashboardSource = readFileSync(new URL('../src/app/dashboard/page.tsx', import.meta.url), 'utf8');
const routeSource = readFileSync(new URL('../src/app/api/metrics/value-monitored/route.ts', import.meta.url), 'utf8');

assert.equal(formatTokenAmount('42000000000000000', 18), '0.042');
assert.equal(formatTokenAmount('12500000', 6), '12.5');
assert.equal(formatTokenAmount('0', 18), '0');

assert.deepEqual(
  parseTokenAllowlist('USDC:0x1111111111111111111111111111111111111111:6:usd-coin,WETH:0x2222222222222222222222222222222222222222:18:ethereum'),
  [
    {
      symbol: 'USDC',
      address: '0x1111111111111111111111111111111111111111',
      decimals: 6,
      priceId: 'usd-coin',
    },
    {
      symbol: 'WETH',
      address: '0x2222222222222222222222222222222222222222',
      decimals: 18,
      priceId: 'ethereum',
    },
  ],
);

assert.deepEqual(parseTokenAllowlist(''), []);
assert.throws(() => parseTokenAllowlist('BROKEN:0x123:18'), /Invalid token allowlist entry/);
assert.throws(() => parseTokenAllowlist('USDC:0x1111111111111111111111111111111111111111:not-a-number'), /Invalid token decimals/);

const priced = priceTokenBalances(
  [
    { symbol: 'USDC', amount: '12.5', priceId: 'usd-coin' },
    { symbol: 'WETH', amount: '0.25', priceId: 'ethereum' },
    { symbol: 'UNKNOWN', amount: '99', priceId: undefined },
  ],
  {
    'usd-coin': 1,
    ethereum: 2400,
  },
);

assert.equal(priced[0].usd, 12.5);
assert.equal(priced[1].usd, 600);
assert.equal(priced[2].usd, null, 'missing prices should stay unavailable instead of becoming fake zero');

const aggregate = aggregateValueMetrics({
  network: 'mantle-sepolia',
  chainId: 5003,
  nativeBalances: [
    { sentinel: '0xaaa', wei: '42000000000000000' },
    { sentinel: '0xbbb', wei: '8000000000000000' },
  ],
  tokenBalances: priced,
});

assert.equal(aggregate.native.amount, '0.05');
assert.equal(aggregate.totalUsd, 612.5);
assert.equal(aggregate.source, 'mantle-rpc-readonly');

assert.match(routeSource, /export const runtime = 'nodejs'/, 'value metrics route should run in Node for ethers and database access');
assert.match(routeSource, /getBalance/, 'value metrics route should read native MNT balances from RPC');
assert.match(routeSource, /balanceOf/, 'value metrics route should read ERC-20 balances from the allowlist');
assert.doesNotMatch(routeSource, /privateKey|Wallet\(/i, 'value metrics route must not create a signer or spend funds');

assert.match(dashboardSource, /Value Monitored/, 'dashboard should expose a Value Monitored card');
assert.match(dashboardSource, /Mantle Sepolia RPC, read-only/, 'dashboard should disclose the metrics source');
assert.match(dashboardSource, /\/api\/metrics\/value-monitored/, 'dashboard should load value metrics from the API route');
