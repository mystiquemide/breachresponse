'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useConnect, useDisconnect, useWriteContract, useSwitchChain } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { mantleSepoliaTestnet } from 'wagmi/chains';
import { ShieldAlert, Radio, Activity, ShieldCheck, Power, Terminal as TerminalIcon, Cpu, Play, Trash2, ArrowUpRight, AlertTriangle, Lock, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Counter from './Counter';
import Onboarding from './Onboarding';
import AttackModal from './AttackModal';
import { REGISTRY_ADDRESS, REGISTRY_ABI } from '../constants';

interface Asset {
  id: string;
  name: string;
  address: string;
  status: 'ACTIVE' | 'PAUSED' | 'MITIGATING';
  latency: string;
  events: number;
}

export default function Dashboard() {
  const { address, isConnected, chainId } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { writeContract, isPending, isSuccess } = useWriteContract();
  
  const isCorrectNetwork = chainId === mantleSepoliaTestnet.id;
  
  const [protocolAddress, setProtocolAddress] = useState('');
  const [customAssets, setCustomAssets] = useState<Asset[]>([]);
  const [blocksScanned, setBlocksScanned] = useState(42912);
  const [commandInput, setCommandInput] = useState('');
  const [waveform, setWaveform] = useState<number[]>([15, 30, 10, 45, 25, 60, 35, 20, 50, 40, 30, 20, 45, 65, 40, 25, 55, 30, 15, 40]);
  
  const [terminalLines, setTerminalLines] = useState<string[]>([
    "[SYS] Establishing connection to Mantle Sepolia RPC",
    "[SYS] Connection established Pending filter initialized",
    "[LOG] Scanning block mempool for anomalies",
    "[LOG] Type 'help' to see command options"
  ]);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const isAutoScrollEnabled = useRef(true);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isAttackModalOpen, setIsAttackModalOpen] = useState(false);

  useEffect(() => {
    // Check if user has already seen onboarding
    const hasOnboarded = localStorage.getItem('breachresponse_onboarded');
    if (!hasOnboarded) {
      // Use setTimeout to avoid synchronous state update in effect
      setTimeout(() => setShowOnboarding(true), 0);
    }
  }, []);

  const handleCloseOnboarding = () => {
    localStorage.setItem('breachresponse_onboarded', 'true');
    setShowOnboarding(false);
  };

  // Live block scan & api logs via Server-Sent Events (SSE)
  useEffect(() => {
    const sse = new EventSource('/api/logs/stream');
    
    sse.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'CONNECTED') {
          setTerminalLines(prev => [...prev, `[SYS] ${payload.message}`]);
        } else if (payload.type === 'LOG') {
          // It's a raw python agent log
          let color = "[LOG]";
          if (payload.data.level === "WARN") color = "[ERR]";
          if (payload.data.text.includes("[SCAN]")) color = "[LOG]";
          if (payload.data.text.includes("[ANOMALY-ALERT]")) color = "[ALERT]";
          if (payload.data.text.includes("[BYREAL-LLM]")) color = "[SYS]";
          if (payload.data.text.includes("[SENTINEL]")) color = "[SYS]";
          
          setTerminalLines(prev => [...prev, `${color} ${payload.data.text}`]);
        } else if (payload.type === 'ALERT') {
          // It's a mitigated alert
          const log = payload.data;
          setTerminalLines(prev => [...prev, `[ALERT] Mitigated threat on ${log.protocol}! Type: ${log.type} Rescued ${log.gasSaved}`]);
        }
      } catch (err) {
        console.error("SSE Parse Error", err);
      }
    };

    sse.onerror = (err) => {
      console.error("SSE Error:", err);
      sse.close();
    };

    const interval = setInterval(() => {
      setBlocksScanned((prev) => prev + 1);
    }, 2500);
    
    return () => {
      sse.close();
      clearInterval(interval);
    };
  }, []);

  // Fetch initial registered sentinels from database
  useEffect(() => {
    const fetchSentinels = async () => {
      try {
        const res = await fetch('/api/sentinels');
        if (res.ok) {
          const data = await res.json();
          setCustomAssets(data);
        }
      } catch (err) {
        console.error("Failed to load sentinels from database", err);
      }
    };
    fetchSentinels();
  }, []);

  // Update live waveform oscilloscope
  useEffect(() => {
    const interval = setInterval(() => {
      setWaveform((prev) => {
        const nextVal = Math.floor(Math.random() * 55) + 15;
        return [...prev.slice(1), nextVal];
      });
    }, 300);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (isAutoScrollEnabled.current && terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [terminalLines]);

  const handleTerminalScroll = () => {
    if (!terminalContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = terminalContainerRef.current;
    isAutoScrollEnabled.current = Math.ceil(scrollTop + clientHeight) >= scrollHeight - 20;
  };

  const handleRegister = () => {
    if (!protocolAddress || !protocolAddress.startsWith('0x')) return;
    
    writeContract({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'registerProtocol',
      args: [protocolAddress as `0x${string}`],
    });
  };

  // Save registered protocol to database when contract success is detected
  useEffect(() => {
    if (isSuccess && protocolAddress) {
      const saveSentinel = async () => {
        try {
          const res = await fetch('/api/sentinels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              address: protocolAddress,
              name: "Custom Sentinel"
            })
          });
          if (res.ok) {
            const newNode = await res.json();
            setCustomAssets((prev) => [newNode, ...prev]);
            setTerminalLines((prev) => [
              ...prev,
              `[SYS] Successfully registered sentinel node at ${protocolAddress}`
            ]);
            setProtocolAddress('');
          }
        } catch (err) {
          console.error("Failed to save sentinel to DB", err);
        }
      };
      saveSentinel();
    }
  }, [isSuccess]);

  // Terminal commands interpreter
  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = commandInput.trim().toLowerCase();
    if (!cmd) return;

    setTerminalLines((prev) => [...prev, `> ${commandInput}`]);
    setCommandInput('');

    setTimeout(() => {
      switch (cmd) {
        case 'simulate hack':
          setTerminalLines((prev) => [
            ...prev,
            "[ALERT] INITIALIZING HACKATHON DEMO SEQUENCE...",
            "[SYS] INJECTING MALICIOUS PAYLOAD INTO MEMPOOL..."
          ]);
          setTimeout(() => setIsAttackModalOpen(true), 1500);
          break;
        case 'help':
          setTerminalLines((prev) => [
            ...prev,
            "Available commands:",
            "  help        - Display command options",
            "  status      - Display connection telemetry details",
            "  sentinels   - List all active security sentinels",
            "  clear       - Clear the console outputs"
          ]);
          break;
        case 'status':
          setTerminalLines((prev) => [
            ...prev,
            `[SYS] RPC Endpoint: https://rpc.sepolia.mantle.xyz`,
            `[SYS] Registry Contract: ${REGISTRY_ADDRESS}`,
            `[SYS] Active guards: REENTRANCY, ORACLE_MANIPULATION`,
            `[SYS] Connection state: CONNECTED (Latency: 7.2ms)`
          ]);
          break;
        case 'sentinels':
          setTerminalLines((prev) => {
            const list = [
              "Active sentinels:",
              "  [ACTIVE] ID: 01 | Name: MantleSwap Sentinel | Target: 0x5e8c...1a2f",
              "  [ACTIVE] ID: 02 | Name: LendX Sentinel      | Target: 0x8b3f...9c4d"
            ];
            customAssets.forEach((asset, i) => {
              list.push(`  [${asset.status}] ID: ${10 + i} | Name: ${asset.name} | Target: ${asset.address}`);
            });
            return [...prev, ...list];
          });
          break;
        case 'clear':
          setTerminalLines([]);
          break;
        default:
          setTerminalLines((prev) => [
            ...prev,
            `[ERR] Command not recognized: '${cmd}' Type 'help' for instructions`
          ]);
      }
    }, 100);
  };

  const toggleAssetStatus = async (id: string, name: string) => {
    try {
      const res = await fetch('/api/sentinels', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        const updatedNode = await res.json();
        setCustomAssets((prev) =>
          prev.map((asset) => (asset.id === id ? { ...asset, status: updatedNode.status } : asset))
        );
        setTerminalLines((logs) => [
          ...logs,
          `[SYS] Sentinel status for ${name} toggled to ${updatedNode.status}`
        ]);
      }
    } catch (err) {
      console.error("Failed to toggle status in database", err);
    }
  };

  // Combined asset list (default assets + custom user-registered assets)
  const defaultAssets: Asset[] = [
    { id: 'd1', name: 'MantleSwap Sentinel', address: '0x5e8c20b5...1a2f', status: 'ACTIVE', latency: '6.8ms', events: 1294 },
    { id: 'd2', name: 'LendX Sentinel', address: '0x8b3f890a...9c4d', status: 'ACTIVE', latency: '7.2ms', events: 451 }
  ];
  const allAssets = [...customAssets, ...defaultAssets];

  return (
    <main className="min-h-screen bg-[#050507] text-white font-mono p-4 lg:p-8 relative">
      {/* Background Cyber Grid */}
      <div className="fixed inset-0 bg-engineer-grid opacity-25 pointer-events-none z-0 vignette-mask" />
      
      {/* Ambient Cyber glow spots */}
      <div className="fixed top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#10B981]/3 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-1/3 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-[#10B981]/2 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Header */}
      <header className="relative flex justify-between items-center mb-8 border-b border-gray-800/60 pb-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mr-2 border border-gray-800 rounded px-3 py-1">
              <span className="text-xs font-bold uppercase tracking-widest">← Back</span>
            </Link>
            <Radio className="w-5 h-5 animate-pulse text-[#10B981] hidden sm:block" />
            <h1 className="text-lg md:text-xl font-bold tracking-widest uppercase">Command Center</h1>
          </div>
          
          <div className="hidden md:flex items-center gap-6 text-xs font-bold tracking-widest uppercase text-gray-400">
            <Link href="/dashboard" className="text-white">Dashboard</Link>
            <Link href="/history" className="hover:text-white transition-colors">Threat History</Link>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowOnboarding(true)}
            className="text-gray-500 hover:text-white transition-colors p-2"
            title="Replay Setup Tour"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          {isConnected && isCorrectNetwork ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 bg-[#18181B] border border-gray-800 px-3 py-2 rounded text-xs text-gray-400">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
              <button 
                onClick={() => disconnect()} 
                className="flex items-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded hover:bg-red-500/20 transition-colors text-xs font-bold uppercase tracking-widest"
              >
                <Power className="w-3.5 h-3.5" /> Disconnect
              </button>
            </div>
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

      {(!isConnected || !isCorrectNetwork) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#09090B] border border-gray-800 p-8 rounded-xl max-w-md text-center shadow-2xl">
            <Lock className="w-12 h-12 text-[#10B981] mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
            <p className="text-gray-400 text-sm mb-6">
              You must connect your wallet to the Mantle Sepolia network to access the Command Center.
            </p>
            {!isConnected ? (
              <button 
                onClick={() => connect({ connector: injected() })} 
                className="w-full bg-[#10B981] text-black font-bold py-3 rounded text-sm hover:bg-green-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
              >
                <Power className="w-4 h-4" /> Connect Wallet
              </button>
            ) : (
              <button 
                onClick={() => switchChain && switchChain({ chainId: mantleSepoliaTestnet.id })} 
                className="w-full bg-red-500 text-white font-bold py-3 rounded text-sm hover:bg-red-400 transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" /> Switch to Mantle Sepolia
              </button>
            )}
            
            <Link href="/" className="mt-4 block w-full py-3 text-center text-sm text-gray-500 hover:text-white transition-colors border border-gray-800 rounded">
              Return to Homepage
            </Link>
          </div>
        </div>
      )}

      {/* Stats Strip Bar */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <div className="sci-fi-panel p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-xs font-bold tracking-widest">Blocks Scanned</h3>
            <Activity className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-white font-mono tracking-tighter">
            <Counter value={blocksScanned} />
          </div>
        </div>

        <div className="sci-fi-panel p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-xs font-bold tracking-widest">Active Sentinels</h3>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-white font-mono tracking-tighter">
            <Counter value={4} />
          </div>
        </div>

        <div className="sci-fi-panel p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-xs font-bold tracking-widest">Value Secured</h3>
            <span className="text-[#10B981] text-xs font-bold">+12%</span>
          </div>
          <div className="text-2xl md:text-3xl font-black text-white font-mono tracking-tighter">
            <Counter value={1420.5} suffix=" mETH" />
          </div>
        </div>

        <div className="sci-fi-panel p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-xs font-bold tracking-widest">Mitigated Attacks</h3>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-white font-mono tracking-tighter">
            <Counter value={terminalLines.length > 0 ? terminalLines.length : 12} />
          </div>
        </div>
      </motion.section>

      {/* Workspace Grid */}
      <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Layout (Forms & Registry) */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1 space-y-8"
        >
          
          {/* Register Sentinel Card */}
          <div id="ob-sentinel" className="sci-fi-panel p-6 relative overflow-hidden transition-all duration-500">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              Deploy Sentinel Guard
            </h2>
            <p className="text-gray-400 text-xs mb-4 leading-relaxed font-sans">
              Register a smart contract on the Mantle Sepolia network. Once deployed, the active mempool scanning guard is initialized.
            </p>
            <input 
              type="text" 
              value={protocolAddress}
              onChange={(e) => setProtocolAddress(e.target.value)}
              placeholder="0x... (Contract Address)" 
              className="w-full bg-[#09090B] border border-gray-700 rounded p-3 text-xs text-white outline-none focus:border-[#10B981] mb-4 transition-colors font-mono"
            />
            <button 
              onClick={handleRegister}
              disabled={isPending || !isConnected}
              className={`w-full bg-[#10B981] text-black font-bold py-3 rounded text-xs transition-all ${isPending || !isConnected ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]'}`}
            >
              {isPending ? 'Executing Transaction...' : 'Initialize active defense'}
            </button>
            {isSuccess && <p className="text-[#10B981] mt-3 text-[10px] text-center">Protocol registered on Mantle Sepolia!</p>}
            {!isConnected && <p className="text-red-500 mt-3 text-[10px] text-center font-sans">Connect wallet to initialize guards</p>}
          </div>

          {/* System Telemetry Oscilloscope (Inspired by ui panel.png) */}
          <div id="ob-telemetry" className="sci-fi-panel p-6 relative overflow-hidden transition-all duration-500">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-gray-300">
              <Activity className="w-4 h-4 text-[#10B981]" />
              Telemetry Oscilloscope
            </h2>
            <div className="bg-black/50 border border-gray-800/60 rounded-lg p-4 h-28 flex items-center justify-center relative overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 200 80" preserveAspectRatio="none">
                <path
                  d={`M ${waveform.map((val, i) => `${(i * 10.5).toFixed(1)},${(80 - val).toFixed(1)}`).join(' L ')}`}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="1.5"
                />
                <line x1="0" y1="40" x2="200" y2="40" stroke="#10B981" strokeWidth="0.5" strokeDasharray="3 6" className="opacity-30" />
              </svg>
              <div className="absolute top-2 right-3 font-mono text-[7px] text-gray-500 uppercase tracking-widest">
                Cycloramic Camera Induction
              </div>
            </div>
          </div>

          {/* Monitored Assets List */}
          <div className="sci-fi-panel p-6 relative overflow-hidden">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-gray-300">
              <Cpu className="w-4 h-4 text-[#10B981]" />
              Monitored Sentinel Nodes
            </h2>
            <div className="space-y-4">
              {allAssets.map((asset) => (
                <div key={asset.id} className="border border-gray-800/50 bg-black/50 rounded-lg p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-xs font-bold text-white">{asset.name}</h4>
                      <span className="text-[10px] text-gray-500 font-mono">{asset.address}</span>
                    </div>
                    
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${asset.status === 'ACTIVE' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-red-500/10 text-red-500'}`}>
                      {asset.status}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-800/50 flex justify-between items-center text-[9px] text-gray-500">
                    <div>
                      <span>LATENCY: </span>
                      <span className="text-white">{asset.latency}</span>
                    </div>
                    <div>
                      <span>SCANS: </span>
                      <span className="text-white">{asset.events}</span>
                    </div>
                    {asset.id.startsWith('d') ? (
                      <span className="text-[8px] text-gray-600 uppercase">System</span>
                    ) : (
                      <button 
                        onClick={() => toggleAssetStatus(asset.id, asset.name)}
                        className="text-[#10B981] hover:underline"
                      >
                        {asset.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right Layout (Command Console & Terminal) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 space-y-8"
        >
          <div id="ob-terminal" className="sci-fi-panel flex flex-col relative overflow-hidden h-full min-h-[580px] transition-all duration-500">
            {/* Terminal Top Bar */}
            <div className="bg-[#141416]/80 backdrop-blur-sm border-b border-gray-800/60 px-4 py-3 flex justify-between items-center z-10">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]/80" />
              </div>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">sentinel-console-v1.2.0</span>
            </div>

            {/* Terminal Logs Display */}
            <div 
              ref={terminalContainerRef}
              onScroll={handleTerminalScroll}
              className="p-6 font-mono text-xs space-y-2.5 flex-1 overflow-y-auto h-[500px] z-10 relative"
            >
              {terminalLines.map((line, index) => {
                let color = "text-gray-300";
                if (line.startsWith("[SYS]")) color = "text-[#10B981]";
                if (line.startsWith("[LOG]")) color = "text-gray-500";
                if (line.startsWith("[ERR]")) color = "text-red-500";
                if (line.startsWith(">")) color = "text-white font-bold";
                
                return (
                  <div key={index} className={`${color} leading-relaxed break-all`}>
                    {line}
                  </div>
                );
              })}
              <div ref={terminalEndRef} />
            </div>

            {/* CRT Phosphor Scanline Overlay (Inspired by node.gif / ui panel.png) */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] opacity-25 z-20" />

            {/* Terminal Prompt Input Form */}
            <form onSubmit={handleCommandSubmit} className="border-t border-gray-800 bg-[#09090B] px-4 py-3 flex items-center gap-2 z-10">
              <span className="text-[#10B981] font-bold text-xs select-none">&gt;</span>
              <input 
                type="text" 
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder="Type 'help' for sentinel commands..." 
                className="w-full bg-transparent text-white text-xs border-none outline-none font-mono"
              />
            </form>
          </div>
        </motion.div>

      </div>

      {/* Setup Wizard Overlay */}
      <Onboarding isOpen={showOnboarding} onClose={handleCloseOnboarding} />

      {/* Hackathon Demo: Critical Anomaly Modal */}
      <AttackModal 
        isOpen={isAttackModalOpen} 
        onClose={() => setIsAttackModalOpen(false)} 
        onSuccess={() => {
          setIsAttackModalOpen(false);
          setTerminalLines((prev) => [
            ...prev,
            "[SYS] 0-VALUE TRANSACTION CONFIRMED.",
            "[ALERT] Threat neutralised. Contract paused successfully. Funds secured."
          ]);
        }}
      />
    </main>
  );
}
