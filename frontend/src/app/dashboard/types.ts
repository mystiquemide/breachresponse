export interface Asset {
  id: string;
  name: string;
  address: string;
  status: 'ACTIVE' | 'PAUSED' | 'MITIGATING';
  latency: string;
  events: number;
  lastHeartbeat?: string;
}

export interface ValueMetrics {
  network: string;
  chainId: number;
  source: string;
  totalUsd: number;
  native: {
    symbol: string;
    amount: string;
    usd: number | null;
  };
  tokens: Array<{
    symbol: string;
    amount: string;
    usd: number | null;
  }>;
  updatedAt?: string;
}

export const capTerminal = (lines: string[]) => lines.slice(-120);
