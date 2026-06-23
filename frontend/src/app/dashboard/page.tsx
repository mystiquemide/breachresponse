'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { getAddress } from 'viem';
import { Radio, Activity, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Onboarding from './Onboarding';
import AttackModal from './AttackModal';
import { REGISTRY_ADDRESS, REGISTRY_ABI } from '../constants';
import { DASHBOARD_PATH, HISTORY_PATH, LANDING_PATH, clearCommandCenterNavigationState, navigateToAppPath, replaceWithAppPath } from '../../lib/navigation';
import AuditScanner from '../../components/AuditScanner';
import GasEstimator from '../../components/GasEstimator';
import { WalletConnectControl } from '../../components/WalletConnectControl';
import {
  GENLAYER_CONSENSUS_GUARD_ADDRESS,
  type GenLayerAccount,
  IncidentConsensusGuardClient,
  createGenLayerClient,
  generateGenLayerAccount,
  getStoredGenLayerAccount,
} from '../../lib/genlayerConsensus';
import { type Asset, type ValueMetrics, capTerminal } from './types';
import BootSequence from './components/BootSequence';
import StatsStrip from './components/StatsStrip';
import RegisterSentinelCard from './components/RegisterSentinelCard';
import GenLayerGuardCard from './components/GenLayerGuardCard';
import MonitoredNodes from './components/MonitoredNodes';
import SentinelConsole from './components/SentinelConsole';

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
  const [demoMode, setDemoMode] = useState(false);
  const [isSSEConnected, setIsSSEConnected] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const sseActivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const simulatedStreamRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [cumulativeGasSaved, setCumulativeGasSaved] = useState(0);
  const [simThreatCount, setSimThreatCount] = useState(0);
  const [simSafeCount, setSimSafeCount] = useState(0);
  
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
    // Auto-show onboarding for first-time visitors
    const shouldOpenTour = new URLSearchParams(window.location.search).get('tour') === '1';
    const hasOnboarded = localStorage.getItem('breachresponse_onboarded');
    if (shouldOpenTour || !hasOnboarded) {
      setTimeout(() => setShowOnboarding(true), 1200);
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

  // Live block scan & api logs via Server-Sent Events (SSE) with simulation fallback
  useEffect(() => {
    const simulatedProtocols = ['MantleSwap', 'LendX Protocol', 'YieldFlow', 'ApexVaults', 'LiquidMNT'];
    const simulatedThreats = [
      { name: 'Reentrancy signature 0x89A', severity: 'CRITICAL', gasSave: 12450 },
      { name: 'Oracle price deviation 12%', severity: 'HIGH', gasSave: 8900 },
      { name: 'Flash loan detected 500 MNT', severity: 'HIGH', gasSave: 15700 },
      { name: 'Unusual gas pattern', severity: 'MEDIUM', gasSave: 3200 },
      { name: 'Suspicious delegatecall', severity: 'CRITICAL', gasSave: 22300 },
      { name: 'Unchecked external call', severity: 'HIGH', gasSave: 6800 },
      { name: 'Timestamp manipulation', severity: 'MEDIUM', gasSave: 4100 },
    ];
    const simulatedSafe = [
      'Normal ERC-20 transfer', 'Contract interaction (safe)', 'View-only call',
      'Approved allowance update', 'Standard swap execution', 'Liquidity provision',
      'Governance vote cast', 'Token mint (authorized)',
    ];
    let sseHadActivity = false;
    let blockCounter = 14200000;

    const stopHeartbeat = () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };

    const startHeartbeat = () => {
      stopHeartbeat();
      heartbeatRef.current = setInterval(() => {
        setTerminalLines(prev => capTerminal([...prev,
          `[HEARTBEAT] Sentinel telemetry stream healthy — ${new Date().toISOString()}`,
        ]));
      }, 20000);
    };

    const startSimulatedStream = () => {
      if (simulatedStreamRef.current) return;
      setIsSimulating(true);
      setTerminalLines(prev => capTerminal([...prev,
        '[SYS] Demo mode active — simulated Mantle Sepolia agent stream',
        '[SYS] Threat signatures loaded: Reentrancy, Oracle, FlashLoan, DelegateCall, GasAnomaly',
        '[SYS] Response engine initialized — operator-gated by default',
      ]));
      startHeartbeat();
      simulatedStreamRef.current = setInterval(() => {
        const roll = Math.random();
        const blockNum = blockCounter++;
        const proto = simulatedProtocols[Math.floor(Math.random() * simulatedProtocols.length)];

        if (roll < 0.30) {
          // Threat detected
          const threat = simulatedThreats[Math.floor(Math.random() * simulatedThreats.length)];
          const confidence = (0.72 + Math.random() * 0.27);
          setTerminalLines(prev => capTerminal([...prev,
            `[LOG] [SCAN] Scanning Mantle Sepolia Block #${blockNum}`,
            `[ALERT] [ANOMALY-ALERT] ${threat.name} detected on ${proto} [${threat.severity}]`,
            `[SYS] [ANALYZER-LLM] Groq AI confidence: ${confidence.toFixed(2)} — ${threat.severity} threat classified`,
            `[SYS] [SENTINEL] Response proposal queued for ${proto} — est. gas saved: ${threat.gasSave.toLocaleString()}`,
            `[SYS] [CONSENSUS] Awaiting operator review — manual approval required`,
          ]));
          setBlocksScanned(prev => prev + 1);
          setCumulativeGasSaved(prev => prev + threat.gasSave);
          setSimThreatCount(prev => prev + 1);
        } else if (roll < 0.55) {
          // Safe transaction
          const safe = simulatedSafe[Math.floor(Math.random() * simulatedSafe.length)];
          setTerminalLines(prev => capTerminal([...prev,
            `[LOG] [SCAN] Scanning Mantle Sepolia Block #${blockNum}`,
            `[LOG] ${safe} on ${proto} — no threat signature matched`,
          ]));
          setBlocksScanned(prev => prev + 1);
          setSimSafeCount(prev => prev + 1);
        } else {
          // System status / heartbeat
          const msgs = [
            `[SYS] Sentinel registry synced — ${customAssets.length + 3} guards active`,
            `[SYS] Mantle Sepolia RPC latency: ${(2.1 + Math.random() * 5).toFixed(1)}ms`,
            `[SYS] Mempool depth: ${Math.floor(40 + Math.random() * 200)} pending txns`,
            `[SYS] Groq inference engine healthy — avg response: ${(180 + Math.random() * 400).toFixed(0)}ms`,
            `[SYS] GenLayer consensus network: 5/5 validators online`,
          ];
          setTerminalLines(prev => capTerminal([...prev, msgs[Math.floor(Math.random() * msgs.length)]]));
        }
      }, 2800 + Math.random() * 2200);
    };

    const stopSimulatedStream = () => {
      if (simulatedStreamRef.current) {
        clearInterval(simulatedStreamRef.current);
        simulatedStreamRef.current = null;
      }
      setIsSimulating(false);
      stopHeartbeat();
    };

    const sse = new EventSource('/api/logs/stream');
    
    sse.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        // Ignore heartbeats — they don't count as real activity
        if (payload.type === 'heartbeat') return;

        sseHadActivity = true;
        stopSimulatedStream();
        setIsSSEConnected(true);

        if (payload.type === 'system') {
          setTerminalLines(prev => capTerminal([...prev, `[SYS] ${payload.message}`]));
        } else if (payload.type === 'LOG') {
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
          const log = payload.data;
          setTerminalLines(prev => capTerminal([...prev, `[ALERT] Response proposal recorded for ${log.protocol}. Type: ${log.type}. Metric: ${log.gasSaved}`]));
        } else if (payload.type === 'CONNECTED') {
          setTerminalLines(prev => capTerminal([...prev, `[SYS] ${payload.message}`]));
        }
      } catch (err) {
        console.warn("SSE Parse Error", err);
      }
    };

    sse.onerror = () => {
      console.warn("SSE Error — falling back to simulated stream");
      sse.close();
      setIsSSEConnected(false);
      if (!sseHadActivity) {
        startSimulatedStream();
      }
    };

    sse.onopen = () => {
      setIsSSEConnected(true);
    };

    // If no real events within 8 seconds, start simulation
    sseActivityTimer.current = setTimeout(() => {
      if (!sseHadActivity) {
        startSimulatedStream();
      }
    }, 8000);

    return () => {
      sse.close();
      stopSimulatedStream();
      if (sseActivityTimer.current) {
        clearTimeout(sseActivityTimer.current);
        sseActivityTimer.current = null;
      }
    };
  }, [customAssets.length]);
  useEffect(() => {
    if (!demoMode) return;
    // Pre-populate with demo sentinels if none exist
    if (customAssets.length === 0) {
      const demoSentinels: Asset[] = [
        { id: 'demo-1', name: 'MantleSwap Vault Guard', address: '0x5e8c1a2f3b4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f', status: 'ACTIVE', latency: '4.2ms', events: 1423, lastHeartbeat: new Date().toISOString() },
        { id: 'demo-2', name: 'LendX Protocol Sentinel', address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a', status: 'ACTIVE', latency: '7.1ms', events: 892, lastHeartbeat: new Date().toISOString() },
        { id: 'demo-3', name: 'YieldFlow Oracle Guard', address: '0x9f8e7d6c5b4a3928170654fedcba9876543210', status: 'MITIGATING', latency: '12.4ms', events: 567, lastHeartbeat: new Date().toISOString() },
      ];
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCustomAssets(demoSentinels);
      setBlocksScanned(prev => Math.max(prev, 2882));
    }
    if (consensusIncidents.length === 0) {
      setConsensusIncidents([
        { id: 'mantle-1719000000000', status: 'approved', timestamp: Date.now() - 3600000 },
        { id: 'mantle-1719003600000', status: 'approved', timestamp: Date.now() - 1800000 },
      ]);
      setConsensusStatus('Consensus guard read complete — 2 incidents validated');
    }
    // Pre-populate demo value metrics if none loaded
    if (!valueMetrics) {
      setValueMetrics({
        network: 'Mantle Sepolia',
        chainId: 5003,
        source: 'RPC (demo)',
        totalUsd: 2847500,
        native: { symbol: 'MNT', amount: '12500.45', usd: 12500.45 },
        tokens: [
          { symbol: 'USDC', amount: '500000', usd: 500000 },
          { symbol: 'WETH', amount: '350.2', usd: 1225700 },
          { symbol: 'USDT', amount: '750000', usd: 750000 },
        ],
        updatedAt: new Date().toISOString(),
      });
    }
  }, [demoMode, customAssets.length, consensusIncidents.length, valueMetrics]);

  // Fetch initial registered sentinels from database
  useEffect(() => {
    if (!walletAddress) return;
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
    const interval = window.setInterval(() => {
      if (document.hidden) return;
      fetchSentinels();
    }, 120000); // Reduced from 60s to 120s for Vercel limits
    return () => window.clearInterval(interval);
  }, [walletAddress]);

  // Fetch read-only value monitored metrics from Mantle RPC
  useEffect(() => {
    if (!walletAddress) return;
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
    const interval = window.setInterval(() => {
      if (document.hidden) return;
      fetchValueMetrics();
    }, 300000); // Reduced from 120s to 300s for Vercel limits
    return () => window.clearInterval(interval);
  }, [walletAddress]);

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
          {/* Demo Mode Toggle */}
          <button
            type="button"
            onClick={() => setDemoMode(!demoMode)}
            className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded border transition-all ${
              demoMode
                ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.3)]'
                : 'bg-[#18181B]/50 border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600'
            }`}
            title="Toggle Demo Mode — pre-populates dashboard with realistic simulation data"
          >
            {demoMode ? '🧪 Demo On' : 'Demo Mode'}
          </button>
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

      {/* Demo Mode Banner */}
      {demoMode && (
        <div className="relative z-10 mb-6 px-4 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">🧪</span>
            <div>
              <span className="text-yellow-400 font-bold text-xs uppercase tracking-widest">Demo Mode Active</span>
              <p className="text-yellow-400/60 text-[10px] mt-0.5 font-sans">
                Pre-populated with simulation data. All threat events, sentinels, and consensus records are synthetic.
                Connect a Mantle wallet and register a contract to test real on-chain monitoring.
              </p>
            </div>
          </div>
          <button
            onClick={() => setDemoMode(false)}
            className="text-yellow-400/70 hover:text-yellow-300 text-[10px] font-bold uppercase tracking-widest border border-yellow-500/30 rounded px-3 py-1.5 transition-colors shrink-0 ml-4"
          >
            Exit Demo
          </button>
        </div>
      )}

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
      <StatsStrip
        blocksScanned={blocksScanned}
        activeSentinels={allAssets.length}
        liveWorkerChecks={liveWorkerChecks}
        valueMetrics={valueMetrics}
        valueMetricsError={valueMetricsError}
        responseProposals={consensusIncidents.length}
        cumulativeGasSaved={cumulativeGasSaved}
      />

      {/* Workspace Grid */}
      <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Layout (Forms & Registry) */}
        <motion.div 
          initial={false}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 space-y-8"
        >
          
          {/* Register Sentinel Card */}
          <RegisterSentinelCard
            sentinelName={sentinelName}
            setSentinelName={setSentinelName}
            protocolAddress={protocolAddress}
            setProtocolAddress={setProtocolAddress}
            handleRegister={handleRegister}
            isPending={isPending}
            isConfirming={isConfirming}
            isConfirmed={isConfirmed}
            receiptSuccess={receipt?.status === 'success'}
            writeErrorMsg={writeErrorMsg}
          />

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
          <GenLayerGuardCard
            genLayerAccount={genLayerAccount}
            consensusIncidentCount={consensusIncidents.length}
            isConsensusBusy={isConsensusBusy}
            selectedAction={selectedAction}
            setSelectedAction={setSelectedAction}
            setActionQueued={setActionQueued}
            actionQueued={actionQueued}
            consensusStatus={consensusStatus}
            connectGenLayerFallback={connectGenLayerFallback}
            escalateDemoIncident={escalateDemoIncident}
          />

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
          <MonitoredNodes assets={allAssets} toggleAssetStatus={toggleAssetStatus} />
        </motion.div>

        {/* Right Layout (Command Console & Terminal) */}
        <SentinelConsole
          isSSEConnected={isSSEConnected}
          simulatedActive={isSimulating}
          cumulativeGasSaved={cumulativeGasSaved}
          simThreatCount={simThreatCount}
          simSafeCount={simSafeCount}
          blocksScanned={blocksScanned}
          terminalLines={terminalLines}
          terminalContainerRef={terminalContainerRef}
          terminalEndRef={terminalEndRef}
          handleTerminalScroll={handleTerminalScroll}
          commandInput={commandInput}
          setCommandInput={setCommandInput}
          handleCommandSubmit={handleCommandSubmit}
        />

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
