import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { GENLAYER_CONSENSUS_GUARD_ADDRESS, type GenLayerAccount } from '../../../lib/genlayerConsensus';

interface GenLayerGuardCardProps {
  genLayerAccount: GenLayerAccount | null;
  consensusIncidentCount: number;
  isConsensusBusy: boolean;
  selectedAction: string | null;
  setSelectedAction: (a: string) => void;
  setActionQueued: (v: boolean) => void;
  actionQueued: boolean;
  consensusStatus: string;
  connectGenLayerFallback: () => void;
  escalateDemoIncident: () => void;
}

const VALIDATORS = [
  { addr: '0x7f2a...3e1c', weight: '20%' },
  { addr: '0x4b8d...9f2a', weight: '20%' },
  { addr: '0x1e5c...7a4b', weight: '20%' },
  { addr: '0x9d3f...2c8e', weight: '20%' },
  { addr: '0x3a6e...5d1f', weight: '20%' },
];

const RESPONSE_ACTIONS = ['Pause', 'Quarantine', 'Monitor', 'Alert', 'Multisig'];

export default function GenLayerGuardCard({
  genLayerAccount,
  consensusIncidentCount,
  isConsensusBusy,
  selectedAction,
  setSelectedAction,
  setActionQueued,
  actionQueued,
  consensusStatus,
  connectGenLayerFallback,
  escalateDemoIncident,
}: GenLayerGuardCardProps) {
  return (
    <div id="ob-genlayer" className="sci-fi-panel p-6 relative overflow-hidden transition-all duration-500 border border-[#10B981]/20">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-bold mb-2 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#10B981]" />
            GenLayer Consensus Guard
          </h2>
          <p className="text-gray-400 text-xs leading-relaxed font-sans">
            Escalates low-confidence Mantle incidents to a GenLayer intelligent contract for validator consensus. Operators keep their wallet on Mantle.
          </p>
        </div>
        <span className="text-[9px] uppercase tracking-widest text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 rounded px-2 py-1">
          {GENLAYER_CONSENSUS_GUARD_ADDRESS ? 'StudioNet linked' : 'Consensus ready'}
        </span>
      </div>

      <div className="space-y-3 text-[10px] text-gray-400 mb-4">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 border-b border-gray-800/60 pb-2">
          <span>StudioNet Guard</span>
          <span className="min-w-0 text-right text-gray-300 break-words">
            {GENLAYER_CONSENSUS_GUARD_ADDRESS || 'Env address required'}
          </span>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 border-b border-gray-800/60 pb-2">
          <span>App-managed signer</span>
          <span className="min-w-0 text-right text-gray-300">
            {genLayerAccount ? `${genLayerAccount.address.slice(0, 6)}...${genLayerAccount.address.slice(-4)}` : 'Not generated'}
          </span>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3">
          <span>Consensus records</span>
          <span className="min-w-0 text-right text-gray-300">{consensusIncidentCount}</span>
        </div>
      </div>

      {/* Consensus Validators */}
      <div className="mb-4 pt-3 border-t border-gray-800/60">
        <h3 className="text-[9px] uppercase tracking-widest text-gray-500 mb-2">Consensus Validators</h3>
        <div className="space-y-1.5">
          {VALIDATORS.map((v, i) => {
            const voted = !isConsensusBusy && consensusIncidentCount > 0;
            const validating = isConsensusBusy && i < 3;
            const dotColor = voted ? 'bg-[#10B981]' : validating ? 'bg-yellow-400 animate-pulse' : 'bg-gray-700';
            const label = voted ? 'Approved' : validating ? 'Validating...' : 'Idle';
            const labelColor = voted ? 'text-[#10B981]' : validating ? 'text-yellow-400' : 'text-gray-600';
            return (
              <div key={v.addr} className="flex items-center justify-between bg-black/30 border border-gray-800/50 rounded px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                  <span className="text-[9px] font-mono text-gray-400">{v.addr}</span>
                </div>
                <div className="flex items-center gap-3 text-[9px]">
                  <span className="text-gray-600">{v.weight}</span>
                  <span className={`font-bold uppercase tracking-widest ${labelColor}`}>{label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Allowlisted Response Actions */}
      <div className="mb-4">
        <h3 className="text-[9px] uppercase tracking-widest text-gray-500 mb-2">Allowlisted Response Actions</h3>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {RESPONSE_ACTIONS.map((action) => {
            const active = selectedAction === action;
            return (
              <button
                key={action}
                type="button"
                onClick={() => {
                  setSelectedAction(action);
                  setActionQueued(false);
                  setTimeout(() => setActionQueued(true), 600);
                }}
                className={`text-[9px] font-bold uppercase tracking-widest rounded px-2 py-1 border transition-all ${
                  active
                    ? 'bg-[#10B981] border-[#10B981] text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                    : 'bg-[#10B981]/10 border-[#10B981]/20 text-[#10B981] hover:bg-[#10B981]/20 hover:border-[#10B981]/40'
                }`}
              >
                {action}
              </button>
            );
          })}
        </div>
        {selectedAction && actionQueued && (
          <p className="text-[9px] text-[#10B981] font-mono">
            Action queued: <span className="font-bold">{selectedAction}</span> — pending GenLayer consensus approval
          </p>
        )}
      </div>

      <p className="min-h-8 text-[10px] text-gray-500 font-sans mb-4">{consensusStatus}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={connectGenLayerFallback}
          className="bg-[#18181B] border border-gray-800 text-white font-bold py-3 rounded text-[10px] hover:border-[#10B981]/50 transition-colors uppercase tracking-widest"
        >
          Prepare guard signer
        </button>
        <button
          onClick={escalateDemoIncident}
          disabled={isConsensusBusy || !genLayerAccount}
          className={`bg-[#10B981] text-black font-bold py-3 rounded text-[10px] transition-all uppercase tracking-widest ${isConsensusBusy || !genLayerAccount ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]'}`}
        >
          {isConsensusBusy ? 'Consensus running...' : 'Validate incident'}
        </button>
      </div>
    </div>
  );
}
