'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldOff, ShieldCheck, Play, TrendingDown, Lock } from 'lucide-react';

const START_TVL = 2_850_000;
// Fraction drained before BreachResponse pauses the protocol (~1.4s into the exploit).
const DETECTION_AT = 0.18;        // timeline progress where detection fires
const PROTECTED_LOSS = 0.018;     // 1.8% leaks before the pause lands
const DURATION_MS = 3600;

const usd = (n: number) =>
  '$' + Math.round(n).toLocaleString('en-US');

interface VaultPanelProps {
  protected_: boolean;
  progress: number;
  detected: boolean;
}

function VaultPanel({ protected_, progress, detected }: VaultPanelProps) {
  // Unprotected: drains linearly to ~2% dust. Protected: stops at PROTECTED_LOSS once detected.
  const drainedFraction = protected_
    ? Math.min(progress, DETECTION_AT) / DETECTION_AT * PROTECTED_LOSS
    : 0.02 + progress * 0.96;
  const remaining = START_TVL * (1 - Math.min(drainedFraction, 0.99));
  const pct = Math.max(1, (1 - Math.min(drainedFraction, 0.99)) * 100);

  const accent = protected_ ? '#10B981' : '#ef4444';

  return (
    <div className={`flex-1 rounded-2xl border p-5 ${protected_ ? 'border-[#10B981]/30 bg-[#10B981]/5' : 'border-red-500/30 bg-red-500/5'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {protected_ ? <ShieldCheck className="w-4 h-4 text-[#10B981]" /> : <ShieldOff className="w-4 h-4 text-red-400" />}
          <span className={`text-xs font-bold tracking-wider uppercase ${protected_ ? 'text-[#10B981]' : 'text-red-400'}`}>
            {protected_ ? 'With BreachResponse' : 'Unprotected vault'}
          </span>
        </div>
        {protected_ && detected && (
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1 text-[9px] font-bold text-[#10B981] border border-[#10B981]/40 bg-[#10B981]/10 px-1.5 py-0.5 rounded uppercase"
          >
            <Lock className="w-3 h-3" /> Paused
          </motion.span>
        )}
        {!protected_ && progress > 0.85 && (
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1 text-[9px] font-bold text-red-400 border border-red-500/40 bg-red-500/10 px-1.5 py-0.5 rounded uppercase"
          >
            <TrendingDown className="w-3 h-3" /> Drained
          </motion.span>
        )}
      </div>

      <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Vault balance</div>
      <div className="text-2xl md:text-3xl font-bold mb-4 font-mono" style={{ color: accent }}>
        {usd(remaining)}
      </div>

      {/* Liquid level bar */}
      <div className="relative h-28 rounded-lg bg-black/40 border border-gray-800/60 overflow-hidden">
        <motion.div
          className="absolute bottom-0 left-0 right-0"
          style={{ background: `linear-gradient(to top, ${accent}55, ${accent}22)`, borderTop: `2px solid ${accent}` }}
          animate={{ height: `${pct}%` }}
          transition={{ ease: 'linear', duration: 0.1 }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-mono font-bold" style={{ color: accent }}>{pct.toFixed(1)}%</span>
        </div>
      </div>

      <div className="mt-3 text-[10px] text-gray-500">
        {protected_
          ? <>Lost <span className="text-[#10B981] font-bold">{usd(START_TVL * drainedFraction)}</span> before auto-pause</>
          : <>Lost <span className="text-red-400 font-bold">{usd(START_TVL * Math.min(drainedFraction, 0.99))}</span> to the exploit</>}
      </div>
    </div>
  );
}

export default function VaultBeforeAfter() {
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);

  const play = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setPlaying(true);
    startRef.current = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - startRef.current) / DURATION_MS);
      setProgress(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setPlaying(false);
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    play();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [play]);

  const detected = progress >= DETECTION_AT;
  const saved = START_TVL * (1 - PROTECTED_LOSS) - START_TVL * 0.02;

  return (
    <div className="bg-[#101014]/50 backdrop-blur-md border border-gray-800/80 rounded-2xl overflow-hidden shadow-2xl">
      <div className="bg-[#101014]/80 border-b border-gray-800/60 px-6 py-4 flex items-center justify-between gap-4">
        <span className="text-xs text-gray-300 tracking-wider font-bold truncate">REENTRANCY EXPLOIT · SIDE-BY-SIDE</span>
        <button
          type="button"
          aria-label="Replay reentrancy exploit simulation"
          onClick={() => { if (!playing) play(); }}
          disabled={playing}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#10B981] hover:text-white disabled:text-gray-600 transition-colors shrink-0"
        >
          <Play className="w-3.5 h-3.5" /> {playing ? 'Running' : 'Replay'}
        </button>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <VaultPanel protected_={false} progress={progress} detected={detected} />
          <VaultPanel protected_={true} progress={progress} detected={detected} />
        </div>

        <AnimatePresence>
          {progress >= 0.99 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-xl border border-[#10B981]/30 bg-[#10B981]/5 p-4 text-center"
            >
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Capital preserved by automated pause</div>
              <div className="text-2xl font-bold text-[#10B981] font-mono">{usd(saved)}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
