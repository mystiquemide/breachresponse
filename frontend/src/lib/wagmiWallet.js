import { getWalletConnectionNotice } from './wallet.js';

const PREFERRED_INJECTED_IDS = [
  'injected',
  'io.rabby',
  'rabby',
  'com.okex.wallet',
  'okx',
  'io.metamask',
  'metaMask',
  'metamask',
  'com.metamask',
];

export const WALLET_CONNECTOR_NOT_READY_NOTICE = 'Wallet connector is not ready yet. Reload the page and try again.';
export const WALLET_CONNECTION_FAILED_NOTICE = 'Wallet connection failed. Unlock your Ethereum wallet and try again.';
export const WALLET_ALREADY_CONNECTED_NOTICE = 'Wallet already connected. Continue in Command Center.';
export const WALLET_REQUEST_PENDING_NOTICE = 'Wallet request is still pending. Open your Ethereum wallet, approve the request, then tap Connect Wallet again.';

const DEFAULT_WALLET_REQUEST_TIMEOUT_MS = 12_000;

function getMissingInjectedWalletNotice() {
  return getWalletConnectionNotice({ isSecureContext: true, hasInjectedWallet: false });
}

function isProviderNotFoundError(error) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /provider not found|no provider|injected provider|wallet not found/i.test(message);
}

function isConnectorAlreadyConnectedError(error) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /connector already connected/i.test(message);
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

function withTimeout(promise, timeoutMs) {
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve({ status: 'timed-out' }), timeoutMs);
  });

  return Promise.race([
    Promise.resolve(promise).then(
      (value) => ({ status: 'resolved', value }),
      (error) => ({ status: 'rejected', error }),
    ),
    timeout,
  ]).finally(() => clearTimeout(timer));
}

async function reconnectWalletState({ reconnectAsync, connector, timeoutMs }) {
  if (typeof reconnectAsync !== 'function') return false;

  const reconnectResult = await withTimeout(
    Promise.resolve().then(() => reconnectAsync({ connectors: [connector] })),
    timeoutMs,
  );

  return reconnectResult.status === 'resolved' && Array.isArray(reconnectResult.value) && reconnectResult.value.length > 0;
}

async function connectWithTimeout(connectFn, connector, timeoutMs) {
  const result = connectFn({ connector });
  if (result && typeof result.then === 'function') {
    const wagmiConnect = await withTimeout(result, timeoutMs);
    if (wagmiConnect.status === 'timed-out') return 'timed-out';
    if (wagmiConnect.status === 'rejected') throw wagmiConnect.error;
    return 'connected';
  }
  return 'connecting';
}

async function clearStaleConnectorConnection(connector, timeoutMs) {
  if (typeof connector?.disconnect !== 'function') return false;

  const disconnectResult = await withTimeout(
    Promise.resolve().then(() => connector.disconnect()),
    timeoutMs,
  );

  return disconnectResult.status === 'resolved';
}

export async function connectWalletWithWagmi({ windowObject, connectors, connect, connectAsync, reconnectAsync, setWalletNotice, timeoutMs = DEFAULT_WALLET_REQUEST_TIMEOUT_MS }) {
  if (!windowObject?.isSecureContext) {
    const notice = getWalletConnectionNotice({ isSecureContext: false, hasInjectedWallet: true });
    setWalletNotice(notice);
    return 'blocked-by-environment';
  }

  if (!hasInjectedWalletProvider(windowObject)) {
    setWalletNotice(getMissingInjectedWalletNotice());
    return 'missing-provider';
  }

  const connector = getPreferredWalletConnector(connectors);
  if (!connector) {
    setWalletNotice(WALLET_CONNECTOR_NOT_READY_NOTICE);
    return 'missing-connector';
  }

  try {
    setWalletNotice('');

    const connectFn = connectAsync ?? connect;
    const connectResult = await connectWithTimeout(connectFn, connector, timeoutMs);
    if (connectResult === 'timed-out') {
      setWalletNotice(WALLET_REQUEST_PENDING_NOTICE);
      return 'timed-out';
    }
    return connectResult;
  } catch (error) {
    if (isProviderNotFoundError(error)) {
      setWalletNotice(getMissingInjectedWalletNotice());
      return 'missing-provider';
    }

    if (isConnectorAlreadyConnectedError(error)) {
      if (await reconnectWalletState({ reconnectAsync, connector, timeoutMs })) {
        setWalletNotice('');
        return 'connected';
      }

      const connectFn = connectAsync ?? connect;
      if (await clearStaleConnectorConnection(connector, timeoutMs)) {
        const retryConnect = await connectWithTimeout(connectFn, connector, timeoutMs);
        if (retryConnect === 'timed-out') {
          setWalletNotice(WALLET_REQUEST_PENDING_NOTICE);
          return 'timed-out';
        }
        if (retryConnect === 'connected' || retryConnect === 'connecting') {
          setWalletNotice('');
          return retryConnect;
        }
      }

      setWalletNotice(WALLET_ALREADY_CONNECTED_NOTICE);
      return 'already-connected';
    }

    if (await reconnectWalletState({ reconnectAsync, connector, timeoutMs })) {
      setWalletNotice('');
      return 'connected';
    }

    setWalletNotice(WALLET_CONNECTION_FAILED_NOTICE);
    return 'failed';
  }
}
