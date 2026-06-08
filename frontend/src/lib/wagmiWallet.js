import { getBrowserWalletConnectionNotice } from './wallet.js';

const PREFERRED_INJECTED_IDS = [
  'io.metamask',
  'metaMask',
  'metamask',
  'com.metamask',
  'injected',
];

export const WALLET_CONNECTOR_NOT_READY_NOTICE = 'Wallet connector is not ready yet. Reload the page and try again.';
export const WALLET_CONNECTION_FAILED_NOTICE = 'Wallet connection failed. Unlock MetaMask and try again.';

export function getPreferredWalletConnector(connectors = []) {
  if (!Array.isArray(connectors) || connectors.length === 0) return undefined;

  const byPreferredId = PREFERRED_INJECTED_IDS
    .map((id) => connectors.find((connector) => connector?.id === id))
    .find(Boolean);

  if (byPreferredId) return byPreferredId;

  return connectors.find((connector) => {
    const id = String(connector?.id ?? '').toLowerCase();
    const name = String(connector?.name ?? '').toLowerCase();
    const type = String(connector?.type ?? '').toLowerCase();
    return id.includes('injected') || name.includes('metamask') || type.includes('injected');
  }) ?? connectors[0];
}

export async function connectWalletWithWagmi({ windowObject, connectors, connect, setWalletNotice }) {
  const notice = getBrowserWalletConnectionNotice(windowObject);
  setWalletNotice(notice);
  if (notice) return 'blocked-by-environment';

  const connector = getPreferredWalletConnector(connectors);
  if (!connector) {
    setWalletNotice(WALLET_CONNECTOR_NOT_READY_NOTICE);
    return 'missing-connector';
  }

  try {
    const result = connect({ connector });
    if (result && typeof result.then === 'function') {
      await result;
    }
    setWalletNotice('');
    return 'connecting';
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error ?? '');
    setWalletNotice(message || WALLET_CONNECTION_FAILED_NOTICE);
    return 'failed';
  }
}
