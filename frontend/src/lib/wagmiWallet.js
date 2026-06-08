import { getWalletConnectionNotice } from './wallet.js';

const PREFERRED_INJECTED_IDS = [
  'io.metamask',
  'metaMask',
  'metamask',
  'com.metamask',
  'injected',
];

export const WALLET_CONNECTOR_NOT_READY_NOTICE = 'Wallet connector is not ready yet. Reload the page and try again.';
export const WALLET_CONNECTION_FAILED_NOTICE = 'Wallet connection failed. Unlock MetaMask and try again.';
export const WALLET_OPENING_METAMASK_NOTICE = 'No injected wallet found. Opening this dapp in MetaMask wallet browser.';

export function getMetaMaskDappLink(windowObject) {
  if (!windowObject?.location) return '';

  const url = new URL(windowObject.location.href);
  return `https://metamask.app.link/dapp/${url.host}${url.pathname}${url.search}${url.hash}`;
}

function isProviderNotFoundError(error) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /provider not found|no provider|injected provider|wallet not found/i.test(message);
}

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

function hasInjectedWalletProvider(windowObject) {
  return Boolean(windowObject?.ethereum);
}

function openMetaMaskDappBrowser(windowObject, setWalletNotice) {
  const metaMaskLink = getMetaMaskDappLink(windowObject);
  if (!metaMaskLink || !windowObject?.location?.assign) return false;

  setWalletNotice(WALLET_OPENING_METAMASK_NOTICE);
  windowObject.location.assign(metaMaskLink);
  return true;
}

export async function connectWalletWithWagmi({ windowObject, connectors, connect, connectAsync, setWalletNotice }) {
  if (!windowObject?.isSecureContext) {
    const notice = getWalletConnectionNotice({ isSecureContext: false, hasInjectedWallet: true });
    setWalletNotice(notice);
    return 'blocked-by-environment';
  }

  if (!hasInjectedWalletProvider(windowObject) && openMetaMaskDappBrowser(windowObject, setWalletNotice)) {
    return 'opening-metamask';
  }

  const connector = getPreferredWalletConnector(connectors);
  if (!connector) {
    setWalletNotice(WALLET_CONNECTOR_NOT_READY_NOTICE);
    return 'missing-connector';
  }

  try {
    setWalletNotice('');
    const connectFn = connectAsync ?? connect;
    const result = connectFn({ connector });
    if (result && typeof result.then === 'function') {
      await result;
    }
    return 'connecting';
  } catch (error) {
    if (isProviderNotFoundError(error)) {
      const metaMaskLink = getMetaMaskDappLink(windowObject);
      if (metaMaskLink && windowObject?.location?.assign) {
        setWalletNotice(WALLET_OPENING_METAMASK_NOTICE);
        windowObject.location.assign(metaMaskLink);
        return 'opening-metamask';
      }
    }

    const message = error instanceof Error ? error.message : String(error ?? '');
    setWalletNotice(message || WALLET_CONNECTION_FAILED_NOTICE);
    return 'failed';
  }
}
