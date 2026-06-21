import React from 'react';
import { motion } from 'framer-motion';

interface SentinelConsoleProps {
  isSSEConnected: boolean;
  simulatedActive: boolean;
  cumulativeGasSaved: number;
  simThreatCount: number;
  simSafeCount: number;
  blocksScanned: number;
  terminalLines: string[];
  terminalContainerRef: React.RefObject<HTMLDivElement | null>;
  terminalEndRef: React.RefObject<HTMLDivElement | null>;
  handleTerminalScroll: () => void;
  commandInput: string;
  setCommandInput: (v: string) => void;
  handleCommandSubmit: (e: React.FormEvent) => void;
}

export default function SentinelConsole({
  isSSEConnected,
  simulatedActive,
  cumulativeGasSaved,
  simThreatCount,
  simSafeCount,
  blocksScanned,
  terminalLines,
  terminalContainerRef,
  terminalEndRef,
  handleTerminalScroll,
  commandInput,
  setCommandInput,
  handleCommandSubmit,
}: SentinelConsoleProps) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, x: 0 }}
      className="lg:col-span-2 space-y-8"
    >
      <div id="ob-terminal" className="sci-fi-panel flex flex-col relative overflow-hidden h-full min-h-[580px] transition-all duration-500">
        {/* Terminal Top Bar */}
        <div className="bg-[#141416]/80 backdrop-blur-sm border-b border-gray-800/60 px-4 py-3 flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isSSEConnected ? 'bg-[#10B981]/80' : 'bg-yellow-500/80 animate-pulse'}`} />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          </div>
          <div className="flex items-center gap-3">
            {!isSSEConnected && simulatedActive && (
              <span className="text-[9px] text-yellow-400/80 uppercase tracking-widest font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse inline-block" />
                SIMULATION
              </span>
            )}
            {isSSEConnected && (
              <span className="text-[9px] text-[#10B981]/80 uppercase tracking-widest font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] inline-block" />
                LIVE
              </span>
            )}
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">sentinel-console-v1.2.0</span>
          </div>
        </div>

        {/* Simulation Stats Bar — only visible when simulation is active */}
        {!isSSEConnected && simulatedActive && (
          <div className="bg-[#0A0A0E] border-b border-gray-800/60 px-4 py-2 flex items-center gap-6 text-[9px] font-mono z-10">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-600">GAS SAVED:</span>
              <span className="text-[#10B981] font-bold">{cumulativeGasSaved.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-600">THREATS:</span>
              <span className="text-red-400 font-bold">{simThreatCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-600">SAFE:</span>
              <span className="text-gray-300 font-bold">{simSafeCount}</span>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-gray-600">BLOCKS:</span>
              <span className="text-white font-bold">{blocksScanned}</span>
            </div>
          </div>
        )}

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
            if (line.startsWith("[ALERT]")) color = "text-red-400 font-bold";
            if (line.startsWith("[HEARTBEAT]")) color = "text-gray-600 italic";
            if (line.startsWith(">")) color = "text-white font-bold";

            return (
              <div key={index} className={`${color} leading-relaxed break-all`}>
                {line}
              </div>
            );
          })}
          <div ref={terminalEndRef} />
        </div>

        {/* CRT Phosphor Scanline Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] opacity-25 z-20" />

        {/* Terminal Prompt Input Form */}
        <form onSubmit={handleCommandSubmit} className="border-t border-gray-800 bg-[#09090B] px-4 py-3 flex items-center gap-2 z-10" role="search" aria-label="Sentinel command input">
          <span className="text-[#10B981] font-bold text-xs select-none" aria-hidden="true">&gt;</span>
          <input
            type="text"
            id="terminal-command-input"
            name="command"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="Type 'help' for sentinel commands..."
            className="w-full bg-transparent text-white text-xs border-none outline-none font-mono"
            aria-label="Sentinel console command input"
            autoComplete="off"
          />
        </form>
      </div>
    </motion.div>
  );
}
