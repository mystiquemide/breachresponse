import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { WalletStatusGate } from '../../../components/WalletConnectControl';

interface RegisterSentinelCardProps {
  sentinelName: string;
  setSentinelName: (v: string) => void;
  protocolAddress: string;
  setProtocolAddress: (v: string) => void;
  handleRegister: () => void;
  isPending: boolean;
  isConfirming: boolean;
  isConfirmed: boolean;
  receiptSuccess: boolean;
  writeErrorMsg: string | null;
}

export default function RegisterSentinelCard({
  sentinelName,
  setSentinelName,
  protocolAddress,
  setProtocolAddress,
  handleRegister,
  isPending,
  isConfirming,
  isConfirmed,
  receiptSuccess,
  writeErrorMsg,
}: RegisterSentinelCardProps) {
  return (
    <div id="ob-sentinel" className="sci-fi-panel p-6 relative overflow-hidden transition-all duration-500">
      <h2 className="text-base font-bold mb-4 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#10B981]" />
        Register Sentinel Guard
      </h2>
      <p className="text-gray-400 text-xs mb-4 leading-relaxed font-sans">
        Register a Mantle Sepolia contract for sentinel monitoring and operator-reviewed response proposals.
      </p>
      <input
        type="text"
        value={sentinelName}
        onChange={(e) => setSentinelName(e.target.value)}
        placeholder="Sentinel name (e.g. MNT Vault Guard)"
        className="w-full bg-[#09090B] border border-gray-700 rounded p-3 text-xs text-white outline-none focus:border-[#10B981] mb-3 transition-colors font-sans"
      />
      <input
        type="text"
        value={protocolAddress}
        onChange={(e) => setProtocolAddress(e.target.value)}
        placeholder="0x... (Contract Address)"
        className="w-full bg-[#09090B] border border-gray-700 rounded p-3 text-xs text-white outline-none focus:border-[#10B981] mb-4 transition-colors font-mono"
      />
      <WalletStatusGate>
        {({ ready, connected, wrongNetwork }) => {
          const canRegister = ready && connected && !wrongNetwork && !isPending && !isConfirming;

          return (
            <>
              <button
                onClick={handleRegister}
                disabled={!canRegister}
                className={`w-full bg-[#10B981] text-black font-bold py-3 rounded text-xs transition-all ${!canRegister ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]'}`}
              >
                {isPending ? 'Waiting for wallet...' : isConfirming ? 'Confirming on-chain...' : 'Register sentinel guard'}
              </button>
              {isConfirmed && receiptSuccess && !writeErrorMsg && <p className="text-[#10B981] mt-3 text-[10px] text-center">Sentinel confirmed and registered on Mantle Sepolia</p>}
              {writeErrorMsg && <p className="text-red-500 mt-3 text-[10px] text-center font-sans">{writeErrorMsg}</p>}
              {!ready && <p className="text-gray-500 mt-3 text-[10px] text-center font-sans">Restoring wallet session...</p>}
              {ready && !connected && <p className="text-red-500 mt-3 text-[10px] text-center font-sans">Connect a Mantle wallet to initialize guards</p>}
              {ready && connected && wrongNetwork && <p className="text-yellow-400 mt-3 text-[10px] text-center font-sans">Switch to Mantle Sepolia to initialize guards</p>}
            </>
          );
        }}
      </WalletStatusGate>
    </div>
  );
}
