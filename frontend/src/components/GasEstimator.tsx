'use client'

import React, { useState } from 'react';
import { Zap, Loader2, TrendingDown, AlertTriangle } from 'lucide-react';
import { getAddress } from 'viem';

interface GasResult {
  estimatedGas: number;
  gasPriceGwei: number;
  estimatedCostMNT: string;
  estimatedCostUSD: string;
  optimizations: string[];
  summary: string;
  gasPriceGwei_only?: number;
  error?: string;
}

export default function GasEstimator() {
  const [address, setAddress] = useState('');
  const [calldata, setCalldata] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GasResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sanitizeAddress = (raw: string): string | null => {
    const match = raw.trim().match(/0x[0-9a-fA-F]{40}/);
    if (!match) return null;
    try { return getAddress(match[0]); } catch { return null; }
  };

  const handleEstimate = async () => {
    const cleanAddr = sanitizeAddress(address);
    if (!cleanAddr) { setError('Invalid contract address.'); return; }
    const cleanCalldata = calldata.trim();
    if (!cleanCalldata || !/^0x[0-9a-fA-F]*$/.test(cleanCalldata)) {
      setError('Invalid calldata. Must start with 0x (e.g. 0x8456cb59 to call pause()).');
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch('/api/gas-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: cleanAddr, calldata: cleanCalldata }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? 'Estimation failed.');
        if (data.gasPriceGwei) setResult({ ...data, estimatedGas: 0, estimatedCostMNT: '0', estimatedCostUSD: '0', optimizations: [], summary: '' });
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
    if (e.key === 'Enter' && e.ctrlKey) handleEstimate();
  };

  return (
    <div className="sci-fi-panel p-6 relative overflow-hidden transition-all duration-500">
      <h2 className="text-base font-bold mb-2 flex items-center gap-2">
        <Zap className="w-4 h-4 text-yellow-400" />
        Gas Estimator
      </h2>
      <p className="text-gray-400 text-xs mb-4 leading-relaxed font-sans">
        Estimate gas cost for any Mantle Sepolia contract call and get AI-powered optimization suggestions. Ctrl+Enter to run.
      </p>

      <div className="space-y-2 mb-3">
        <input
          type="text"
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Contract address (0x...)"
          className="w-full bg-[#09090B] border border-gray-700 rounded p-3 text-xs text-white outline-none focus:border-yellow-400/60 transition-colors font-mono"
        />
        <input
          type="text"
          value={calldata}
          onChange={e => setCalldata(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Calldata (0x8456cb59 for pause(), 0x for fallback)"
          className="w-full bg-[#09090B] border border-gray-700 rounded p-3 text-xs text-white outline-none focus:border-yellow-400/60 transition-colors font-mono"
        />
      </div>

      <button
        onClick={handleEstimate}
        disabled={loading}
        className={`w-full py-2.5 rounded text-xs font-bold uppercase tracking-widest transition-all mb-3 ${
          loading
            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
            : 'bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/20 hover:border-yellow-400/60'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Estimating on Mantle Sepolia...
          </span>
        ) : 'Estimate Gas'}
      </button>

      {error && (
        <div className="flex items-start gap-2 text-[10px] text-red-400 bg-red-500/5 border border-red-500/20 rounded px-3 py-2 mb-3 font-sans">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {result && result.estimatedGas > 0 && (
        <div className="space-y-3">
          {/* Gas Metrics */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-black/40 border border-gray-800 rounded-lg px-3 py-2.5">
              <span className="text-[8px] uppercase tracking-widest text-gray-500 block mb-1">Gas Units</span>
              <span className="text-white font-mono font-bold text-sm">{result.estimatedGas.toLocaleString()}</span>
            </div>
            <div className="bg-black/40 border border-gray-800 rounded-lg px-3 py-2.5">
              <span className="text-[8px] uppercase tracking-widest text-gray-500 block mb-1">Gas Price</span>
              <span className="text-white font-mono font-bold text-sm">{result.gasPriceGwei} <span className="text-[9px] text-gray-500">Gwei</span></span>
            </div>
            <div className="bg-black/40 border border-gray-800 rounded-lg px-3 py-2.5">
              <span className="text-[8px] uppercase tracking-widest text-gray-500 block mb-1">Cost (MNT)</span>
              <span className="text-yellow-400 font-mono font-bold text-sm">{parseFloat(result.estimatedCostMNT).toFixed(8)}</span>
            </div>
            <div className="bg-black/40 border border-gray-800 rounded-lg px-3 py-2.5">
              <span className="text-[8px] uppercase tracking-widest text-gray-500 block mb-1">Cost (USD ~)</span>
              <span className="text-[#10B981] font-mono font-bold text-sm">${parseFloat(result.estimatedCostUSD).toFixed(8)}</span>
            </div>
          </div>

          {/* Network tag */}
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">Live from Mantle Sepolia RPC · eth_estimateGas + eth_gasPrice</span>
          </div>

          {/* Summary */}
          {result.summary && (
            <p className="text-[10px] text-gray-400 font-sans leading-relaxed bg-black/30 border border-gray-800/60 rounded px-3 py-2">
              {result.summary}
            </p>
          )}

          {/* Optimizations */}
          {result.optimizations.length > 0 && (
            <div>
              <span className="text-[9px] uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-1.5">
                <TrendingDown className="w-3 h-3 text-yellow-400" />
                AI Gas Optimization Suggestions
              </span>
              <div className="space-y-1.5">
                {result.optimizations.map((opt, i) => (
                  <div key={i} className="flex items-start gap-2 bg-yellow-400/5 border border-yellow-400/10 rounded px-3 py-2">
                    <span className="text-yellow-400 font-mono text-[9px] font-bold shrink-0 mt-0.5">{i + 1}.</span>
                    <p className="text-[10px] text-gray-300 font-sans leading-relaxed">{opt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
