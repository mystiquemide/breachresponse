import { NextResponse } from 'next/server';
import { Contract, JsonRpcProvider } from 'ethers';
import { prisma } from '@/lib/db';
import {
  aggregateValueMetrics,
  formatTokenAmount,
  parseTokenAllowlist,
  priceTokenBalances,
} from '@/lib/valueMonitored';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const erc20Abi = [
  'function balanceOf(address owner) view returns (uint256)',
];

const DEFAULT_RPC_URL = 'https://rpc.sepolia.mantle.xyz';
const DEFAULT_NETWORK = 'mantle-sepolia';
const DEFAULT_CHAIN_ID = 5003;
const DEFAULT_NATIVE_PRICE_ID = 'mantle';

async function fetchPrices(priceIds: string[]) {
  const uniqueIds = [...new Set(priceIds.filter(Boolean))];
  if (uniqueIds.length === 0) return {};

  const params = new URLSearchParams({
    ids: uniqueIds.join(','),
    vs_currencies: 'usd',
  });

  const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?${params.toString()}`, {
    next: { revalidate: 60 },
  });

  if (!response.ok) return {};

  const data = await response.json();
  return Object.fromEntries(
    uniqueIds
      .map((id) => [id, Number(data?.[id]?.usd)])
      .filter(([, price]) => Number.isFinite(price)),
  );
}

export async function GET() {
  try {
    const rpcUrl = process.env.MANTLE_RPC_URL || DEFAULT_RPC_URL;
    const network = process.env.MANTLE_NETWORK || DEFAULT_NETWORK;
    const chainId = Number(process.env.MANTLE_CHAIN_ID || DEFAULT_CHAIN_ID);
    const tokenAllowlist = parseTokenAllowlist(process.env.MANTLE_TOKEN_ALLOWLIST || '');
    const provider = new JsonRpcProvider(rpcUrl);

    const allSentinels = await prisma.sentinelNode.findMany({
      orderBy: { registeredAt: 'desc' },
    });
    const sentinels = allSentinels.filter((sentinel) => sentinel.status === 'ACTIVE');

    const nativeBalances = await Promise.all(
      sentinels.map(async (sentinel) => {
        const balance = await provider.getBalance(sentinel.address);
        return {
          id: sentinel.id,
          name: sentinel.name,
          sentinel: sentinel.address,
          wei: balance.toString(),
          amount: formatTokenAmount(balance.toString(), 18),
        };
      }),
    );

    const tokenBalanceRows = await Promise.all(
      sentinels.flatMap((sentinel) =>
        tokenAllowlist.map(async (token) => {
          const contract = new Contract(token.address, erc20Abi, provider);
          const rawBalance = await contract.balanceOf(sentinel.address);
          return {
            sentinel: sentinel.address,
            sentinelName: sentinel.name,
            symbol: token.symbol,
            address: token.address,
            decimals: token.decimals,
            priceId: token.priceId,
            amount: formatTokenAmount(rawBalance.toString(), token.decimals),
          };
        }),
      ),
    );

    const prices = await fetchPrices([
      process.env.MANTLE_NATIVE_PRICE_ID || DEFAULT_NATIVE_PRICE_ID,
      ...tokenAllowlist.map((token) => token.priceId).filter(Boolean),
    ] as string[]);

    const pricedTokenRows = priceTokenBalances(tokenBalanceRows, prices);
    const metrics = (aggregateValueMetrics as (input: {
      network: string;
      chainId: number;
      nativeBalances: typeof nativeBalances;
      tokenBalances: typeof pricedTokenRows;
      nativePriceUsd: number | null;
    }) => {
      network: string;
      chainId: number;
      source: string;
      totalUsd: number;
      native: { symbol: string; amount: string; usd: number | null };
      tokens: typeof pricedTokenRows;
      sentinels: typeof nativeBalances;
    })({
      network,
      chainId,
      nativeBalances,
      tokenBalances: pricedTokenRows,
      nativePriceUsd: prices[process.env.MANTLE_NATIVE_PRICE_ID || DEFAULT_NATIVE_PRICE_ID] ?? null,
    });

    return NextResponse.json({
      ...metrics,
      tokenAllowlist: tokenAllowlist.map((token) => ({
        symbol: token.symbol,
        address: token.address,
        decimals: token.decimals,
        priced: Boolean(token.priceId),
      })),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Value monitored metrics error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch value monitored metrics',
        source: 'mantle-rpc-readonly',
      },
      { status: 500 },
    );
  }
}
