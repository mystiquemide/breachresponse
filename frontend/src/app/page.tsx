'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Target, Zap, ArrowRight, Lock, Activity, Hexagon, Component, CheckCircle2, Power, AlertTriangle, Terminal, Layers, Cpu, ShieldCheck } from 'lucide-react';
import { useAccount, useConnect, useSwitchChain, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { mantleSepoliaTestnet } from 'wagmi/chains';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

interface Transaction {
  id: string;
  txHash: string;
  protocol: string;
  type: string;
  gasSaved: string;
  status: 'SCANNING' | 'MITIGATED' | 'SAFE';
  timestamp: string;
}

const initialTransactions: Transaction[] = [
  {
    id: '1',
    txHash: '0x8f2a...9aac',
    protocol: 'MantleSwap',
    type: 'Reentrancy',
    gasSaved: '145,000 MNT',
    status: 'MITIGATED',
    timestamp: '2 mins ago'
  },
  {
    id: '2',
    txHash: '0x1b4d...2ccf',
    protocol: 'LendX Protocol',
    type: 'Normal Tx',
    gasSaved: '0 MNT',
    status: 'SAFE',
    timestamp: '5 mins ago'
  },
  {
    id: '3',
    txHash: '0x48ce...eB7a',
    protocol: 'YieldFlow',
    type: 'Oracle Manipulation',
    gasSaved: '320,000 MNT',
    status: 'MITIGATED',
    timestamp: '12 mins ago'
  }
];

export default function LandingPage() {
  const [terminalStep, setTerminalStep] = useState(0);
  const [codeTab, setCodeTab] = useState<'python' | 'typescript'>('python');
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);

  const { address, isConnected, chainId } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const isCorrectNetwork = chainId === mantleSepoliaTestnet.id;

  const handleAccess = () => {
    if (!isConnected) {
      connect({ connector: injected() });
    } else if (!isCorrectNetwork && switchChain) {
      switchChain({ chainId: mantleSepoliaTestnet.id });
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTerminalStep((prev) => (prev < 3 ? prev + 1 : 0));
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/logs');
        if (!res.ok) return;
        const data: Transaction[] = await res.json();
        
        setTransactions(data.slice(0, 5));
      } catch (err) {
        console.error("Failed to fetch landing ledger logs", err);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-[#050507] text-white font-mono overflow-x-hidden selection:bg-[#10B981] selection:text-black relative">
      <div className="fixed inset-0 bg-engineer-grid opacity-20 pointer-events-none z-0 vignette-mask" />
      
      <div className="fixed top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#10B981]/3 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="fixed bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-[#10B981]/2 rounded-full blur-[150px] pointer-events-none z-0" />
      
      <nav className="absolute w-full flex justify-between items-center py-6 px-8 md:px-16 z-50">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="BreachResponse Logo" className="w-8 h-8 object-contain" />
          <span className="text-lg font-bold tracking-widest text-white drop-shadow-md">BREACH RESPONSE</span>
        </div>
        <div className="hidden md:flex gap-8 text-xs tracking-widest uppercase font-bold text-gray-300 drop-shadow-md">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <a href="https://docs.mantle.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Documentation</a>
        </div>
        <div>
          {!isConnected ? (
            <button 
              onClick={handleAccess}
              className="bg-[#10B981] text-black px-6 py-2.5 rounded text-sm font-bold hover:bg-green-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all shadow-lg flex items-center gap-2"
            >
              <Power className="w-4 h-4" /> Connect Wallet
            </button>
          ) : !isCorrectNetwork ? (
             <button 
              onClick={handleAccess}
              className="bg-red-500 text-white px-6 py-2.5 rounded text-sm font-bold hover:bg-red-400 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all shadow-lg flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" /> Switch Network
            </button>
          ) : (
            <div className="flex gap-4 items-center">
              <button 
                onClick={() => disconnect()}
                className="text-xs text-gray-500 hover:text-red-500 transition-colors"
              >
                Disconnect
              </button>
              <Link 
                href="/dashboard"
                className="bg-black/50 backdrop-blur-md border border-white/20 text-white px-6 py-2.5 rounded text-sm font-bold hover:border-[#10B981] hover:text-[#10B981] transition-all shadow-lg"
              >
                Command Center
              </Link>
            </div>
          )}
        </div>
      </nav>

      <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-[#050505]">
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-20">
          <svg width="840" height="840" viewBox="0 0 840 840" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[120%] h-[120%] max-w-none md:w-[840px] md:h-[840px]">
            <circle cx="420" cy="420" r="100" stroke="#10B981" strokeWidth="1" strokeDasharray="4 8" className="opacity-40" />
            <circle cx="420" cy="420" r="220" stroke="#10B981" strokeWidth="1" className="opacity-20" />
            <circle cx="420" cy="420" r="340" stroke="#10B981" strokeWidth="1" strokeDasharray="10 15" className="opacity-30" />
            <circle cx="420" cy="420" r="380" stroke="#10B981" strokeWidth="1" className="opacity-20" />
            <path d="M 170 170 L 670 670" stroke="#10B981" strokeWidth="1" className="opacity-25" />
            <path d="M 670 170 L 170 670" stroke="#10B981" strokeWidth="1" strokeDasharray="5 5" className="opacity-15" />
            <path d="M 420 40 L 420 800" stroke="#10B981" strokeWidth="1" className="opacity-10" />
            <path d="M 40 420 L 800 420" stroke="#10B981" strokeWidth="1" className="opacity-10" />
            <circle cx="300" cy="300" r="4" fill="#10B981" className="opacity-60" />
            <circle cx="600" cy="600" r="3" fill="#10B981" className="opacity-40" />
            <circle cx="270" cy="570" r="5" fill="#10B981" className="opacity-50" />
            <circle cx="540" cy="300" r="4" fill="#10B981" className="opacity-70" />
            <line x1="420" y1="220" x2="430" y2="220" stroke="#10B981" strokeWidth="2" className="opacity-40" />
            <line x1="420" y1="620" x2="430" y2="620" stroke="#10B981" strokeWidth="2" className="opacity-40" />
            <line x1="220" y1="420" x2="220" y2="430" stroke="#10B981" strokeWidth="2" className="opacity-40" />
            <line x1="620" y1="420" x2="620" y2="430" stroke="#10B981" strokeWidth="2" className="opacity-40" />
            <text x="420" y="25" fill="#10B981" fontSize="9" fontFamily="monospace" textAnchor="middle" className="opacity-50 font-bold">000</text>
            <text x="420" y="828" fill="#10B981" fontSize="9" fontFamily="monospace" textAnchor="middle" className="opacity-50 font-bold">180</text>
            <text x="834" y="423" fill="#10B981" fontSize="9" fontFamily="monospace" textAnchor="start" className="opacity-50 font-bold">090</text>
            <text x="6" y="423" fill="#10B981" fontSize="9" fontFamily="monospace" textAnchor="end" className="opacity-50 font-bold">270</text>
            <text x="695" y="145" fill="#10B981" fontSize="8" fontFamily="monospace" textAnchor="middle" className="opacity-30">045</text>
            <text x="695" y="705" fill="#10B981" fontSize="8" fontFamily="monospace" textAnchor="middle" className="opacity-30">135</text>
            <text x="145" y="705" fill="#10B981" fontSize="8" fontFamily="monospace" textAnchor="middle" className="opacity-30">225</text>
            <text x="145" y="145" fill="#10B981" fontSize="8" fontFamily="monospace" textAnchor="middle" className="opacity-30">315</text>
            {Array.from({ length: 36 }).map((_, i) => {
              const angle = (i * 10 * Math.PI) / 180;
              const x1 = 420 + 380 * Math.cos(angle);
              const y1 = 420 + 380 * Math.sin(angle);
              const x2 = 420 + (380 - (i % 3 === 0 ? 8 : 4)) * Math.cos(angle);
              const y2 = 420 + (380 - (i % 3 === 0 ? 8 : 4)) * Math.sin(angle);
              return (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#10B981" strokeWidth="1" className={i % 3 === 0 ? "opacity-30" : "opacity-15"} />
              );
            })}
          </svg>
        </div>
        
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#09090B] via-transparent to-[#09090B] pointer-events-none" />
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.12)_0%,rgba(9,9,11,1)_85%)] pointer-events-none" />

        <div className="relative z-10 w-full max-w-5xl px-8 mt-20 mb-32 flex flex-col items-center">
          <motion.div initial="initial" animate="animate" variants={fadeInUp} className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight tracking-tight text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              Breach Response
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-sans">
              The active immune system for mantle network smart contracts
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 80, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto w-full max-w-4xl"
            style={{ perspective: '1000px' }}
          >
            <div className="absolute -inset-0.5 bg-gradient-to-b from-[#10B981] to-transparent rounded-3xl opacity-30" />
            <div 
              className="relative bg-[#09090B]/95 border border-[#10B981]/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col transform-gpu transition-transform hover:scale-[1.01] duration-700"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="bg-white/5 border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#10B981]/80 shadow-[0_0_10px_rgba(16,185,129,1)]" />
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                </div>
                <div className="text-xs tracking-widest text-[#10B981] font-bold">NODE :: ONLINE</div>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-black/60 border border-white/10 rounded-xl p-6 relative overflow-hidden group shadow-inner">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06)_0%,transparent_70%)] pointer-events-none" />
                  <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-20">
                    <svg width="300" height="300" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[120%] h-[120%] max-w-none">
                      <circle cx="150" cy="150" r="40" stroke="#10B981" strokeWidth="1" strokeDasharray="2 4" />
                      <circle cx="150" cy="150" r="80" stroke="#10B981" strokeWidth="1" className="opacity-60" />
                      <circle cx="150" cy="150" r="120" stroke="#10B981" strokeWidth="1" strokeDasharray="5 5" className="opacity-40" />
                      <line x1="150" y1="10" x2="150" y2="290" stroke="#10B981" strokeWidth="0.5" className="opacity-30" />
                      <line x1="10" y1="150" x2="290" y2="150" stroke="#10B981" strokeWidth="0.5" className="opacity-30" />
                      <line x1="150" y1="30" x2="155" y2="30" stroke="#10B981" strokeWidth="1" />
                      <line x1="150" y1="270" x2="155" y2="270" stroke="#10B981" strokeWidth="1" />
                      <g className="origin-[150px_150px] animate-[spin_6s_linear_infinite]">
                        <line x1="150" y1="150" x2="270" y2="30" stroke="#10B981" strokeWidth="1.5" className="opacity-80" />
                        <polygon points="150,150 270,30 260,10" fill="url(#radar-sweep-gradient)" className="opacity-10 pointer-events-none" />
                      </g>
                      <circle cx="210" cy="110" r="3" fill="#10B981" className="opacity-80" />
                      <circle cx="90" cy="190" r="2.5" fill="#10B981" className="opacity-50" />
                      <circle cx="180" cy="220" r="3" fill="#10B981" className="opacity-40" />
                      <defs>
                        <linearGradient id="radar-sweep-gradient" x1="150" y1="150" x2="270" y2="30" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#10B981" stopOpacity="1" />
                          <stop offset="1" stopColor="#10B981" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 font-mono text-[8px] text-gray-600 pointer-events-none select-none z-10 hidden sm:flex">
                    <span className="text-[7px] text-[#10B981] font-bold">138E</span>
                    <div className="w-1.5 h-32 bg-white/5 rounded relative border border-white/10 flex items-center justify-center">
                      <div className="absolute top-[30%] left-0 right-0 h-0.5 bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,1)]" />
                      <span className="absolute -left-3.5 top-0">5</span>
                      <span className="absolute -left-3.5 top-[20%]">4</span>
                      <span className="absolute -left-3.5 top-[40%]">3</span>
                      <span className="absolute -left-3.5 top-[60%]">2</span>
                      <span className="absolute -left-3.5 top-[80%]">1</span>
                      <span className="absolute -left-3.5 bottom-0">0</span>
                    </div>
                    <span className="text-[6px] text-gray-500 uppercase tracking-widest mt-1">LVL</span>
                  </div>
                    <div className="flex items-center justify-between font-mono text-xs mb-3 text-[#10B981]">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 animate-pulse" />
                        <span>MEMPOOL ACTIVE</span>
                      </div>
                      <div className="text-gray-500">Scanning pending blocks</div>
                    </div> 
                  <div className="relative z-10 sm:pl-8">
                    <h3 className="text-white font-bold mb-6 flex items-center gap-2 text-lg"><Target className="w-5 h-5 text-[#10B981]" /> Mempool Radar</h3>
                    <div className="space-y-4 font-mono text-sm">
                      <div className="text-gray-400 flex justify-between bg-white/5 p-2 rounded"><span>Tx: 0x8f2...9aa</span> <span className="text-[#10B981]">SAFE</span></div>
                      <div className="text-gray-400 flex justify-between bg-white/5 p-2 rounded"><span>Tx: 0x1b4...2cc</span> <span className="text-[#10B981]">SAFE</span></div>
                      <div className="text-yellow-500 flex justify-between bg-yellow-500/10 p-2 rounded animate-pulse border border-yellow-500/30"><span>Tx: 0x48c...eB7</span> <span>ANALYZING</span></div>
                    </div>
                  </div>
                </div>
                <div className="bg-black/60 border border-white/10 rounded-xl p-6 flex flex-col justify-between shadow-inner">
                  <div>
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-lg"><Shield className="w-5 h-5 text-[#10B981]" /> Defense Matrix</h3>
                    <p className="text-sm text-gray-400 mb-8 leading-relaxed font-sans">
                      Byreal Skills AI models standing by for counter-payload formulation. Instant threat mitigation enabled
                    </p>
                  </div>
                  <Link href="/dashboard" className="w-full py-4 rounded-lg bg-[#10B981] text-black text-center font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] hover:bg-white transition-all transform hover:-translate-y-0.5">
                    Enter Command Center
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-40 z-30 bg-gradient-to-t from-[#050507] to-transparent pointer-events-none" />
      </div>

      <section className="py-8 border-y border-gray-900 bg-black/10 overflow-hidden flex whitespace-nowrap items-center relative z-40">
        <div className="max-w-7xl mx-auto px-8 md:px-16 flex justify-between items-center w-full text-gray-500 font-bold tracking-widest text-sm uppercase">
          <span className="flex items-center gap-2"><Hexagon className="w-4 h-4" /> Mantle Network</span>
          <span className="flex items-center gap-2"><Layers className="w-4 h-4" /> DeFi Protocols</span>
          <span className="flex items-center gap-2"><Component className="w-4 h-4" /> Smart Contracts</span>
          <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> Enterprise Wallets</span>
        </div>
      </section>

      <section className="py-24 px-8 md:px-16 max-w-6xl mx-auto relative z-40 bg-black/10 backdrop-blur-[1px] border-t border-gray-900/30">
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Pipeline Execution</h2>
          <p className="text-gray-400 font-sans max-w-2xl mx-auto mb-16">
            Three sequential stages of real-time smart contract defense on Mantle Network
          </p>
        </div>
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 items-start">
          <div className="hidden md:block absolute top-[52px] left-[15%] right-[15%] h-px border-t-2 border-dashed border-[#10B981]/20 -z-10" />
          <div className="flex flex-col items-center text-center px-4 relative">
            <div className="w-16 h-16 rounded-full bg-[#18181B] border-2 border-[#10B981] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(16,185,129,0.15)] relative overflow-hidden group">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#10B981]">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.2" className="opacity-40" />
                <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="0.8" className="opacity-20" />
                <line x1="12" y1="12" x2="21" y2="7" stroke="currentColor" strokeWidth="1.2" className="origin-[12px_12px] animate-[spin_5s_linear_infinite]" />
                <circle cx="16" cy="15" r="1" fill="currentColor" />
              </svg>
            </div>
            <span className="text-xs text-[#10B981] font-bold tracking-widest mb-2 block uppercase">01 / Monitor</span>
            <h3 className="text-lg font-bold text-white mb-3">Mempool Scan</h3>
            <p className="text-xs text-gray-400 font-sans leading-relaxed">
              We monitor the unconfirmed transactions of Mantle Network, inspecting operations before block generation
            </p>
          </div>
          <div className="flex flex-col items-center text-center px-4 relative">
            <div className="w-16 h-16 rounded-full bg-[#18181B] border-2 border-[#10B981] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#10B981]">
                <line x1="6" y1="6" x2="12" y2="12" stroke="currentColor" strokeWidth="1" className="opacity-40" />
                <line x1="18" y1="6" x2="12" y2="12" stroke="currentColor" strokeWidth="1" className="opacity-40" />
                <line x1="6" y1="18" x2="12" y2="12" stroke="currentColor" strokeWidth="1" className="opacity-40" />
                <line x1="18" y1="18" x2="12" y2="12" stroke="currentColor" strokeWidth="1" className="opacity-40" />
                <line x1="6" y1="6" x2="18" y2="6" stroke="currentColor" strokeWidth="0.8" className="opacity-20" />
                <line x1="6" y1="18" x2="18" y2="18" stroke="currentColor" strokeWidth="0.8" className="opacity-20" />
                <circle cx="12" cy="12" r="3.5" fill="currentColor" className="animate-pulse" />
                <circle cx="6" cy="6" r="2" fill="currentColor" />
                <circle cx="18" cy="6" r="2" fill="currentColor" />
                <circle cx="6" cy="18" r="2" fill="currentColor" />
                <circle cx="18" cy="18" r="2" fill="currentColor" />
              </svg>
            </div>
            <span className="text-xs text-[#10B981] font-bold tracking-widest mb-2 block uppercase">02 / Formulate</span>
            <h3 className="text-lg font-bold text-white mb-3">AI Formulation</h3>
            <p className="text-xs text-gray-400 font-sans leading-relaxed">
              If an exploit pattern is identified, our Byreal Skills AI dynamically models a custom rescue transaction
            </p>
          </div>
          <div className="flex flex-col items-center text-center px-4 relative">
            <div className="w-16 h-16 rounded-full bg-[#18181B] border-2 border-[#10B981] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#10B981]">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.2" className="opacity-30" />
                <path d="M 12 3 L 12 6" stroke="currentColor" strokeWidth="1.2" />
                <path d="M 12 18 L 12 21" stroke="currentColor" strokeWidth="1.2" />
                <path d="M 3 12 L 6 12" stroke="currentColor" strokeWidth="1.2" />
                <path d="M 18 12 L 21 12" stroke="currentColor" strokeWidth="1.2" />
                <rect x="9.5" y="9.5" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.2" className="origin-center animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
              </svg>
            </div>
            <span className="text-xs text-[#10B981] font-bold tracking-widest mb-2 block uppercase">03 / Intercept</span>
            <h3 className="text-lg font-bold text-white mb-3">Payload Dispatch</h3>
            <p className="text-xs text-gray-400 font-sans leading-relaxed">
              The mitigation payload is routed directly to your protocol rescue keys, securing funds instantly
            </p>
          </div>
        </div>
      </section>

      <section id="features" className="py-32 px-8 md:px-16 max-w-6xl mx-auto relative z-40 bg-transparent">
        <motion.div initial="initial" whileInView="animate" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp} className="container mx-auto px-6 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Built for scale</h2>
          <p className="text-xl text-gray-400 mb-16 max-w-2xl mx-auto font-sans text-sm">
            Traditional security platforms rely on alerting you after the funds are stolen. We formulate the counter transaction before the attacker's block is confirmed
          </p>
        </motion.div>
        <motion.div variants={staggerContainer} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-50px" }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div variants={fadeInUp}>
            <div className="p-8 rounded-2xl bg-[#09090B] border border-gray-800 relative group hover:border-[#10B981]/50 transition-colors">
              <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mb-6 border border-gray-800 text-[#10B981]">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Mempool Interception</h3>
              <p className="text-sm text-gray-400 leading-relaxed font-sans">Deep inspection of unconfirmed transactions on the Mantle Sepolia network using strictly defined Web3.py filters</p>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-800/60 font-mono text-[10px] space-y-2 text-gray-500">
              <div className="flex justify-between"><span>SCAN_RATE</span> <span className="text-gray-400">1,200 tx/sec</span></div>
              <div className="flex justify-between"><span>LATENCY</span> <span className="text-[#10B981]">{"< 8ms"}</span></div>
            </div>
          </motion.div>
          <motion.div variants={fadeInUp}>
            <div className="p-8 rounded-2xl bg-[#09090B] border border-gray-800 relative group hover:border-[#10B981]/50 transition-colors">
              <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mb-6 border border-gray-800 text-[#10B981]">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">AI Payload Formulation</h3>
              <p className="text-sm text-gray-400 leading-relaxed font-sans">Dynamically formulates complex pause and rescue transaction payloads the moment an anomaly crosses the threshold</p>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-800/60 font-mono text-[10px] space-y-2 text-gray-500">
              <div className="flex justify-between"><span>MODEL</span> <span className="text-gray-400">byreal-core-v1</span></div>
              <div className="flex justify-between"><span>ACCURACY</span> <span className="text-[#10B981]">99.98%</span></div>
            </div>
          </motion.div>
          <motion.div variants={fadeInUp}>
            <div className="p-8 rounded-2xl bg-[#09090B] border border-gray-800 relative group hover:border-[#10B981]/50 transition-colors">
              <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mb-6 border border-gray-800 text-[#10B981]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Instant Execution</h3>
              <p className="text-sm text-gray-400 leading-relaxed font-sans">Our Command Center routes the rescue payload directly to your multisig for instant localized execution</p>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-800/60 font-mono text-[10px] space-y-2 text-gray-500">
              <div className="flex justify-between">
                <span>PAUSE_TIME</span>
                <span className="text-gray-400">1 block</span>
              </div>
              <div className="flex justify-between">
                <span>DISPATCH</span>
                <span className="text-[#10B981]">AUTO / MANUAL</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Interactive Integration Code Terminal */}
      <section className="py-24 px-8 md:px-16 max-w-6xl mx-auto relative z-40 bg-transparent">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Developer first</h2>
            <p className="text-gray-400 mb-8 font-sans leading-relaxed text-sm">
              Deploying Breach Response is straightforward Install the package, hook up your contract sentinel, and let the AI guard system secure your transaction state No complex infrastructure necessary
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
                <span className="text-sm text-gray-300 font-sans">Full support for Python (Web3.py) and TypeScript (viem)</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
                <span className="text-sm text-gray-300 font-sans">Simple JSON configuration for custom alert endpoints</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
                <span className="text-sm text-gray-300 font-sans">Direct integration with multisig and emergency pause guards</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0C0C0E] border border-gray-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
            {/* Terminal Window Header */}
            <div className="bg-[#141416] border-b border-gray-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCodeTab('python')}
                  className={`text-xs px-3 py-1.5 rounded font-mono font-bold transition-all ${codeTab === 'python' ? 'bg-[#09090B] text-[#10B981] border border-gray-800' : 'text-gray-500 hover:text-white'}`}
                >
                  sentinel.py
                </button>
                <button 
                  onClick={() => setCodeTab('typescript')}
                  className={`text-xs px-3 py-1.5 rounded font-mono font-bold transition-all ${codeTab === 'typescript' ? 'bg-[#09090B] text-[#10B981] border border-gray-800' : 'text-gray-500 hover:text-white'}`}
                >
                  sentinel.ts
                </button>
              </div>
              <span className="text-[10px] text-gray-500 tracking-widest font-bold uppercase">SDK v1.2.0</span>
            </div>

            {/* Terminal Window Code Content */}
            <div className="p-6 overflow-x-auto text-xs font-mono min-h-[240px] leading-relaxed text-gray-300">
              {codeTab === 'python' ? (
                <pre className="space-y-1">
                  <div><span className="text-gray-500">{"# Import the BreachResponse engine"}</span></div>
                  <div><span className="text-[#10B981]">{"from"}</span>{" breachresponse "}<span className="text-[#10B981]">{"import"}</span>{" Shield"}</div>
                  <div><span className="text-[#10B981]">{"from"}</span>{" breachresponse.guards "}<span className="text-[#10B981]">{"import"}</span>{" ReentrancyGuard"}</div>
                  <br />
                  <div><span className="text-gray-500">{"# Configure provider credentials"}</span></div>
                  <div>{"sentinel = Shield("}</div>
                  <div>{"    provider_uri="}<span className="text-[#10B981]">{'"https://rpc.sepolia.mantle.xyz"'}</span>{","}</div>
                  <div>{"    private_key="}<span className="text-[#10B981]">{'"0x..."'}</span></div>
                  <div>{")"}</div>
                  <br />
                  <div><span className="text-gray-500">{"# Attach reentrancy alert sentinel"}</span></div>
                  <div>{"sentinel.attach(ReentrancyGuard(target="}<span className="text-[#10B981]">{'"0x..."'}</span>{"))"}</div>
                  <div>{"sentinel.start()"}</div>
                </pre>
              ) : (
                <pre className="space-y-1">
                  <div><span className="text-gray-500">{"// Import the BreachResponse engine"}</span></div>
                  <div><span className="text-[#10B981]">{"import"}</span>{" { BreachShield } "}<span className="text-[#10B981]">{"from"}</span>{" "}<span className="text-[#10B981]">{'"@breachresponse/sdk"'}</span>{";"}</div>
                  <div><span className="text-[#10B981]">{"import"}</span>{" { ReentrancyGuard } "}<span className="text-[#10B981]">{"from"}</span>{" "}<span className="text-[#10B981]">{'"@breachresponse/sdk/guards"'}</span>{";"}</div>
                  <br />
                  <div><span className="text-gray-500">{"// Configure provider credentials"}</span></div>
                  <div><span className="text-[#10B981]">{"const"}</span>{" shield = "}<span className="text-[#10B981]">{"new"}</span>{" BreachShield({"}</div>
                  <div>{"  rpcUrl: "}<span className="text-[#10B981]">{'"https://rpc.sepolia.mantle.xyz"'}</span>{","}</div>
                  <div>{"  privateKey: "}<span className="text-[#10B981]">{'"0x..."'}</span></div>
                  <div>{"});"}</div>
                  <br />
                  <div><span className="text-gray-500">{"// Attach reentrancy alert sentinel"}</span></div>
                  <div>{"shield.attach("}<span className="text-[#10B981]">{"new"}</span>{" ReentrancyGuard("}<span className="text-[#10B981]">{'"0x..."'}</span>{"));"}</div>
                  <div><span className="text-[#10B981]">{"await"}</span>{" shield.start();"}</div>
                </pre>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Live Simulated Threat Ledger */}
      <section className="py-24 px-8 md:px-16 max-w-6xl mx-auto relative z-40 bg-black/10 backdrop-blur-[1px] border-t border-gray-900/30">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#101014]/60 border border-gray-800/80 mb-4 text-xs font-bold text-[#10B981]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            LIVE SCAN MONITORING
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Defense Matrix Ledger</h2>
          <p className="text-gray-400 max-w-xl mx-auto font-sans text-sm">
            Real-time block scanning log demonstrating proactive threat mitigation on Mantle Network.
          </p>
        </div>

        <div className="bg-[#101014]/40 backdrop-blur-md border border-gray-800/80 rounded-xl overflow-hidden shadow-2xl border-glow">
          {/* Table Header */}
          <div className="bg-[#101014]/80 border-b border-gray-800/60 px-6 py-4 flex items-center justify-between">
            <span className="text-xs text-gray-400 tracking-wider font-bold">MANTLE BLOCK STREAM</span>
            <span className="text-xs text-[#10B981] font-bold">CONNECTED :: SEPOLIA RPC</span>
          </div>

          {/* Threat Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-800/80 text-gray-500 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Transaction</th>
                  <th className="px-6 py-4">Target Protocol</th>
                  <th className="px-6 py-4">Verification Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Metrics Saved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-300">{tx.txHash}</td>
                    <td className="px-6 py-4 text-gray-400">{tx.protocol}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded bg-[#18181B] text-gray-300 font-medium">
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {tx.status === 'SCANNING' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 font-bold animate-pulse">
                          Scanning
                        </span>
                      )}
                      {tx.status === 'MITIGATED' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 font-bold">
                          Mitigated
                        </span>
                      )}
                      {tx.status === 'SAFE' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 text-gray-400 border border-white/10 font-bold">
                          Clean
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-[#10B981] font-mono">
                      {tx.gasSaved && tx.gasSaved !== '0 mETH' && tx.gasSaved !== '0 MNT' ? tx.gasSaved : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* High-Impact Bottom CTA Banner */}
      <section className="py-24 px-8 md:px-16 max-w-6xl mx-auto relative z-40 bg-transparent border-t border-gray-900/30">
        <div className="relative py-16 px-8 md:px-16 flex flex-col items-center text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Neutralize threats before block finality.
          </h2>
          <p className="text-base text-gray-400 max-w-xl mx-auto mb-10 font-sans leading-relaxed">
            Attach sentinels to monitor, pause, and safeguard your smart contracts on Mantle Network.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center justify-center">
            {!isConnected || !isCorrectNetwork ? (
              <button 
                onClick={handleAccess}
                className="bg-[#10B981] text-black font-bold px-8 py-4 rounded text-sm hover:bg-green-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] text-center font-mono flex items-center gap-2"
              >
                <Terminal className="w-4 h-4" /> Enter Command Center
              </button>
            ) : (
              <Link 
                href="/dashboard" 
                className="bg-[#10B981] text-black font-bold px-8 py-4 rounded text-sm hover:bg-green-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] text-center font-mono"
              >
                Enter Command Center
              </Link>
            )}
            <a 
              href="https://docs.mantle.xyz" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="bg-black/50 border border-gray-800 hover:border-gray-700 text-white font-bold px-8 py-4 rounded text-sm transition-all text-center font-mono"
            >
              View Documentation
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-black/40 backdrop-blur-sm border-t border-gray-800/40 py-16 px-8 md:px-16 relative z-40">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-3 mb-6">
              <img src="/logo.png" alt="BreachResponse Logo" className="w-6 h-6 object-contain" />
              <span className="text-lg font-bold tracking-widest text-white">BREACH RESPONSE</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed font-sans max-w-xs">
              The active immune system for mantle network smart contracts
            </p>
          </div>
          


          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="text-white font-bold mb-6 tracking-widest uppercase text-xs">Networks</h4>
            <ul className="space-y-4 flex flex-col">
              <a href="https://www.mantle.xyz/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#10B981] transition-colors text-sm font-sans">Mantle Network</a>
              <a href="https://explorer.sepolia.mantle.xyz/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#10B981] transition-colors text-sm font-sans">Mantle Sepolia</a>
              <a href="https://faucet.sepolia.mantle.xyz/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#10B981] transition-colors text-sm font-sans">Mantle Faucet</a>
            </ul>
          </div>

          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="text-white font-bold mb-6 tracking-widest uppercase text-xs">Agents</h4>
            <ul className="space-y-4 flex flex-col">
              <a href="https://github.com/byreal/byreal-skills" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#10B981] transition-colors text-sm font-sans">Byreal SDK</a>
              <a href="https://web3py.readthedocs.io/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#10B981] transition-colors text-sm font-sans">Web3.py</a>
            </ul>
          </div>
        </div>
      </footer>
    </main>
  );
}
