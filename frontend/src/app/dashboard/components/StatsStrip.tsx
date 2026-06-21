import React from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldCheck, ShieldAlert } from 'lucide-react';
import Counter from '../Counter';
import { summarizeValueMetrics } from '../../../lib/valueMonitored';
import type { ValueMetrics } from '../types';

interface StatsStripProps {
  blocksScanned: number;
  activeSentinels: number;
  liveWorkerChecks: number;
  valueMetrics: ValueMetrics | null;
  valueMetricsError: boolean;
  responseProposals: number;
  cumulativeGasSaved: number;
}

export default function StatsStrip({
  blocksScanned,
  activeSentinels,
  liveWorkerChecks,
  valueMetrics,
  valueMetricsError,
  responseProposals,
  cumulativeGasSaved,
}: StatsStripProps) {
  return (
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
          <Counter value={activeSentinels} />
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
          {valueMetrics ? `$${valueMetrics.totalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : valueMetricsError ? 'N/A' : '...'}
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
          <Counter value={responseProposals} />
        </div>
        {cumulativeGasSaved > 0 && (
          <p className="mt-1.5 text-[9px] text-[#10B981] font-mono">
            💰 {cumulativeGasSaved.toLocaleString()} gas saved via response proposals
          </p>
        )}
      </div>
    </motion.section>
  );
}
