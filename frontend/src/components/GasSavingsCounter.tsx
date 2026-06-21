'use client'

import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Flame, TrendingUp, Activity } from 'lucide-react';

interface GasSavingsCounterProps {
  /** Final value to count up to. */
  target?: number;
  /** Count-up duration in ms. */
  durationMs?: number;
  /** When true, keeps ticking upward slowly after the initial count to feel live. */
  live?: boolean;
  /** Compact single-stat variant (used inside the dashboard). */
  compact?: boolean;
  label?: string;
  unit?: string;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

function useCountUp(target: number, durationMs: number, active: boolean) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      setValue(target * easeOutCubic(p));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, durationMs, active]);

  return value;
}

export default function GasSavingsCounter({
  target = 4_287_500,
  durationMs = 2000,
  live = true,
  compact = false,
  label = 'Cumulative gas saved',
  unit = 'gas units',
}: GasSavingsCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const counted = useCountUp(target, durationMs, inView);
  const [drift, setDrift] = useState(0);

  // Subtle live drift so the figure feels like a running meter, not a static number.
  useEffect(() => {
    if (!live || !inView) return;
    const id = setInterval(() => setDrift((d) => d + Math.floor(Math.random() * 1400) + 200), 2600);
    return () => clearInterval(id);
  }, [live, inView]);

  const display = Math.round(counted + (counted >= target * 0.99 ? drift : 0));

  if (compact) {
    return (
      <div ref={ref} className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center shrink-0">
          <Flame className="w-4 h-4 text-[#10B981]" />
        </div>
        <div>
          <div className="text-[9px] text-gray-500 uppercase tracking-widest">{label}</div>
          <div className="text-lg font-bold text-[#10B981] font-mono tabular-nums">{display.toLocaleString()}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="relative bg-[#101014]/50 backdrop-blur-md border border-[#10B981]/20 rounded-2xl p-8 overflow-hidden text-center shadow-2xl"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0%,transparent_70%)] pointer-events-none" />
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-[#10B981]/30 mb-6 text-[10px] font-bold text-[#10B981] uppercase tracking-widest">
          <Activity className="w-3 h-3 animate-pulse" /> Live across protected protocols
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Flame className="w-7 h-7 text-[#10B981]" />
          <motion.span
            key={display}
            className="text-4xl md:text-6xl font-bold text-white font-mono tabular-nums tracking-tight"
          >
            {display.toLocaleString()}
          </motion.span>
        </div>
        <div className="text-sm text-gray-400 font-sans mb-1">{unit}</div>
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#10B981] font-bold">
          <TrendingUp className="w-3.5 h-3.5" /> {label}
        </div>
      </div>
    </div>
  );
}
