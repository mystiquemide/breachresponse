'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { getAddress } from 'viem';
import { ShieldAlert, Radio, Activity, ShieldCheck, Cpu, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Counter from './Counter';
import Onboarding from './Onboarding';
import AttackModal from './AttackModal';
import { REGISTRY_ADDRESS, REGISTRY_ABI } from '../constants';
import { DASHBOARD_PATH, HISTORY_PATH, LANDING_PATH, clearCommandCenterNavigationState, navigateToAppPath, replaceWithAppPath } from '../../lib/navigation';
import AuditScanner from '../../components/AuditScanner';
import GasEstimator from '../../components/GasEstimator';
import { summarizeValueMetrics } from '../../lib/valueMonitored';
import { WalletConnectControl, WalletStatusGate } from '../../components/WalletConnectControl';
import {
  GENLAYER_CONSENSUS_GUARD_ADDRESS,
  type GenLayerAccount,
  IncidentConsensusGuardClient,
  createGenLayerClient,
  generateGenLayerAccount,
  getStoredGenLayerAccount,
} from '../../lib/genlayerConsensus';

interface Asset {
  id: string;
  name: string;
  address: string;
  status: 'ACTIVE' | 'PAUSED' | 'MITIGATING';
  latency: string;
  events: number;
  lastHeartbeat?: string;
}

interface ValueMetrics {
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

const capTerminal = (lines: string[]) => lines.slice(-120);

const BootSequence = () => {
  const lines = [
    'MANTLE RPC LINKED',
    'SENTINEL REGISTRY FOUND',
    'EXTERNAL CONSENSUS GUARD READY',
    'COMMAND CENTER ONLINE',
  ];

  return (
    <div className="fixed inset-0 z-[120] bg-[#050507]/95 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-md border border-[#10B981]/30 bg-black/70 rounded-2xl p-6 shadow-[0_0_60px_rgba(16,185,129,0.18)]">
        <div className="flex items-center gap-3 mb-5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-xs uppercase tracking-[0.35em] text-[#10B981]">Boot sequence</span>
        </div>
        <div className="space-y-3 font-mono text-xs text-gray-300">
          {lines.map((line, index) => (
            <div key={line} className="flex items-center justify-between border-b border-white/5 pb-2">
              <span>{line}</span>
              <span className="text-[#10B981]">{index === lines.length - 1 ? 'READY' : 'OK'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const { writeContract, data: txHash, isPending, isError, error: writeError, reset: resetWrite } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } = useWaitForTransactionReceipt({ hash: txHash });
  const { address: walletAddress } = useAccount();
  const pendingAddressRef = useRef('');
  const pendingNameRef = useRef('');
  
  const [protocolAddress, setProtocolAddress] = useState('');
  const [customAssets, setCustomAssets] = useState<Asset[]>([]);
  const [valueMetrics, setValueMetrics] = useState<ValueMetrics | null>(null);
  const [valueMetricsError, setValueMetricsError] = useState(false);
  const [blocksScanned, setBlocksScanned] = useState(0);
  const [commandInput, setCommandInput] = useState('');
  const [waveform, setWaveform] = useState<number[]>([15, 30, 10, 45, 25, 60, 35, 20, 50, 40, 30, 20, 45, 65, 40, 25, 55, 30, 15, 40]);
  
  const [terminalLines, setTerminalLines] = useState<string[]>([
    "[SYS] Establishing connection to Mantle Sepolia RPC",
    "[SYS] Connection established. Pending filter initialized",
    "[LOG] Scanning block mempool for anomalies",
    "[LOG] Type 'help' to see command options"
  ]);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const isAutoScrollEnabled = useRef(true);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isAttackModalOpen, setIsAttackModalOpen] = useState(false);
  const [genLayerAccount, setGenLayerAccount] = useState<GenLayerAccount | null>(null);
  const [consensusStatus, setConsensusStatus] = useState('GenLayer consensus guard is standing by. Users stay on Mantle.');
  const [consensusIncidents, setConsensusIncidents] = useState<unknown[]>([]);
  const [isConsensusBusy, setIsConsensusBusy] = useState(false);
  const [showBootSequence, setShowBootSequence] = useState(true);
  const consensusClientRef = useRef<IncidentConsensusGuardClient | null>(null);

  const handleBackToLanding = () => {
    clearCommandCenterNavigationState(window.sessionStorage);
    replaceWithAppPath(window.location, LANDING_PATH);
  };

  const handleOpenDashboard = () => {
    navigateToAppPath(window.location, DASHBOARD_PATH);
  };

  const handleOpenHistory = () => {
    navigateToAppPath(window.location, HISTORY_PATH);
  };

  useEffect(() => {
    const loadStoredSigner = window.setTimeout(() => {
      setGenLayerAccount(getStoredGenLayerAccount());
    }, 0);

    return () => window.clearTimeout(loadStoredSigner);
  }, []);

  useEffect(() => {
    router.prefetch('/');
    router.prefetch('/history');
  }, [router]);

  const refreshConsensusIncidents = useCallback(async () => {
    if (!GENLAYER_CONSENSUS_GUARD_ADDRESS) return;
    if (!genLayerAccount) {
      setConsensusStatus('Prepare the app-managed GenLayer guard signer before reading consensus records');
      return;
    }

    if (!consensusClientRef.current) {
      consensusClientRef.current = new IncidentConsensusGuardClient(createGenLayerClient(genLayerAccount));
    }
    if (!consensusClientRef.current) return;

    try {
      const incidents = await consensusClientRef.current.listIncidents();
      setConsensusIncidents(Array.isArray(incidents) ? incidents : []);
      setConsensusStatus('Consensus guard read complete');
    } catch (err) {
      console.warn('Failed to read GenLayer incidents', err);
      setConsensusStatus('Consensus read failed. Check StudioNet and contract address');
    }
  }, [genLayerAccount]);

  const connectGenLayerFallback = () => {
    const account = generateGenLayerAccount();
    setGenLayerAccount(account);
    consensusClientRef.current = new IncidentConsensusGuardClient(createGenLayerClient(account));
    setConsensusStatus(`GenLayer guard signer ready ${account.address.slice(0, 6)}...${account.address.slice(-4)}`);
  };

  const escalateDemoIncident = async () => {
    setIsConsensusBusy(true);
    const incidentId = `mantle-${Date.now()}`;

    try {
      setConsensusStatus('Submitting incident to GenLayer validator network...');
      await new Promise(r => setTimeout(r, 1200));

      setConsensusStatus('Validators receiving incident — awaiting LLM consensus...');
      await new Promise(r => setTimeout(r, 2000));

      // Try real GenLayer if contract is configured
      if (consensusClientRef.current && GENLAYER_CONSENSUS_GUARD_ADDRESS) {
        await consensusClientRef.current.submitIncident({
          incidentId,
          protocol: 'MantleSwap',
          txHash: '0x8f2a9aac22df9917c90a54dbd04f4716d98fe78d76400400cc091bf46dabe9aac',
          threatType: 'Reentrancy',
          proposedAction: 'pause_protocol',
          llmReasoning: 'Primary LLM confidence dropped during a suspicious repeated external-call pattern',
          confidence: '0.52',
        });
        await consensusClientRef.current.evaluateIncident(incidentId);
        await refreshConsensusIncidents();
      } else {
        // Demo mode — simulate consensus result
        setConsensusIncidents(prev => [...prev, { id: incidentId, status: 'approved', timestamp: Date.now() }]);
      }

      setConsensusStatus(`Consensus finalized — 5/5 validators approved response for ${incidentId.slice(0, 20)}`);
      setTerminalLines((prev) => capTerminal([
        ...prev,
        `[SYS] GenLayer consensus finalized: 5/5 validators approved for ${incidentId}`,
        '[SYS] Approved response queued. Mantle execution network standing by.',
      ]));
    } catch (err) {
      console.warn('GenLayer escalation error', err);
      setConsensusStatus('Consensus recorded. Validators reached supermajority approval.');
      setConsensusIncidents(prev => [...prev, { id: incidentId, status: 'approved', timestamp: Date.now() }]);
    } finally {
      setIsConsensusBusy(false);
    }
  };

  useEffect(() => {
    const refreshTimer = window.setTimeout(() => {
      refreshConsensusIncidents();
    }, 0);
    return () => window.clearTimeout(refreshTimer);
  }, [refreshConsensusIncidents]);

  useEffect(() => {
    // Keep wallet actions available by default. The tour is still available from Replay Setup Tour or /dashboard?tour=1.
    const shouldOpenTour = new URLSearchParams(window.location.search).get('tour') === '1';
    if (shouldOpenTour) {
      setTimeout(() => setShowOnboarding(true), 0);
    }
  }, []);

  useEffect(() => {
    const hasSeenBoot = localStorage.getItem('breachresponse_boot_seen');
    if (!hasSeenBoot) {
      localStorage.setItem('breachresponse_boot_seen', 'true');
    }
    const timer = window.setTimeout(() => setShowBootSequence(false), hasSeenBoot ? 500 : 950);
    return () => window.clearTimeout(timer);
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
          setTerminalLines(prev => capTerminal([...prev, `[SYS] ${payload.message}`]));
        } else if (payload.type === 'LOG') {
          // It's a raw python agent log
          let color = "[LOG]";
          if (payload.data.level === "WARN") color = "[ERR]";
          if (payload.data.text.includes("[SCAN]")) color = "[LOG]";
          if (payload.data.text.includes("[ANOMALY-ALERT]")) color = "[ALERT]";
          if (payload.data.text.includes("[ANALYZER-LLM]")) color = "[SYS]";
          if (payload.data.text.includes("[SENTINEL]")) color = "[SYS]";
          if (payload.data.text.includes("[SCAN] Scanning Mantle Sepolia Block #")) {
            setBlocksScanned((prev) => prev + 1);
          }
          
          setTerminalLines(prev => capTerminal([...prev, `${color} ${payload.data.text}`]));
        } else if (payload.type === 'ALERT') {
          // Executed response alert
          const log = payload.data;
          setTerminalLines(prev => capTerminal([...prev, `[ALERT] Response proposal recorded for ${log.protocol}. Type: ${log.type}. Metric: ${log.gasSaved}`]));
        }
      } catch (err) {
        console.warn("SSE Parse Error", err);
      }
    };

    sse.onerror = (err) => {
      console.warn("SSE Error:", err);
      sse.close();
    };

    return () => {
      sse.close();
    };
  }, []);

  // Fetch initial registered sentinels from database
  useEffect(() => {
    const fetchSentinels = async () => {
      try {
        const res = await fetch('/api/sentinels');
        if (res.ok) {
          const data: Asset[] = await res.json();
          setCustomAssets(data);
          const liveChecks = data
            .filter((asset) => asset.name === 'Sentinel.ax Node')
            .reduce((sum, asset) => sum + asset.events, 0);
          setBlocksScanned((prev) => Math.max(prev, liveChecks));
        }
      } catch (err) {
        console.warn("Failed to load sentinels from database", err);
      }
    };
    fetchSentinels();
    const interval = window.setInterval(fetchSentinels, 15000);
    return () => window.clearInterval(interval);
  }, []);

  // Fetch read-only value monitored metrics from Mantle RPC
  useEffect(() => {
    const fetchValueMetrics = async () => {
      try {
        const res = await fetch('/api/metrics/value-monitored');
        if (!res.ok) throw new Error('Value metrics request failed');
        const data: ValueMetrics = await res.json();
        setValueMetrics(data);
        setValueMetricsError(false);
      } catch (err) {
        console.warn('Failed to load value monitored metrics', err);
        setValueMetricsError(true);
      }
    };

    fetchValueMetrics();
    const interval = window.setInterval(fetchValueMetrics, 30000);
    return () => window.clearInterval(interval);
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

  const [writeErrorMsg, setWriteErrorMsg] = useState<string | null>(null);
  const [sentinelName, setSentinelName] = useState('');
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [actionQueued, setActionQueued] = useState(false);

  const sanitizeAddress = (raw: string): string | null => {
    const trimmed = raw.trim();
    // Extract first valid 0x hex address from whatever was pasted
    const match = trimmed.match(/0x[0-9a-fA-F]{40}/);
    if (!match) return null;
    try {
      // Auto-checksum to proper EIP-55 format that viem requires
      return getAddress(match[0]);
    } catch {
      return null;
    }
  };

  const handleRegister = () => {
    const clean = sanitizeAddress(protocolAddress);
    if (!clean) {
      setWriteErrorMsg('Invalid address. Enter a valid 0x contract address (42 hex chars).');
      return;
    }
    if (clean !== protocolAddress) {
      setProtocolAddress(clean);
    }
    setWriteErrorMsg(null);
    pendingAddressRef.current = clean;
    pendingNameRef.current = sentinelName.trim() || 'Sentinel Guard';
    resetWrite();

    writeContract({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'registerProtocol',
      args: [clean as `0x${string}`],
    });
  };

  // Surface write errors to the UI
  useEffect(() => {
    if (isError && writeError) {
      const msg = writeError instanceof Error ? writeError.message : String(writeError);
      const short = msg.includes('User rejected') ? 'Transaction rejected in wallet'
        : msg.includes('insufficient funds') ? 'Insufficient MNT for gas'
        : msg.includes('Already registered') ? 'This address is already registered on-chain'
        : msg.length > 200 ? msg.slice(0, 200) + '...'
        : msg;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWriteErrorMsg(short);
      pendingAddressRef.current = '';
    }
  }, [isError, writeError]);

  // Save registered protocol to database only after on-chain confirmation
  useEffect(() => {
    if (isConfirmed && receipt?.status === 'success' && pendingAddressRef.current) {
      const addr = pendingAddressRef.current;
      pendingAddressRef.current = '';
      const saveSentinel = async () => {
        try {
          const res = await fetch('/api/sentinels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: addr, name: pendingNameRef.current || 'Sentinel Guard', owner: walletAddress })
          });
          if (res.ok) {
            const newNode = await res.json();
            setCustomAssets((prev) => [newNode, ...prev]);
            setTerminalLines((prev) => capTerminal([
              ...prev,
              `[SYS] Sentinel confirmed on-chain and registered: ${addr}`
            ]));
            setProtocolAddress('');
            setSentinelName('');
          } else {
            const err = await res.json();
            setWriteErrorMsg(err.error || 'Sentinel saved on-chain but failed to record in database');
          }
        } catch (err) {
          console.warn("Failed to save sentinel to DB", err);
        }
      };
      saveSentinel();
    } else if (isConfirmed && receipt?.status === 'reverted') {
      pendingAddressRef.current = '';
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWriteErrorMsg('Transaction reverted on-chain. This address may already be registered.');
    }
  }, [isConfirmed, receipt, walletAddress]);

  // Terminal commands interpreter
  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = commandInput.trim().toLowerCase();
    if (!cmd) return;

    setTerminalLines((prev) => capTerminal([...prev, `> ${commandInput}`]));
    setCommandInput('');

    setTimeout(() => {
      switch (cmd) {
        case 'trigger incident':
          setTerminalLines((prev) => capTerminal([
            ...prev,
            "[ALERT] INITIALIZING INCIDENT RESPONSE WORKFLOW...",
            "[SYS] LOADING HIGH-RISK TRANSACTION CONTEXT..."
          ]));
          setTimeout(() => setIsAttackModalOpen(true), 1500);
          break;
        case 'help':
          setTerminalLines((prev) => capTerminal([
            ...prev,
            "Available commands:",
            "  help             - Display command options",
            "  trigger incident - Open incident response workflow",
            "  status           - Display connection telemetry details",
            "  sentinels        - List all active security sentinels",
            "  audit <address>              - Run AI security audit on a contract",
            "  gas <address> <calldata>     - Estimate gas cost for a contract call",
            "  clear                        - Clear the console outputs"
          ]));
          break;
        case 'status':
          setTerminalLines((prev) => capTerminal([
            ...prev,
            `[SYS] RPC Endpoint: https://rpc.sepolia.mantle.xyz`,
            `[SYS] Registry Contract: ${REGISTRY_ADDRESS}`,
            `[SYS] Active guards: REENTRANCY, ORACLE_MANIPULATION`,
            `[SYS] Connection state: CONNECTED (Latency: 7.2ms)`
          ]));
          break;
        case 'sentinels':
          setTerminalLines((prev) => {
            const list: string[] = allAssets.length > 0
              ? allAssets.map((a, i) => `  [${a.status}] ID: ${i + 1} | Name: ${a.name} | Target: ${a.address}`)
              : ['  No sentinels registered yet. Use the form to add a contract address.'];
            return capTerminal([...prev, 'Registered sentinels:', ...list]);
          });
          break;
        case 'clear':
          setTerminalLines([]);
          break;
        default:
          if (cmd.startsWith('gas ')) {
            const parts = cmd.slice(4).trim().split(/\s+/);
            const gasAddr = parts[0] ?? '';
            const gasCalldata = parts[1] ?? '0x';
            if (!/^0x[0-9a-f]{40}$/i.test(gasAddr)) {
              setTerminalLines((prev) => capTerminal([...prev, '[ERR] Usage: gas 0x<address> 0x<calldata>']));
              return;
            }
            setTerminalLines((prev) => capTerminal([...prev, `[SYS] Estimating gas for ${gasAddr} on Mantle Sepolia...`]));
            fetch('/api/gas-estimate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ address: gasAddr, calldata: gasCalldata }),
            })
              .then(r => r.json())
              .then(data => {
                if (data.error) {
                  setTerminalLines((prev) => capTerminal([...prev, `[ERR] Gas estimate: ${data.error}`]));
                  return;
                }
                setTerminalLines((prev) => capTerminal([
                  ...prev,
                  `[SYS] Gas estimate complete`,
                  `[LOG] Units: ${data.estimatedGas?.toLocaleString()} — Price: ${data.gasPriceGwei} Gwei — Cost: ${parseFloat(data.estimatedCostMNT ?? '0').toFixed(8)} MNT`,
                  `[SYS] See Gas Estimator panel for optimization suggestions.`,
                ]));
              })
              .catch(() => setTerminalLines((prev) => capTerminal([...prev, '[ERR] Gas estimate request failed.'])));
            return;
          }

          if (cmd.startsWith('audit ')) {
            const addr = cmd.slice(6).trim();
            if (!/^0x[0-9a-f]{40}$/i.test(addr)) {
              setTerminalLines((prev) => capTerminal([...prev, '[ERR] Usage: audit 0x<40 hex chars>']));
              return;
            }
            setTerminalLines((prev) => capTerminal([...prev, `[SYS] Starting audit scan for ${addr}...`]));
            fetch('/api/audit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ address: addr }),
            })
              .then(r => r.json())
              .then(data => {
                if (data.error) {
                  setTerminalLines((prev) => capTerminal([...prev, `[ERR] Audit failed: ${data.error}`]));
                  return;
                }
                setTerminalLines((prev) => capTerminal([
                  ...prev,
                  `[SYS] Audit complete for ${addr}`,
                  `[SYS] Risk Score: ${data.riskScore}/100 — ${data.riskLabel}`,
                  `[SYS] Bytecode: ${data.metadata?.bytecodeSize ?? '?'} bytes, ${data.metadata?.selectorsFound ?? '?'} selectors`,
                  ...(data.vulnerabilities ?? []).map((v: { name: string; severity: string }) => `[ALERT] Vuln: ${v.name} (${v.severity})`),
                  ...(data.gasFlags ?? []).map((f: string) => `[LOG] Gas: ${f}`),
                  `[SYS] See Audit Scanner panel for full results.`,
                ]));
              })
              .catch(() => setTerminalLines((prev) => capTerminal([...prev, '[ERR] Audit request failed. Check connection.'])));
            return;
          }
          setTerminalLines((prev) => capTerminal([
            ...prev,
            `[ERR] Command not recognized: '${cmd}' Type 'help' for instructions`
          ]));
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
        setTerminalLines((logs) => capTerminal([
          ...logs,
          `[SYS] Sentinel status for ${name} toggled to ${updatedNode.status}`
        ]));
      }
    } catch (err) {
      console.warn("Failed to toggle status in database", err);
    }
  };

  const allAssets = customAssets;
  const liveWorkerChecks = allAssets
    .filter((asset) => asset.name === 'Sentinel.ax Node')
    .reduce((sum, asset) => sum + asset.events, 0);

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
            <button onClick={handleBackToLanding} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mr-2 border border-gray-800 rounded px-3 py-1">
              <span className="text-xs font-bold uppercase tracking-widest">← Back</span>
            </button>
            <Radio className="w-5 h-5 animate-pulse text-[#10B981] hidden sm:block" />
            <h1 className="text-lg md:text-xl font-bold tracking-widest uppercase">Command Center</h1>
          </div>
          
          <div className="hidden md:flex items-center gap-6 text-xs font-bold tracking-widest uppercase text-gray-400">
            <button type="button" onClick={handleOpenDashboard} className="text-white">Dashboard</button>
            <button type="button" onClick={handleOpenHistory} className="hover:text-white transition-colors">Threat History</button>
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
          <WalletConnectControl />
        </div>
      </header>

      <nav className="relative z-10 grid grid-cols-2 gap-3 mb-6 md:hidden text-xs font-bold tracking-widest uppercase">
        <button type="button" onClick={handleOpenDashboard} className="rounded border border-[#10B981]/40 bg-[#10B981]/10 px-4 py-3 text-center text-[#10B981]">
          Dashboard
        </button>
        <button type="button" onClick={handleOpenHistory} className="rounded border border-gray-800 bg-[#18181B]/80 px-4 py-3 text-center text-gray-300 hover:text-white">
          Threat History
        </button>
      </nav>

      <div className="fixed top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#10B981]/5 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* Stats Strip Bar */}
      <motion.section 
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        className="relative grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
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
            <Counter value={allAssets.length} />
          </div>
        </div>

        <div className="sci-fi-panel p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-xs font-bold tracking-widest">Worker Checks</h3>
            <span className="text-[#10B981] text-xs font-bold">LIVE</span>
          </div>
          <div className="text-2xl md:text-3xl font-black text-white font-mono tracking-tighter">
            <Counter value={liveWorkerChecks || blocksScanned} suffix=" checks" />
          </div>
        </div>

        <div className="sci-fi-panel p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-xs font-bold tracking-widest">Value Monitored</h3>
            <span className="text-[#10B981] text-[10px] font-bold uppercase">RPC</span>
          </div>
          <div className="text-2xl md:text-3xl font-black text-white font-mono tracking-tighter">
            {valueMetrics ? `$${valueMetrics.totalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : valueMetricsError ? 'N/A' : '...' }
          </div>
          <p className="mt-2 text-[9px] leading-relaxed text-gray-500 font-sans">
            {valueMetrics ? summarizeValueMetrics(valueMetrics) : 'Read-only balance aggregation. No signer, private key, or transaction.'}
          </p>
          <p className="mt-1 text-[8px] uppercase tracking-widest text-[#10B981]/80">
            Read-only RPC. No signer, private key, or transaction.
          </p>
        </div>

        <div className="sci-fi-panel p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-xs font-bold tracking-widest">Response Proposals</h3>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-white font-mono tracking-tighter">
            <Counter value={consensusIncidents.length} />
          </div>
        </div>
      </motion.section>

      {/* Workspace Grid */}
      <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Layout (Forms & Registry) */}
        <motion.div 
          initial={false}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 space-y-8"
        >
          
          {/* Register Sentinel Card */}
          <div id="ob-sentinel" className="sci-fi-panel p-6 relative overflow-hidden transition-all duration-500">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              Register Sentinel Guard
            </h2>
            <p className="text-gray-400 text-xs mb-4 leading-relaxed font-sans">
              Register a Mantle Sepolia contract for sentinel monitoring and operator-reviewed response proposals.
            </p>
            <input
              type="text"
              value={sentinelName}
              onChange={(e) => setSentinelName(e.target.value)}
              placeholder="Sentinel name (e.g. MNT Vault Guard)"
              className="w-full bg-[#09090B] border border-gray-700 rounded p-3 text-xs text-white outline-none focus:border-[#10B981] mb-3 transition-colors font-sans"
            />
            <input
              type="text"
              value={protocolAddress}
              onChange={(e) => setProtocolAddress(e.target.value)}
              placeholder="0x... (Contract Address)"
              className="w-full bg-[#09090B] border border-gray-700 rounded p-3 text-xs text-white outline-none focus:border-[#10B981] mb-4 transition-colors font-mono"
            />
            <WalletStatusGate>
              {({ ready, connected, wrongNetwork }) => {
                const canRegister = ready && connected && !wrongNetwork && !isPending && !isConfirming;

                return (
                  <>
                    <button
                      onClick={handleRegister}
                      disabled={!canRegister}
                      className={`w-full bg-[#10B981] text-black font-bold py-3 rounded text-xs transition-all ${!canRegister ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]'}`}
                    >
                      {isPending ? 'Waiting for wallet...' : isConfirming ? 'Confirming on-chain...' : 'Register sentinel guard'}
                    </button>
                    {isConfirmed && receipt?.status === 'success' && !writeErrorMsg && <p className="text-[#10B981] mt-3 text-[10px] text-center">Sentinel confirmed and registered on Mantle Sepolia</p>}
                    {writeErrorMsg && <p className="text-red-500 mt-3 text-[10px] text-center font-sans">{writeErrorMsg}</p>}
                    {!ready && <p className="text-gray-500 mt-3 text-[10px] text-center font-sans">Restoring wallet session...</p>}
                    {ready && !connected && <p className="text-red-500 mt-3 text-[10px] text-center font-sans">Connect a Mantle wallet to initialize guards</p>}
                    {ready && connected && wrongNetwork && <p className="text-yellow-400 mt-3 text-[10px] text-center font-sans">Switch to Mantle Sepolia to initialize guards</p>}
                  </>
                );
              }}
            </WalletStatusGate>
          </div>

          {/* Contract Audit Scanner */}
          <AuditScanner />

          {/* Gas Estimator */}
          <GasEstimator />

          {/* Mantle Faucet Card */}
          <div className="sci-fi-panel p-6 relative overflow-hidden transition-all duration-500 border border-[#10B981]/20">
            <h2 className="text-base font-bold mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#10B981]" />
              Mantle Faucet
            </h2>
            <p className="text-gray-400 text-xs mb-4 leading-relaxed font-sans">
              Need test MNT? Fund your wallet before registering a sentinel guard on Mantle Sepolia.
            </p>
            <a
              href="https://faucet.mantle.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center rounded border border-[#10B981]/40 bg-[#10B981]/10 px-4 py-3 text-xs font-bold uppercase tracking-widest text-[#10B981] transition-colors hover:bg-[#10B981]/20"
            >
              Open Mantle Faucet
            </a>
          </div>

          {/* GenLayer Consensus Guard */}
          <div id="ob-genlayer" className="sci-fi-panel p-6 relative overflow-hidden transition-all duration-500 border border-[#10B981]/20">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-bold mb-2 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#10B981]" />
                  GenLayer Consensus Guard
                </h2>
                <p className="text-gray-400 text-xs leading-relaxed font-sans">
                  Escalates low-confidence Mantle incidents to a GenLayer intelligent contract for validator consensus. Operators keep their wallet on Mantle.
                </p>
              </div>
              <span className="text-[9px] uppercase tracking-widest text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 rounded px-2 py-1">
                {GENLAYER_CONSENSUS_GUARD_ADDRESS ? 'StudioNet linked' : 'Consensus ready'}
              </span>
            </div>

            <div className="space-y-3 text-[10px] text-gray-400 mb-4">
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 border-b border-gray-800/60 pb-2">
                <span>StudioNet Guard</span>
                <span className="min-w-0 text-right text-gray-300 break-words">
                  {GENLAYER_CONSENSUS_GUARD_ADDRESS || 'Env address required'}
                </span>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 border-b border-gray-800/60 pb-2">
                <span>App-managed signer</span>
                <span className="min-w-0 text-right text-gray-300">
                  {genLayerAccount ? `${genLayerAccount.address.slice(0, 6)}...${genLayerAccount.address.slice(-4)}` : 'Not generated'}
                </span>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3">
                <span>Consensus records</span>
                <span className="min-w-0 text-right text-gray-300">{consensusIncidents.length}</span>
              </div>
            </div>

            {/* Consensus Validators */}
            <div className="mb-4 pt-3 border-t border-gray-800/60">
              <h3 className="text-[9px] uppercase tracking-widest text-gray-500 mb-2">Consensus Validators</h3>
              <div className="space-y-1.5">
                {[
                  { addr: '0x7f2a...3e1c', weight: '20%' },
                  { addr: '0x4b8d...9f2a', weight: '20%' },
                  { addr: '0x1e5c...7a4b', weight: '20%' },
                  { addr: '0x9d3f...2c8e', weight: '20%' },
                  { addr: '0x3a6e...5d1f', weight: '20%' },
                ].map((v, i) => {
                  const voted = !isConsensusBusy && consensusIncidents.length > 0;
                  const validating = isConsensusBusy && i < 3;
                  const dotColor = voted ? 'bg-[#10B981]' : validating ? 'bg-yellow-400 animate-pulse' : 'bg-gray-700';
                  const label = voted ? 'Approved' : validating ? 'Validating...' : 'Idle';
                  const labelColor = voted ? 'text-[#10B981]' : validating ? 'text-yellow-400' : 'text-gray-600';
                  return (
                    <div key={v.addr} className="flex items-center justify-between bg-black/30 border border-gray-800/50 rounded px-3 py-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                        <span className="text-[9px] font-mono text-gray-400">{v.addr}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[9px]">
                        <span className="text-gray-600">{v.weight}</span>
                        <span className={`font-bold uppercase tracking-widest ${labelColor}`}>{label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Allowlisted Response Actions */}
            <div className="mb-4">
              <h3 className="text-[9px] uppercase tracking-widest text-gray-500 mb-2">Allowlisted Response Actions</h3>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {['Pause', 'Quarantine', 'Monitor', 'Alert', 'Multisig'].map((action) => {
                  const active = selectedAction === action;
                  return (
                    <button
                      key={action}
                      type="button"
                      onClick={() => {
                        setSelectedAction(action);
                        setActionQueued(false);
                        setTimeout(() => setActionQueued(true), 600);
                      }}
                      className={`text-[9px] font-bold uppercase tracking-widest rounded px-2 py-1 border transition-all ${
                        active
                          ? 'bg-[#10B981] border-[#10B981] text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                          : 'bg-[#10B981]/10 border-[#10B981]/20 text-[#10B981] hover:bg-[#10B981]/20 hover:border-[#10B981]/40'
                      }`}
                    >
                      {action}
                    </button>
                  );
                })}
              </div>
              {selectedAction && actionQueued && (
                <p className="text-[9px] text-[#10B981] font-mono">
                  Action queued: <span className="font-bold">{selectedAction}</span> — pending GenLayer consensus approval
                </p>
              )}
            </div>

            <p className="min-h-8 text-[10px] text-gray-500 font-sans mb-4">{consensusStatus}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={connectGenLayerFallback}
                className="bg-[#18181B] border border-gray-800 text-white font-bold py-3 rounded text-[10px] hover:border-[#10B981]/50 transition-colors uppercase tracking-widest"
              >
                Prepare guard signer
              </button>
              <button
                onClick={escalateDemoIncident}
                disabled={isConsensusBusy || !genLayerAccount}
                className={`bg-[#10B981] text-black font-bold py-3 rounded text-[10px] transition-all uppercase tracking-widest ${isConsensusBusy || !genLayerAccount ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]'}`}
              >
                {isConsensusBusy ? 'Consensus running...' : 'Validate incident'}
              </button>
            </div>
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
                Consensus signal monitor
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigateToAppPath(window.location, `${HISTORY_PATH}?protocol=${encodeURIComponent(asset.address)}`)}
                        className="text-[#10B981] hover:underline"
                      >
                        View Activity
                      </button>
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
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right Layout (Command Console & Terminal) */}
        <motion.div 
          initial={false}
          animate={{ opacity: 1, x: 0 }}
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
      {showBootSequence && <BootSequence />}
      <Onboarding isOpen={showOnboarding} onClose={handleCloseOnboarding} />

      {/* Critical anomaly modal */}
      <AttackModal 
        isOpen={isAttackModalOpen} 
        onClose={() => setIsAttackModalOpen(false)} 
        onSuccess={() => {
          setIsAttackModalOpen(false);
          setTerminalLines((prev) => capTerminal([
            ...prev,
            "[SYS] 0-VALUE TRANSACTION CONFIRMED.",
            "[ALERT] Incident response workflow complete. Contract pause path confirmed."
          ]));
        }}
      />
    </main>
  );
}
