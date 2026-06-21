'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Loader2, RefreshCw, GitCompare, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { scanRecentThreats, type ScannedThreat } from '../lib/threatScan';

interface ModelVerdict {
  model: string;
  provider: string;
  confidence: number;
  severity: string;
  recommendation: string;
  reasoning: string;
  latencyMs: number;
  source: 'live' | 'fallback';
}

interface CompareResult {
  groq: ModelVerdict;
  hunyuan: ModelVerdict;
  agreement: boolean;
  consensusConfidence: number;
}

const FALLBACK_TARGET: Pick<ScannedThreat, 'txHash' | 'protocol' | 'type'> = {
  txHash: '0x1b4d8c2e9f3a7b6051d28c41ae9f7b3c2d1a8b6e4f9c0d7a3b5e1f8c2a4d62ccf',
  protocol: 'LendX Protocol',
  type: 'Flash Loan Attack',
};

const severityColor = (s: string) => {
  switch (s?.toUpperCase()) {
    case 'CRITICAL': return 'text-red-400 border-red-500/40 bg-red-500/10';
    case 'HIGH': return 'text-orange-400 border-orange-500/40 bg-orange-500/10';
    case 'MEDIUM': return 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10';
    default: return 'text-[#10B981] border-[#10B981]/40 bg-[#10B981]/10';
  }
};

function VerdictCard({ v }: { v: ModelVerdict }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="flex-1 rounded-xl bg-black/40 border border-gray-800/60 p-5 space-y-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#10B981]" />
          <span className="text-sm font-bold text-white">{v.provider}</span>
        </div>
        <span className="text-[9px] text-gray-500 font-mono">{v.model}</span>
      </div>

      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-[#10B981]">{(v.confidence * 100).toFixed(0)}%</span>
        <span className="text-[10px] text-gray-500 mb-1.5">confidence</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${severityColor(v.severity)}`}>{v.severity}</span>
        <span className="text-[10px] text-gray-400 border border-gray-800 rounded px-2 py-0.5">{v.recommendation}</span>
      </div>

      <p className="text-[11px] text-gray-400 leading-relaxed font-sans min-h-[44px]">{v.reasoning}</p>

      <div className="flex items-center justify-between pt-2 border-t border-gray-800/40 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {v.latencyMs}ms</span>
        <span className={v.source === 'live' ? 'text-[#10B981]' : 'text-yellow-500/80'}>
          {v.source === 'live' ? 'LIVE INFERENCE' : 'FALLBACK'}
        </span>
      </div>
    </motion.div>
  );
}

export default function ModelComparison() {
  const [target, setTarget] = useState<Pick<ScannedThreat, 'txHash' | 'protocol' | 'type'> | null>(null);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const cancelledRef = useRef(false);

  const run = useCallback(async () => {
    cancelledRef.current = false;
    setLoading(true);
    setResult(null);

    let candidate: Pick<ScannedThreat, 'txHash' | 'protocol' | 'type'> = FALLBACK_TARGET;
    try {
      const scanned = await scanRecentThreats({ blockCount: 4, txPerBlock: 8, heuristicOnly: true });
      const threat = scanned.find((t) => t.status !== 'SAFE' && t.txHash);
      if (threat) candidate = threat;
    } catch { /* keep fallback */ }
    if (cancelledRef.current) return;
    setTarget(candidate);

    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash: candidate.txHash, protocol: candidate.protocol, threatType: candidate.type }),
      });
      if (res.ok && !cancelledRef.current) setResult(await res.json());
    } catch { /* surface nothing — keep prior state */ }
    if (!cancelledRef.current) setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    run();
    return () => { cancelledRef.current = true; };
  }, [run]);

  return (
    <div className="bg-[#101014]/50 backdrop-blur-md border border-gray-800/80 rounded-2xl overflow-hidden shadow-2xl">
      <div className="bg-[#101014]/80 border-b border-gray-800/60 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <GitCompare className="w-4 h-4 text-[#10B981] shrink-0" />
          <span className="text-xs text-gray-300 tracking-wider font-bold truncate">DUAL-MODEL CONSENSUS</span>
        </div>
        <button
          type="button"
          onClick={() => { if (!loading) run(); }}
          disabled={loading}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#10B981] hover:text-white disabled:text-gray-600 transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> {loading ? 'Querying' : 'Re-run'}
        </button>
      </div>

      <div className="p-6 space-y-4">
        {target && (
          <div className="text-[10px] text-gray-500 font-mono">
            Classifying <span className="text-gray-300">{target.txHash.slice(0, 14)}…{target.txHash.slice(-6)}</span>
            <span className="text-[#10B981]"> · {target.protocol}</span>
          </div>
        )}

        {loading && !result ? (
          <div className="flex items-center justify-center gap-2 py-12 text-gray-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Running Groq + Hunyuan in parallel…
          </div>
        ) : result ? (
          <>
            <div className="flex flex-col md:flex-row gap-4">
              <VerdictCard v={result.groq} />
              <VerdictCard v={result.hunyuan} />
            </div>

            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`rounded-xl border p-4 flex items-center justify-between gap-4 ${
                result.agreement ? 'border-[#10B981]/30 bg-[#10B981]/5' : 'border-yellow-500/30 bg-yellow-500/5'
              }`}
            >
              <div className="flex items-center gap-2">
                {result.agreement
                  ? <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                  : <AlertCircle className="w-5 h-5 text-yellow-500" />}
                <span className={`text-xs font-bold ${result.agreement ? 'text-[#10B981]' : 'text-yellow-400'}`}>
                  {result.agreement ? 'Models agree on severity' : 'Severity disagreement — escalate to human review'}
                </span>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[9px] text-gray-500 uppercase tracking-widest">Consensus</div>
                <div className="text-lg font-bold text-white">{(result.consensusConfidence * 100).toFixed(0)}%</div>
              </div>
            </motion.div>
          </>
        ) : (
          <div className="py-12 text-center text-gray-600 text-sm">No comparison available.</div>
        )}
      </div>
    </div>
  );
}
