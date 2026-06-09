const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

export function formatTokenAmount(rawValue, decimals) {
  const value = BigInt(rawValue ?? '0');
  const precision = BigInt(10) ** BigInt(decimals);
  const whole = value / precision;
  const fraction = value % precision;

  if (fraction === 0n) return whole.toString();

  const fractionText = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');
  return `${whole.toString()}.${fractionText}`;
}

export function parseTokenAllowlist(rawAllowlist = '') {
  const trimmed = rawAllowlist.trim();
  if (!trimmed) return [];

  return trimmed.split(',').map((entry) => {
    const [rawSymbol, rawAddress, rawDecimals, rawPriceId] = entry.split(':').map((part) => part?.trim());
    const symbol = rawSymbol?.toUpperCase();
    const address = rawAddress;

    if (!symbol || !address || !ADDRESS_PATTERN.test(address)) {
      throw new Error(`Invalid token allowlist entry: ${entry}`);
    }

    const decimals = Number(rawDecimals);
    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) {
      throw new Error(`Invalid token decimals for ${symbol}`);
    }

    return {
      symbol,
      address,
      decimals,
      priceId: rawPriceId || undefined,
    };
  });
}

export function priceTokenBalances(tokenBalances, pricesById = {}) {
  return tokenBalances.map((token) => {
    const price = token.priceId ? pricesById[token.priceId] : undefined;
    const numericAmount = Number(token.amount);
    const usd = Number.isFinite(price) && Number.isFinite(numericAmount)
      ? Number((numericAmount * price).toFixed(6))
      : null;

    return {
      ...token,
      usd,
    };
  });
}

export function aggregateValueMetrics({ network, chainId, nativeBalances = [], tokenBalances = [], nativePriceUsd = null }) {
  const totalNativeWei = nativeBalances.reduce((sum, balance) => sum + BigInt(balance.wei ?? '0'), 0n);
  const nativeAmount = formatTokenAmount(totalNativeWei.toString(), 18);
  const nativeUsd = Number.isFinite(nativePriceUsd) ? Number((Number(nativeAmount) * nativePriceUsd).toFixed(6)) : null;
  const tokenUsd = tokenBalances.reduce((sum, token) => sum + (Number.isFinite(token.usd) ? token.usd : 0), 0);
  const totalUsd = Number(((nativeUsd ?? 0) + tokenUsd).toFixed(6));

  return {
    network,
    chainId,
    source: 'mantle-rpc-readonly',
    totalUsd,
    native: {
      symbol: 'MNT',
      amount: nativeAmount,
      usd: nativeUsd,
    },
    tokens: tokenBalances,
    sentinels: nativeBalances,
  };
}

export function summarizeValueMetrics(metrics) {
  const tokenSummary = (metrics.tokens || [])
    .filter((token) => Number(token.amount) > 0)
    .slice(0, 3)
    .map((token) => `${token.amount} ${token.symbol}`);

  return [
    `${metrics.native?.amount ?? '0'} ${metrics.native?.symbol ?? 'MNT'}`,
    ...tokenSummary,
  ].join(' + ');
}
