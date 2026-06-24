'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radar, Cpu, ShieldCheck, Loader2, CheckCircle2, AlertTriangle,
  ArrowRight, RefreshCw, Activity,
} from 'lucide-react';
import { scanRecentThreats, type ScannedThreat } from '../lib/threatScan';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Analysis {
  confidence: number;
  severity: string;
  evidencePoints: string[];
  recommendation: string;
  reasoning: string;
  gasUsed: number;
  expectedGas: number;
  gasAnomalyFactor: number;
}

type StageStatus = 'pending' | 'active' | 'done';
type StageKey = 'monitor' | 'detect' | 'respond';

interface StageState {
  monitor: StageStatus;
  detect: StageStatus;
  respond: StageStatus;
}

const INITIAL_STAGES: StageState = { monitor: 'pending', detect: 'pending', respond: 'pending' };

const severityColor = (s: string) => {
  switch (s?.toUpperCase()) {
    case 'CRITICAL': return 'text-red-400 border-red-500/40 bg-red-500/10';
    case 'HIGH': return 'text-orange-400 border-orange-500/40 bg-orange-500/10';
    case 'MEDIUM': return 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10';
    default: return 'text-[#10B981] border-[#10B981]/40 bg-[#10B981]/10';
  }
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Demo fallback when the chain scan finds no candidate (empty testnet blocks).
const FALLBACK_TARGET: Pick<ScannedThreat, 'txHash' | 'protocol' | 'type'> = {
  txHash: '0x8f2a4c1d9b7e3a6f50c28d41ab9e7f3c2d1a8b6e4f9c0d7a3b5e1f8c2a4d6b9aac',
  protocol: 'MantleSwap',
  type: 'Reentrancy',
};

// ─── Stage descriptor ───────────────────────────────────────────────────────

function StageNode({
  icon, label, sub, status,
}: { icon: React.ReactNode; label: string; sub: string; status: StageStatus }) {
  return (
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <motion.div
        animate={
          status === 'active'
            ? { scale: [1, 1.08, 1], boxShadow: ['0 0 0 rgba(16,185,129,0)', '0 0 24px rgba(16,185,129,0.5)', '0 0 0 rgba(16,185,129,0)'] }
            : { scale: 1 }
        }
        transition={{ duration: 1.4, repeat: status === 'active' ? Infinity : 0, ease: 'easeInOut' }}
        className={`relative w-11 h-11 shrink-0 rounded-xl border flex items-center justify-center ${
          status === 'pending'
            ? 'border-gray-800 bg-[#0C0C0E] text-gray-600'
            : status === 'active'
            ? 'border-[#10B981] bg-[#10B981]/10 text-[#10B981]'
            : 'border-[#10B981]/40 bg-[#10B981]/5 text-[#10B981]'
        }`}
      >
        {status === 'active' ? <Loader2 className="w-5 h-5 animate-spin" /> : status === 'done' ? <CheckCircle2 className="w-5 h-5" /> : icon}
      </motion.div>
      <div className="min-w-0">
        <div className={`text-xs font-bold tracking-wider uppercase ${status === 'pending' ? 'text-gray-600' : 'text-white'}`}>{label}</div>
        <div className="text-[10px] text-gray-500 truncate">{sub}</div>
      </div>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function LivePipeline() {
  const [stages, setStages] = useState<StageState>(INITIAL_STAGES);
  const [target, setTarget] = useState<Pick<ScannedThreat, 'txHash' | 'protocol' | 'type'> | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [running, setRunning] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);
  const cancelledRef = useRef(false);

  const setStage = (key: StageKey, status: StageStatus) =>
    setStages((prev) => ({ ...prev, [key]: status }));

  const runPipeline = useCallback(async () => {
    cancelledRef.current = false;
    setRunning(true);
    setAnalysis(null);
    setTarget(null);
    setUsedFallback(false);
    setStages(INITIAL_STAGES);

    // ── Stage 1: Monitor Mantle ──────────────────────────────────────────────
    setStage('monitor', 'active');
    let candidate: Pick<ScannedThreat, 'txHash' | 'protocol' | 'type'> | null = null;
    try {
      const scanned = await scanRecentThreats({ blockCount: 4, txPerBlock: 8, heuristicOnly: true });
      const threats = scanned.filter((t) => t.status !== 'SAFE' && t.txHash);
      if (threats.length > 0) candidate = threats[0];
    } catch {
      // fall through to fallback target
    }
    if (cancelledRef.current) return;
    if (!candidate) { candidate = FALLBACK_TARGET; setUsedFallback(true); }
    setTarget(candidate);
    await sleep(700);
    if (cancelledRef.current) return;
    setStage('monitor', 'done');

    // ── Stage 2: Groq AI analysis ────────────────────────────────────────────
    setStage('detect', 'active');
    await sleep(400);
    let result: Analysis | null = null;
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash: candidate.txHash, protocol: candidate.protocol, threatType: candidate.type }),
      });
      if (res.ok) result = await res.json();
    } catch {
      // analyze route always returns a graceful fallback; null only on network error
    }
    if (cancelledRef.current) return;
    setAnalysis(result);
    await sleep(700);
    setStage('detect', 'done');

    // ── Stage 3: Response proposal ───────────────────────────────────────────
    setStage('respond', 'active');
    await sleep(900);
    if (cancelledRef.current) return;
    setStage('respond', 'done');
    setRunning(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    runPipeline();
    return () => { cancelledRef.current = true; };
  }, [runPipeline]);

  const gasSaved = analysis ? Math.max(0, analysis.gasUsed - analysis.expectedGas) : 0;

  return (
    <div className="bg-[#101014]/50 backdrop-blur-md border border-gray-800/80 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-[#101014]/80 border-b border-gray-800/60 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <Activity className="w-4 h-4 text-[#10B981] shrink-0" />
          <span className="text-xs text-gray-300 tracking-wider font-bold truncate">LIVE INCIDENT PIPELINE</span>
          {usedFallback && (
            <span className="text-[9px] text-yellow-500/80 border border-yellow-500/30 bg-yellow-500/10 px-1.5 py-0.5 rounded shrink-0">DEMO SAMPLE</span>
          )}
        </div>
        <button
          type="button"
          aria-label="Replay incident pipeline"
          onClick={() => { if (!running) runPipeline(); }}
          disabled={running}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#10B981] hover:text-white disabled:text-gray-600 transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} /> {running ? 'Running' : 'Replay'}
        </button>
      </div>

      {/* Stage rail */}
      <div className="px-6 py-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 border-b border-gray-800/40">
        <StageNode icon={<Radar className="w-5 h-5" />} label="Monitor" sub="Mantle Sepolia RPC" status={stages.monitor} />
        <ArrowRight className="hidden sm:block w-4 h-4 text-gray-700 shrink-0" />
        <StageNode icon={<Cpu className="w-5 h-5" />} label="Detect" sub="Groq · Llama 3.1" status={stages.detect} />
        <ArrowRight className="hidden sm:block w-4 h-4 text-gray-700 shrink-0" />
        <StageNode icon={<ShieldCheck className="w-5 h-5" />} label="Respond" sub="Human-gated proposal" status={stages.respond} />
      </div>

      {/* Detail body */}
      <div className="p-6 space-y-4 font-mono">
        {/* Target tx */}
        <AnimatePresence>
          {target && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-black/40 border border-gray-800/60 p-4"
            >
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Captured transaction</div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-gray-300 font-bold break-all">{target.txHash.slice(0, 18)}…{target.txHash.slice(-8)}</span>
                <span className="text-[10px] text-[#10B981]">{target.protocol}</span>
              </div>
              <a
                href={`https://sepolia.mantlescan.xyz/tx/${target.txHash}`}
                target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-[#10B981] hover:underline mt-1 inline-block"
              >
                View on Mantlescan ↗
              </a>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI verdict */}
        <AnimatePresence>
          {analysis && stages.detect === 'done' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-black/40 border border-gray-800/60 p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-[10px] text-gray-500 uppercase tracking-widest">Groq AI verdict</div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${severityColor(analysis.severity)}`}>{analysis.severity}</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-[#10B981]">{(analysis.confidence * 100).toFixed(0)}%</span>
                <span className="text-[10px] text-gray-500 mb-1.5">threat confidence</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed font-sans">{analysis.reasoning}</p>
              {Array.isArray(analysis.evidencePoints) && analysis.evidencePoints.length > 0 && (
                <ul className="space-y-1.5">
                  {analysis.evidencePoints.slice(0, 3).map((ev, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 * i }}
                      className="flex items-start gap-2 text-[11px] text-gray-300"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 mt-0.5 shrink-0" />
                      <span className="font-sans">{ev}</span>
                    </motion.li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Response proposal */}
        <AnimatePresence>
          {analysis && stages.respond === 'done' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-[#10B981]/5 border border-[#10B981]/30 p-4 space-y-3"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                <span className="text-xs font-bold text-[#10B981] tracking-wider uppercase">Response proposal ready</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="rounded bg-black/30 p-2.5 border border-gray-800/60">
                  <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Recommended action</div>
                  <div className="text-white font-bold">{analysis.recommendation}</div>
                </div>
                <div className="rounded bg-black/30 p-2.5 border border-gray-800/60">
                  <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Gas anomaly</div>
                  <div className="text-white font-bold">{analysis.gasAnomalyFactor?.toFixed?.(1) ?? '—'}× baseline</div>
                </div>
              </div>
              {gasSaved > 0 && (
                <div className="text-[11px] text-gray-400">
                  Estimated <span className="text-[#10B981] font-bold">{gasSaved.toLocaleString()} gas</span> avoided vs. an unguarded execution.
                </div>
              )}
              <div className="flex items-center gap-2 text-[10px] text-gray-500 pt-1 border-t border-gray-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                Awaiting operator approval — no action executes without a human signature.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
