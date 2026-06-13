'use client'

import React, { useState } from 'react';
import { Search, ShieldAlert, Zap, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { getAddress } from 'viem';

interface Vulnerability {
  name: string;
  severity: string;
  description: string;
}

interface AuditResult {
  riskScore: number;
  riskLabel: string;
  vulnerabilities: Vulnerability[];
  gasFlags: string[];
  recommendations: string;
  summary: string;
  sourceAvailable: boolean;
  metadata: {
    bytecodeSize: number;
    dangerousOpcodes: { name: string; severity: string }[];
    selectorsFound: number;
  };
}

const severityColor = (s: string) => {
  switch (s.toUpperCase()) {
    case 'CRITICAL': return 'text-red-400 border-red-500/40 bg-red-500/10';
    case 'HIGH': return 'text-orange-400 border-orange-500/40 bg-orange-500/10';
    case 'MEDIUM': return 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10';
    default: return 'text-[#10B981] border-[#10B981]/40 bg-[#10B981]/10';
  }
};

const riskScoreColor = (score: number) => {
  if (score >= 75) return 'text-red-400';
  if (score >= 50) return 'text-orange-400';
  if (score >= 25) return 'text-yellow-400';
  return 'text-[#10B981]';
};

export default function AuditScanner() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sanitizeAddress = (raw: string): string | null => {
    const match = raw.trim().match(/0x[0-9a-fA-F]{40}/);
    if (!match) return null;
    try {
      return getAddress(match[0]);
    } catch {
      return null;
    }
  };

  const handleScan = async () => {
    const clean = sanitizeAddress(address);
    if (!clean) {
      setError('Invalid address. Enter a valid 0x contract address.');
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: clean }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Audit failed. Try again.');
        return;
      }
      setResult(data);
    } catch {
      setError('Network error. Check connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleScan();
  };

  return (
    <div className="sci-fi-panel p-6 relative overflow-hidden transition-all duration-500">
      <h2 className="text-base font-bold mb-2 flex items-center gap-2">
        <Search className="w-4 h-4 text-[#10B981]" />
        Contract Audit Scanner
      </h2>
      <p className="text-gray-400 text-xs mb-4 leading-relaxed font-sans">
        Scan any Mantle Sepolia contract for security vulnerabilities and gas inefficiencies. No wallet required.
      </p>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={address}
          onChange={e => setAddress(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="0x... (Contract Address)"
          className="flex-1 bg-[#09090B] border border-gray-700 rounded p-3 text-xs text-white outline-none focus:border-[#10B981] transition-colors font-mono"
        />
        <button
          onClick={handleScan}
          disabled={loading}
          className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-all ${
            loading
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-[#10B981] text-black hover:bg-green-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]'
          }`}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Scan'}
        </button>
      </div>

      {error && (
        <p className="text-red-400 text-[10px] mb-3 font-sans">{error}</p>
      )}

      {loading && (
        <div className="space-y-2 mt-3">
          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            Fetching bytecode from Mantle Sepolia RPC...
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            Running AI security analysis via Groq...
          </div>
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-4">
          {/* Risk Score Header */}
          <div className="flex items-center justify-between bg-black/40 border border-gray-800 rounded-lg px-4 py-3">
            <div>
              <span className="text-[9px] uppercase tracking-widest text-gray-500 block mb-1">Risk Score</span>
              <span className={`text-2xl font-black font-mono ${riskScoreColor(result.riskScore)}`}>
                {result.riskScore}
                <span className="text-xs text-gray-500 font-normal ml-1">/100</span>
              </span>
            </div>
            <div className="text-right">
              <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded border ${severityColor(result.riskLabel)}`}>
                {result.riskLabel}
              </span>
              <div className="text-[9px] text-gray-500 mt-1 font-mono">
                {result.metadata.bytecodeSize} bytes · {result.metadata.selectorsFound} selectors
              </div>
              <div className="mt-1">
                <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${result.sourceAvailable ? 'text-[#10B981] border-[#10B981]/30 bg-[#10B981]/10' : 'text-gray-500 border-gray-700 bg-gray-800/50'}`}>
                  {result.sourceAvailable ? 'Source verified' : 'Bytecode only'}
                </span>
              </div>
            </div>
          </div>

          {/* Dangerous Opcodes */}
          {result.metadata.dangerousOpcodes.length > 0 && (
            <div className="bg-red-950/20 border border-red-500/20 rounded-lg px-3 py-2">
              <span className="text-[9px] uppercase tracking-widest text-red-400 block mb-1.5">Dangerous Opcodes Detected</span>
              <div className="flex flex-wrap gap-1.5">
                {result.metadata.dangerousOpcodes.map(op => (
                  <span key={op.name} className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${severityColor(op.severity)}`}>
                    {op.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Vulnerabilities */}
          {result.vulnerabilities.length > 0 && (
            <div>
              <span className="text-[9px] uppercase tracking-widest text-gray-500 block mb-2">Vulnerabilities</span>
              <div className="space-y-1.5">
                {result.vulnerabilities.map((v, i) => (
                  <div key={i} className="bg-black/30 border border-gray-800/60 rounded px-3 py-2">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-bold text-white">{v.name}</span>
                      <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${severityColor(v.severity)}`}>
                        {v.severity}
                      </span>
                    </div>
                    <p className="text-[9px] text-gray-400 font-sans leading-relaxed">{v.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gas Flags */}
          {result.gasFlags.length > 0 && (
            <div>
              <span className="text-[9px] uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-yellow-400" />
                Gas Optimization Flags
              </span>
              <div className="space-y-1">
                {result.gasFlags.map((flag, i) => (
                  <div key={i} className="flex items-start gap-2 text-[9px] text-yellow-400 font-mono bg-yellow-400/5 border border-yellow-400/10 rounded px-2 py-1.5">
                    <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                    {flag}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-[#18181B]/60 border border-gray-800 rounded-lg px-3 py-3">
            <span className="text-[9px] uppercase tracking-widest text-gray-500 block mb-1.5 flex items-center gap-1.5">
              <ShieldAlert className="w-3 h-3" />
              AI Audit Summary
            </span>
            <p className="text-[10px] text-gray-300 font-sans leading-relaxed">{result.summary}</p>
          </div>

          {/* Recommendations */}
          <div className="bg-[#10B981]/5 border border-[#10B981]/20 rounded-lg px-3 py-3">
            <span className="text-[9px] uppercase tracking-widest text-[#10B981] block mb-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" />
              Recommendations
            </span>
            <p className="text-[10px] text-gray-300 font-sans leading-relaxed">{result.recommendations}</p>
          </div>
        </div>
      )}
    </div>
  );
}
