'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Power } from 'lucide-react';
import { type ReactNode } from 'react';
import { useDisconnect } from 'wagmi';

type WalletConnectControlProps = {
  disconnectedLabel?: string;
  connectedLabel?: string;
  className?: string;
  connectedClassName?: string;
  onBeforeConnect?: () => void;
  onConnectedClick?: () => void;
};

type WalletStatus = {
  ready: boolean;
  connected: boolean;
  wrongNetwork: boolean;
};

type WalletStatusGateProps = {
  children: (status: WalletStatus) => ReactNode;
};

const defaultDisconnectedClass = 'flex items-center gap-2 bg-[#10B981] text-black font-bold py-2 px-5 rounded hover:bg-green-400 transition-all text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)]';
const defaultConnectedClass = 'flex items-center gap-2 bg-[#18181B] border border-[#10B981]/30 px-4 py-2 rounded hover:bg-gray-800 transition-colors text-xs text-gray-300';
const disconnectClass = 'flex items-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-2 rounded hover:bg-red-500/20 transition-colors text-xs font-bold uppercase tracking-widest';

function getWalletStatus({ account, chain, mounted, authenticationStatus }: {
  account?: unknown;
  chain?: { unsupported?: boolean };
  mounted: boolean;
  authenticationStatus?: string;
}): WalletStatus {
  const ready = mounted && authenticationStatus !== 'loading';
  const connected = Boolean(ready && account && chain && (!authenticationStatus || authenticationStatus === 'authenticated'));

  return {
    ready,
    connected,
    wrongNetwork: Boolean(connected && chain?.unsupported),
  };
}

export function WalletStatusGate({ children }: WalletStatusGateProps) {
  return (
    <ConnectButton.Custom>
      {({ account, chain, mounted, authenticationStatus }) => children(getWalletStatus({
        account,
        chain,
        mounted,
        authenticationStatus,
      }))}
    </ConnectButton.Custom>
  );
}

export function WalletConnectControl({
  disconnectedLabel = 'Connect Wallet',
  connectedLabel,
  className = defaultDisconnectedClass,
  connectedClassName = defaultConnectedClass,
  onBeforeConnect,
  onConnectedClick,
}: WalletConnectControlProps) {
  const { disconnect } = useDisconnect();

  return (
    <ConnectButton.Custom>
      {({ account, chain, mounted, authenticationStatus, openAccountModal, openChainModal, openConnectModal }) => {
        const status = getWalletStatus({ account, chain, mounted, authenticationStatus });

        if (!status.ready) {
          return (
            <button type="button" disabled aria-label="Wallet loading, please wait" className={`${className} opacity-70 cursor-wait`}>
              <Power className="w-3.5 h-3.5" />
              Restoring wallet...
            </button>
          );
        }

        if (!status.connected) {
          return (
            <button
              type="button"
              aria-label={disconnectedLabel}
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

        if (status.wrongNetwork) {
          return (
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Switch to Mantle Sepolia network"
                onClick={() => {
                  onBeforeConnect?.();
                  openChainModal?.();
                }}
                className={className}
              >
                <Power className="w-3.5 h-3.5" />
                Switch Network
              </button>
              <button type="button" aria-label="Disconnect wallet" onClick={() => disconnect()} className={disconnectClass}>
                Disconnect
              </button>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={connectedLabel ?? `Connected: ${account?.displayName}`}
              onClick={onConnectedClick ?? openAccountModal}
              className={connectedClassName}
            >
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-gray-500 uppercase tracking-widest">Connected:</span>
              <span className="font-bold text-white">{connectedLabel ?? account?.displayName}</span>
            </button>
            <button type="button" aria-label="Disconnect wallet" onClick={() => disconnect()} className={disconnectClass}>
              Disconnect
            </button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
