'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Power } from 'lucide-react';

type WalletConnectControlProps = {
  disconnectedLabel?: string;
  connectedLabel?: string;
  className?: string;
  connectedClassName?: string;
  onBeforeConnect?: () => void;
  onConnectedClick?: () => void;
};

const defaultDisconnectedClass = 'flex items-center gap-2 bg-[#10B981] text-black font-bold py-2 px-5 rounded hover:bg-green-400 transition-all text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)]';
const defaultConnectedClass = 'flex items-center gap-2 bg-[#18181B] border border-[#10B981]/30 px-4 py-2 rounded hover:bg-gray-800 transition-colors text-xs text-gray-300';

export function WalletConnectControl({
  disconnectedLabel = 'Connect Wallet',
  connectedLabel,
  className = defaultDisconnectedClass,
  connectedClassName = defaultConnectedClass,
  onBeforeConnect,
  onConnectedClick,
}: WalletConnectControlProps) {
  return (
    <ConnectButton.Custom>
      {({ account, chain, mounted, authenticationStatus, openAccountModal, openChainModal, openConnectModal }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected = ready && account && chain && (!authenticationStatus || authenticationStatus === 'authenticated');

        if (!ready) {
          return (
            <button type="button" disabled className={`${className} opacity-70 cursor-wait`}>
              <Power className="w-3.5 h-3.5" />
              Restoring wallet...
            </button>
          );
        }

        if (!connected) {
          return (
            <button
              type="button"
              onClick={() => {
                onBeforeConnect?.();
                openConnectModal?.();
              }}
              className={className}
            >
              <Power className="w-3.5 h-3.5" />
              {disconnectedLabel}
            </button>
          );
        }

        if (chain.unsupported) {
          return (
            <button
              type="button"
              onClick={() => {
                onBeforeConnect?.();
                openChainModal?.();
              }}
              className={className}
            >
              <Power className="w-3.5 h-3.5" />
              Switch Network
            </button>
          );
        }

        return (
          <button
            type="button"
            onClick={onConnectedClick ?? openAccountModal}
            className={connectedClassName}
          >
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-gray-500 uppercase tracking-widest">Connected:</span>
            <span className="font-bold text-white">{connectedLabel ?? account.displayName}</span>
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}
