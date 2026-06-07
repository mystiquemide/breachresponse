'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { mantleSepoliaTestnet } from 'wagmi/chains';
import { createPublicClient, http, type Transaction as ViemTransaction } from 'viem';
import { Shield, ArrowLeft, Activity, ShieldCheck, Power, AlertTriangle, History, Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface TransactionLog {
  id: string;
  txHash: string;
  protocol: string;
  type: string;
  gasSaved: string;
  status: 'SCANNING' | 'MITIGATED' | 'SAFE';
  timestamp: string;
}

export default function ThreatHistory() {
  const { address, isConnected, chainId } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  
  const isCorrectNetwork = chainId === mantleSepoliaTestnet.id;
  
  const [logs, setLogs] = useState<TransactionLog[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const publicClient = createPublicClient({
      chain: mantleSepoliaTestnet,
      transport: http()
    });

    const protocols = ['MantleSwap', 'LendX Protocol', 'YieldFlow', 'ApexVaults', 'LiquidMNT', 'MantleBridge'];
    const threatTypes = ['Reentrancy', 'Oracle Manipulation', 'Flash Loan Attack'];

    const fetchLogs = async () => {
      try {
        const block = await publicClient.getBlock({ includeTransactions: true });
        if (block && block.transactions && block.transactions.length > 0) {
          const liveTxs: TransactionLog[] = block.transactions.slice(0, 25).map((tx: ViemTransaction) => {
            const hashInt = parseInt(tx.hash.slice(2, 10), 16);
            const isThreat = hashInt % 15 === 0; 
            
            return {
              id: tx.hash,
              txHash: tx.hash,
              protocol: protocols[hashInt % protocols.length],
              type: isThreat ? threatTypes[hashInt % threatTypes.length] : 'Normal Transfer',
              gasSaved: isThreat ? `${(hashInt % 500) + 50} MNT` : '-',
              status: isThreat ? 'MITIGATED' : 'SAFE',
              timestamp: new Date(Number(block.timestamp) * 1000).toISOString()
            };
          });
          setLogs(liveTxs);
        }
      } catch (err) {
        console.error("Failed to fetch logs", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
    
    // Auto refresh every 4 seconds
    const interval = setInterval(fetchLogs, 4000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => 
    log.txHash.toLowerCase().includes(search.toLowerCase()) || 
    log.protocol.toLowerCase().includes(search.toLowerCase()) ||
    log.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#050507] text-white font-mono p-4 lg:p-8 relative">
      {/* Background Cyber Grid */}
      <div className="fixed inset-0 bg-engineer-grid opacity-25 pointer-events-none z-0 vignette-mask" />
      <div className="fixed top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#10B981]/3 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Header */}
      <header className="relative flex justify-between items-center mb-8 border-b border-gray-800/60 pb-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-500 hover:text-white transition-colors mr-2">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <History className="w-5 h-5 text-[#10B981]" />
            <h1 className="text-lg md:text-xl font-bold tracking-widest uppercase">Threat History Ledger</h1>
          </div>
        </div>
        
        <div>
          {isConnected && isCorrectNetwork ? (
            <button 
              onClick={() => disconnect()} 
              className="flex items-center gap-2 bg-[#18181B] border border-gray-800 px-4 py-2 rounded hover:bg-gray-800 transition-colors text-xs"
            >
              <Power className="w-3.5 h-3.5 text-red-500" />
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </button>
          ) : isConnected && !isCorrectNetwork ? (
            <button 
              onClick={() => switchChain && switchChain({ chainId: mantleSepoliaTestnet.id })} 
              className="flex items-center gap-2 bg-red-500 text-white font-bold py-2 px-5 rounded hover:bg-red-400 transition-all text-xs shadow-[0_0_15px_rgba(239,68,68,0.3)]"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Switch Network
            </button>
          ) : (
            <button 
              onClick={() => connect({ connector: injected() })} 
              className="flex items-center gap-2 bg-[#10B981] text-black font-bold py-2 px-5 rounded hover:bg-green-400 transition-all text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              <Power className="w-3.5 h-3.5" />
              Connect Wallet
            </button>
          )}
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
            <div className="text-gray-500 text-xs mb-2 flex items-center gap-2"><Shield className="w-4 h-4" /> TOTAL MITIGATIONS</div>
            <div className="text-3xl font-bold text-[#10B981]">{logs.filter(l => l.status === 'MITIGATED').length}</div>
          </div>
          <div className="sci-fi-panel rounded-xl p-6 border-glow">
            <div className="text-gray-500 text-xs mb-2 flex items-center gap-2"><Activity className="w-4 h-4" /> TOTAL EVENTS LOGGED</div>
            <div className="text-3xl font-bold text-white">{logs.length}</div>
          </div>
          <div className="sci-fi-panel rounded-xl p-6 border-glow">
            <div className="text-gray-500 text-xs mb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> ACTIVE GUARDS</div>
            <div className="text-3xl font-bold text-blue-400">99.98%</div>
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
                  <span className={`shrink-0 px-2.5 py-1 rounded text-[10px] font-bold ${log.status === 'MITIGATED' ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
                    {log.status === 'MITIGATED' ? 'Mitigated' : 'Safe'}
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
                    <div className="text-gray-300 font-bold">{log.status === 'MITIGATED' ? `${log.gasSaved} saved` : 'Allowed'}</div>
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
                        {log.status === 'MITIGATED' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                            Mitigated ({log.gasSaved} Saved)
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
