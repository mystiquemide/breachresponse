import React from 'react';

export default function BootSequence() {
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
}
