'use client'

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Terminal, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';

interface AttackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Analysis {
  confidence: number;
  severity: string;
  evidencePoints: string[];
  recommendation: string;
  reasoning: string;
}

const DEMO_TX = '0x8f2a9aac22df9917c90a54dbd04f4716d98fe78d76400400cc091bf46dabe9aac';

const payloadLines = [
  "> Analyzing attack vector...",
  "> Signature Match: REENTRANCY_0x89A",
  "> Target: MantleSwap Vault (0x5e8c...1a2f)",
  "> Fetching on-chain state at block #9482847...",
  "> Recursive call depth: 3 — threshold exceeded",
  "> Formulating scoped response proposal...",
  "> function pause() external;",
  "> Estimating execution route and priority fee...",
  "> Response payload ready for operator signature."
];

export default function AttackModal({ isOpen, onClose, onSuccess }: AttackModalProps) {
  const { sendTransaction, isPending, isSuccess, isError } = useSendTransaction();
  const [payloadText, setPayloadText] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (intervalRef.current) clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnalysis(null);
    setIsAnalyzing(true);

    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        txHash: DEMO_TX,
        protocol: 'MantleSwap Vault',
        threatType: 'Reentrancy (0x89A)'
      })
    })
      .then(r => r.json())
      .then((data: Analysis) => setAnalysis(data))
      .catch(() => setAnalysis({
        confidence: 0.94,
        severity: 'CRITICAL',
        evidencePoints: ['3 recursive calls detected', 'State mutation after transfer', 'Gas anomaly flagged'],
        recommendation: 'Pause protocol',
        reasoning: 'Classic reentrancy pattern with recursive calls preceding state updates.'
      }))
      .finally(() => setIsAnalyzing(false));

    let i = 0;
    // Build text from scratch each tick — avoids accumulation bugs on re-render
    intervalRef.current = setInterval(() => {
      i++;
      setPayloadText(payloadLines.slice(0, i).join('\n'));
      if (i >= payloadLines.length) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
      }
    }, 400);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => onSuccess(), 1500);
    }
  }, [isSuccess, onSuccess]);

  if (!isOpen) return null;

  const confidencePct = analysis ? `${(analysis.confidence * 100).toFixed(0)}%` : '—';
  const severityLabel = analysis?.severity ?? 'HIGH';
  const evidence = analysis?.evidencePoints?.[0] ?? '—';
  const recommendation = analysis?.recommendation ?? '—';

  const handleExecute = () => {
    sendTransaction({
      to: '0x0000000000000000000000000000000000000000',
      value: parseEther('0'),
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-red-950/40 backdrop-blur-md"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.1)_0%,transparent_100%)] animate-pulse" />
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 50, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-[#09090B] border-2 border-red-500 shadow-[0_0_100px_rgba(239,68,68,0.4)] rounded-xl overflow-hidden"
          >
            <div className="bg-red-500 text-white font-bold p-4 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3 text-lg tracking-widest uppercase">
                <AlertTriangle className="w-6 h-6" />
                CRITICAL ANOMALY DETECTED
              </div>
              <span className="font-mono text-xs">SEVERITY: TIER 1</span>
            </div>

            <div className="p-8 space-y-6">

              {/* AI Analysis Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#18181B] p-4 rounded-lg border border-red-500/30">
                  <span className="text-gray-500 text-xs font-bold uppercase tracking-widest block mb-1">Threat Type</span>
                  <span className="text-red-400 font-mono font-bold">Reentrancy (0x89A)</span>
                </div>
                <div className="bg-[#18181B] p-4 rounded-lg border border-red-500/30">
                  <span className="text-gray-500 text-xs font-bold uppercase tracking-widest block mb-1">Confidence Score</span>
                  <span className="text-white font-mono font-bold">
                    {isAnalyzing ? <span className="animate-pulse text-gray-500">Analyzing...</span> : (
                      <>{confidencePct} <span className="text-[#10B981] text-[10px]">{severityLabel}</span></>
                    )}
                  </span>
                </div>
                <div className="bg-[#18181B] p-4 rounded-lg border border-red-500/30">
                  <span className="text-gray-500 text-xs font-bold uppercase tracking-widest block mb-1">Evidence Found</span>
                  <span className="text-white font-mono font-bold text-xs">
                    {isAnalyzing ? <span className="animate-pulse text-gray-500">Scanning...</span> : evidence}
                  </span>
                </div>
                <div className="bg-[#18181B] p-4 rounded-lg border border-red-500/30">
                  <span className="text-gray-500 text-xs font-bold uppercase tracking-widest block mb-1">Recommendation</span>
                  <span className="text-[#10B981] font-mono font-bold text-xs">
                    {isAnalyzing ? <span className="animate-pulse text-gray-500">Computing...</span> : recommendation}
                  </span>
                </div>
              </div>

              {/* AI Reasoning */}
              {analysis?.reasoning && (
                <div className="bg-[#18181B]/60 border border-gray-800 rounded-lg px-4 py-3">
                  <span className="text-[9px] uppercase tracking-widest text-gray-500 block mb-1">AI Reasoning</span>
                  <p className="text-gray-300 text-xs font-sans leading-relaxed">{analysis.reasoning}</p>
                </div>
              )}

              {/* Streaming Terminal */}
              <div className="bg-black rounded-lg border border-gray-800 p-4 relative overflow-hidden h-48">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-800/60">
                  <Terminal className="w-4 h-4 text-[#10B981]" />
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Sentinel Agent Formulation</span>
                </div>
                <pre className="font-mono text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {payloadText}
                  <span className="animate-pulse">_</span>
                </pre>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] opacity-25 pointer-events-none" />
              </div>

              {/* Action Area */}
              <div className="pt-4 flex justify-between items-center">
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
                >
                  Dismiss / Ignore
                </button>

                {isSuccess ? (
                  <div className="bg-[#10B981]/20 border border-[#10B981] text-[#10B981] px-8 py-4 rounded font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> Response Executed
                  </div>
                ) : (
                  <button
                    onClick={handleExecute}
                    disabled={isPending || payloadText.split('\n').length < payloadLines.length}
                    className={`bg-[#10B981] text-black font-bold px-8 py-4 rounded flex items-center gap-3 transition-all ${isPending || payloadText.split('\n').length < payloadLines.length ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]'}`}
                  >
                    <Shield className="w-5 h-5" />
                    {isPending ? "Awaiting Signature..." : "Approve Response"}
                    {!isPending && <ArrowRight className="w-5 h-5" />}
                  </button>
                )}
              </div>

              {isError && (
                <div className="text-red-500 text-xs text-center font-bold mt-2">
                  Signature rejected or transaction failed. Response remains pending.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
