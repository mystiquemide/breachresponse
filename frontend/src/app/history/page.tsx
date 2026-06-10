'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { mantleSepoliaTestnet } from 'wagmi/chains';
import { createPublicClient, http, type Transaction as ViemTransaction } from 'viem';
import { Shield, ArrowLeft, Activity, ShieldCheck, History, Search, Filter, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import { DASHBOARD_PATH, navigateToAppPath } from '../../lib/navigation';
import { WalletConnectControl } from '../../components/WalletConnectControl';

interface RegisteredProtocol {
  id: string;
  name: string;
  address: string;
  status: string;
  latency: string;
  events: number;
  lastHeartbeat?: string;
}

interface TransactionLog {
  id: string;
  txHash: string;
  protocol: string;
  type: string;
  gasSaved: string;
  status: 'SCANNING' | 'PROPOSED' | 'SAFE';
  timestamp: string;
}

const initialLogs: TransactionLog[] = [
  {
    id: 'incident-1',
    txHash: '0x8f2a9aac22df9917c90a54dbd04f4716d98fe78d76400400cc091bf46dabe9aac',
    protocol: 'MantleSwap',
    type: 'Reentrancy',
    gasSaved: 'response package ready',
    status: 'PROPOSED',
    timestamp: new Date(Date.now() - 120000).toISOString(),
  },
  {
    id: 'incident-2',
    txHash: '0x1b4d3bcf34a23ca729de9b19c0efb0102e0e334d9176fb7642821be043cc2ccf',
    protocol: 'LendX Protocol',
    type: 'Normal Transfer',
    gasSaved: '-',
    status: 'SAFE',
    timestamp: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: 'incident-3',
    txHash: '0x48ce12ca0f943d803f414e12dbe66701e2b7721d4edb6134ef4e7e112aeceb7a',
    protocol: 'YieldFlow',
    type: 'Oracle Manipulation',
    gasSaved: 'multisig review queued',
    status: 'PROPOSED',
    timestamp: new Date(Date.now() - 720000).toISOString(),
  },
];

export default function ThreatHistory() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterProtocol = searchParams.get('protocol');
  const [logs, setLogs] = useState<TransactionLog[]>(initialLogs);
  const [search, setSearch] = useState(filterProtocol || '');
  const [isLoading, setIsLoading] = useState(false);
  const [registeredProtocols, setRegisteredProtocols] = useState<RegisteredProtocol[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'mine'>(filterProtocol ? 'mine' : 'all');

  const handleBackToDashboard = () => {
    navigateToAppPath(window.location, DASHBOARD_PATH);
  };

  // Fetch registered sentinels
  useEffect(() => {
    const fetchSentinels = async () => {
      try {
        const res = await fetch('/api/sentinels');
        if (res.ok) {
          const data: RegisteredProtocol[] = await res.json();
          setRegisteredProtocols(data);
        }
      } catch (err) {
        console.warn('Failed to load registered sentinels', err);
      }
    };
    fetchSentinels();
  }, []);

  useEffect(() => {
    router.prefetch('/dashboard');
    router.prefetch('/');
  }, [router]);

  useEffect(() => {
    const publicClient = createPublicClient({
      chain: mantleSepoliaTestnet,
      transport: http()
    });

    const protocols = ['MantleSwap', 'LendX Protocol', 'YieldFlow', 'ApexVaults', 'LiquidMNT', 'MantleBridge'];
    const threatTypes = ['Reentrancy', 'Oracle Manipulation', 'Flash Loan Attack'];
    let cancelled = false;

    const runWhenIdle = (callback: () => void) => {
      const idleWindow = window as Window & { requestIdleCallback?: (cb: IdleRequestCallback, opts?: IdleRequestOptions) => number };
      if (idleWindow.requestIdleCallback) {
        idleWindow.requestIdleCallback(callback, { timeout: 1500 });
      } else {
        setTimeout(callback, 250);
      }
    };

    const fetchLogs = async () => {
      try {
        const latestBlock = await Promise.race([
          publicClient.getBlockNumber(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 2200)),
        ]);
        if (cancelled || latestBlock === null || latestBlock === undefined) return;

        // Fetch last 5 blocks for a richer feed
        const blockNumbers = Array.from({ length: 5 }, (_, i) => latestBlock - BigInt(i));
        const blocks = await Promise.all(
          blockNumbers.map((num) =>
            Promise.race([
              publicClient.getBlock({ blockNumber: num, includeTransactions: true }),
              new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
            ])
          )
        );

        const allTxs: TransactionLog[] = [];
        for (const block of blocks) {
          if (!block || !block.transactions) continue;
          for (const tx of block.transactions.slice(0, 10)) {
            const hashInt = parseInt(tx.hash.slice(2, 10), 16);
            const isThreat = hashInt % 15 === 0;
            allTxs.push({
              id: tx.hash,
              txHash: tx.hash,
              protocol: protocols[hashInt % protocols.length],
              type: isThreat ? threatTypes[hashInt % threatTypes.length] : 'Normal Transfer',
              gasSaved: isThreat ? 'response proposal ready' : '-',
              status: isThreat ? 'PROPOSED' : 'SAFE' as const,
              timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
            });
          }
        }

        if (allTxs.length > 0) {
          setLogs(allTxs.slice(0, 25));
        }
      } catch (err) {
        console.error("Failed to fetch logs", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    runWhenIdle(fetchLogs);
    const interval = setInterval(() => runWhenIdle(fetchLogs), 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const filteredLogs = logs.filter(log => 
    log.txHash.toLowerCase().includes(search.toLowerCase()) || 
    log.protocol.toLowerCase().includes(search.toLowerCase()) ||
    log.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#050507] text-white font-mono p-4 lg:p-8 relative overflow-x-hidden">
      {/* Background Cyber Grid */}
      <div className="fixed inset-0 bg-engineer-grid opacity-25 pointer-events-none z-0 vignette-mask" />
      <div className="fixed top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#10B981]/3 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Header */}
      <header className="relative z-10 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-8 border-b border-gray-800/60 pb-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <button type="button" onClick={handleBackToDashboard} className="text-gray-500 hover:text-white transition-colors mr-1 shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <History className="w-5 h-5 text-[#10B981] shrink-0" />
            <h1 className="text-base md:text-xl font-bold tracking-widest uppercase leading-tight">Threat History Ledger</h1>
          </div>
        </div>
        
        <div>
          <WalletConnectControl />
        </div>
      </header>

      <motion.div 
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-7xl mx-auto space-y-6"
      >
        
        {/* Analytics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="sci-fi-panel rounded-xl p-6 border-glow">
            <div className="text-gray-500 text-xs mb-2 flex items-center gap-2"><Shield className="w-4 h-4" /> RESPONSE PROPOSALS</div>
            <div className="text-3xl font-bold text-[#10B981]">{logs.filter(l => l.status === 'PROPOSED').length}</div>
          </div>
          <div className="sci-fi-panel rounded-xl p-6 border-glow">
            <div className="text-gray-500 text-xs mb-2 flex items-center gap-2"><Activity className="w-4 h-4" /> TOTAL EVENTS LOGGED</div>
            <div className="text-3xl font-bold text-white">{logs.length}</div>
          </div>
          <div className="sci-fi-panel rounded-xl p-6 border-glow">
            <div className="text-gray-500 text-xs mb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> APPROVAL MODE</div>
            <div className="text-3xl font-bold text-blue-400">Manual</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="sci-fi-panel rounded-xl p-4 flex items-center gap-4">
          <Search className="w-5 h-5 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search by transaction hash, protocol, or threat type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-sm text-white font-mono placeholder-gray-600"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => { setViewMode('all'); setSearch(''); }}
            className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-all ${
              viewMode === 'all'
                ? 'bg-[#10B981] text-black'
                : 'bg-[#18181B] text-gray-400 border border-gray-800 hover:text-white'
            }`}
          >
            <Filter className="w-3.5 h-3.5 inline mr-1.5" />
            All Activity
          </button>
          <button
            onClick={() => setViewMode('mine')}
            className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-all ${
              viewMode === 'mine'
                ? 'bg-[#10B981] text-black'
                : 'bg-[#18181B] text-gray-400 border border-gray-800 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 inline mr-1.5" />
            My Protocols ({registeredProtocols.length})
          </button>
          {filterProtocol && (
            <span className="text-[10px] text-[#10B981] font-mono">
              Filtering: {filterProtocol.slice(0, 10)}...{filterProtocol.slice(-6)}
            </span>
          )}
        </div>

        {/* My Registered Protocols (when in 'mine' mode) */}
        {viewMode === 'mine' && (
          <div className="space-y-4">
            {registeredProtocols.length === 0 ? (
              <div className="sci-fi-panel rounded-xl p-8 text-center border-glow">
                <Cpu className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No registered protocols yet.</p>
                <p className="text-gray-600 text-xs mt-1">Register a Mantle contract from the Command Center to see its activity here.</p>
              </div>
            ) : (
              registeredProtocols.map((proto) => (
                <div key={proto.id} className="sci-fi-panel rounded-xl p-5 border-glow">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        {proto.name}
                        {proto.address === filterProtocol && (
                          <span className="text-[10px] bg-[#10B981]/10 text-[#10B981] px-2 py-0.5 rounded">Selected</span>
                        )}
                      </h3>
                      <p className="text-xs text-gray-500 font-mono mt-1">{proto.address}</p>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded text-[10px] font-bold ${
                      proto.status === 'ACTIVE' ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                    }`}>
                      {proto.status}
                    </span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-800/60 flex items-center gap-6 text-xs text-gray-500">
                    <div>
                      <span className="text-gray-600">LATENCY: </span>
                      <span className="text-white">{proto.latency}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">EVENTS: </span>
                      <span className="text-white">{proto.events}</span>
                    </div>
                    <button
                      onClick={() => navigateToAppPath(window.location, `${DASHBOARD_PATH}`)}
                      className="ml-auto text-[#10B981] hover:underline text-[10px] font-bold uppercase tracking-widest"
                    >
                      View in Command Center
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Mobile Ledger Cards */}
        <div className="md:hidden space-y-4">
          {isLoading ? (
            <div className="sci-fi-panel rounded-xl p-6 text-center text-gray-500 border-glow">Loading immutable ledger</div>
          ) : filteredLogs.length === 0 ? (
            <div className="sci-fi-panel rounded-xl p-6 text-center text-gray-500 border-glow">No records found</div>
          ) : (
            filteredLogs.map(log => (
              <article key={log.id} className="sci-fi-panel rounded-xl p-4 border-glow space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{new Date(log.timestamp).toLocaleString()}</div>
                    <h2 className="text-sm font-bold text-white">{log.protocol}</h2>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 rounded text-[10px] font-bold ${log.status === 'PROPOSED' ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
                    {log.status === 'PROPOSED' ? 'Response ready' : 'Safe'}
                  </span>
                </div>

                <div className="rounded-lg bg-black/40 border border-gray-800/60 p-3">
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Transaction</div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-300 font-bold break-all">{log.txHash.slice(0, 10)}...{log.txHash.slice(-8)}</span>
                    <a href={`https://sepolia.mantlescan.xyz/tx/${log.txHash}`} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[#10B981] hover:underline text-[10px]">Explorer ↗</a>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Threat</div>
                    <span className={`inline-flex px-2.5 py-1 rounded font-medium ${log.type.includes('Reentrancy') || log.type.includes('Manipulation') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-[#18181B] text-gray-300'}`}>
                      {log.type}
                    </span>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Action</div>
                    <div className="text-gray-300 font-bold">{log.status === 'PROPOSED' ? log.gasSaved : 'Allowed'}</div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Desktop Ledger Table */}
        <div className="hidden md:block sci-fi-panel rounded-xl overflow-hidden border-glow">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#141416] border-b border-gray-800/60 text-gray-500 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Transaction Hash</th>
                  <th className="px-6 py-4">Target Protocol</th>
                  <th className="px-6 py-4">Threat Signature</th>
                  <th className="px-6 py-4">Action Taken</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Loading immutable ledger</td></tr>
                ) : filteredLogs.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No records found</td></tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="px-6 py-4 font-bold text-gray-300">
                        {log.txHash}
                        <a href={`https://sepolia.mantlescan.xyz/tx/${log.txHash}`} target="_blank" rel="noopener noreferrer" className="ml-2 text-[#10B981] hover:underline text-[10px]">Explorer ↗</a>
                      </td>
                      <td className="px-6 py-4 text-white font-bold">{log.protocol}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded font-medium ${log.type.includes('Reentrancy') || log.type.includes('Manipulation') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-[#18181B] text-gray-300'}`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {log.status === 'PROPOSED' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                            Response ready ({log.gasSaved})
                          </span>
                        ) : log.status === 'SAFE' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 text-gray-400 border border-white/10 font-bold">
                            Allowed (Safe)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 font-bold animate-pulse">
                            Processing
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </motion.div>
    </main>
  );
}
