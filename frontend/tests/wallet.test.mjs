import assert from 'node:assert/strict';
import { getWalletConnectionNotice } from '../src/lib/wallet.js';

assert.equal(
  getWalletConnectionNotice({ isSecureContext: false, hasInjectedWallet: true }),
  'Wallet connection requires HTTPS or localhost. Use the secure BreachResponse URL.'
);

assert.equal(
  getWalletConnectionNotice({ isSecureContext: true, hasInjectedWallet: false }),
  'No injected Ethereum wallet detected. Open this app in Rabby, MetaMask, OKX, or another Ethereum wallet browser.'
);

const { getPreferredWalletConnector, connectWalletWithWagmi } = await import('../src/lib/wagmiWallet.js');

const genericInjected = { id: 'injected', name: 'Injected' };
const rabby = { id: 'io.rabby', name: 'Rabby Wallet' };
const metaMask = { id: 'io.metamask', name: 'MetaMask' };
const walletConnect = { id: 'walletConnect', name: 'WalletConnect' };

assert.equal(getPreferredWalletConnector([walletConnect, genericInjected, metaMask]), genericInjected);
assert.equal(getPreferredWalletConnector([walletConnect, rabby, metaMask]), rabby);
assert.equal(getPreferredWalletConnector([walletConnect, genericInjected]), genericInjected);
assert.equal(getPreferredWalletConnector([walletConnect]), walletConnect);

{
  let notice = 'unchanged';
  let connectedWith = null;
  const result = await connectWalletWithWagmi({
    windowObject: { isSecureContext: true, ethereum: {} },
    connectors: [walletConnect, genericInjected],
    connect: ({ connector }) => {
      connectedWith = connector;
    },
    setWalletNotice: (value) => {
      notice = value;
    },
  });

  assert.equal(result, 'connecting');
  assert.equal(notice, '');
  assert.equal(connectedWith, genericInjected);
}

{
  let notice = 'unchanged';
  let connectedWith = null;
  const result = await connectWalletWithWagmi({
    windowObject: {
      isSecureContext: true,
      location: {
        href: 'https://breachresponse.43.131.9.176.nip.io/',
      },
    },
    connectors: [metaMask],
    connect: ({ connector }) => {
      connectedWith = connector;
    },
    setWalletNotice: (value) => {
      notice = value;
    },
  });

  assert.equal(result, 'missing-provider');
  assert.equal(notice, 'No injected Ethereum wallet detected. Open this app in Rabby, MetaMask, OKX, or another Ethereum wallet browser.');
  assert.equal(connectedWith, null);
}

{
  let notice = '';
  const result = await connectWalletWithWagmi({
    windowObject: { isSecureContext: true },
    connectors: [],
    connect: () => {
      throw new Error('should not connect without a connector');
    },
    setWalletNotice: (value) => {
      notice = value;
    },
  });

  assert.equal(result, 'missing-provider');
  assert.equal(notice, 'No injected Ethereum wallet detected. Open this app in Rabby, MetaMask, OKX, or another Ethereum wallet browser.');
}

{
  let notice = '';
  const result = await connectWalletWithWagmi({
    windowObject: {
      isSecureContext: true,
      location: {
        href: 'https://breachresponse.43.131.9.176.nip.io/dashboard?tour=1#connect',
      },
    },
    connectors: [genericInjected],
    connectAsync: () => {
      throw new Error('Provider not found. Version: @wagmi/core@3.4.0');
    },
    setWalletNotice: (value) => {
      notice = value;
    },
  });

  assert.equal(result, 'missing-provider');
  assert.equal(notice, 'No injected Ethereum wallet detected. Open this app in Rabby, MetaMask, OKX, or another Ethereum wallet browser.');
}

{
  let notice = '';
  let providerRequestCount = 0;
  const result = await connectWalletWithWagmi({
    windowObject: {
      isSecureContext: true,
      ethereum: {
        request: async () => {
          providerRequestCount += 1;
          return ['0x1234567890123456789012345678901234567890'];
        },
      },
    },
    connectors: [genericInjected],
    connectAsync: async () => ({ accounts: ['0x1234567890123456789012345678901234567890'] }),
    setWalletNotice: (value) => {
      notice = value;
    },
  });

  assert.equal(result, 'connected');
  assert.equal(providerRequestCount, 0, 'the shared helper should let Wagmi own eth_requestAccounts so its connection storage is set');
  assert.equal(notice, '');
}

{
  let notice = '';
  const never = new Promise(() => {});
  const result = await connectWalletWithWagmi({
    windowObject: { isSecureContext: true, ethereum: {} },
    connectors: [genericInjected],
    connectAsync: () => never,
    setWalletNotice: (value) => {
      notice = value;
    },
    timeoutMs: 5,
  });

  assert.equal(result, 'timed-out');
  assert.equal(notice, 'Wallet request is still pending. Open your Ethereum wallet, approve the request, then tap Connect Wallet again.');
}

{
  let notice = 'unchanged';
  let reconnectedWith = null;
  const result = await connectWalletWithWagmi({
    windowObject: {
      isSecureContext: true,
      ethereum: {
        request: async () => ['0x1234567890123456789012345678901234567890'],
      },
    },
    connectors: [genericInjected],
    connectAsync: () => {
      throw new Error('Connector already connected. Version: @wagmi/core@3.4.0');
    },
    reconnectAsync: async ({ connectors }) => {
      reconnectedWith = connectors[0];
      return [{ accounts: ['0x1234567890123456789012345678901234567890'] }];
    },
    setWalletNotice: (value) => {
      notice = value;
    },
  });

  assert.equal(result, 'connected');
  assert.equal(notice, '');
  assert.equal(reconnectedWith, genericInjected);
}

{
  let notice = 'unchanged';
  let disconnectCalled = false;
  let connectAttempts = 0;
  const staleConnector = {
    ...genericInjected,
    disconnect: async () => {
      disconnectCalled = true;
    },
  };
  const result = await connectWalletWithWagmi({
    windowObject: {
      isSecureContext: true,
      ethereum: {
        request: async () => ['0x1234567890123456789012345678901234567890'],
      },
    },
    connectors: [staleConnector],
    connectAsync: async () => {
      connectAttempts += 1;
      if (connectAttempts === 1) {
        throw new Error('Connector already connected. Version: @wagmi/core@3.4.0');
      }
      return { accounts: ['0x1234567890123456789012345678901234567890'] };
    },
    reconnectAsync: async () => [],
    setWalletNotice: (value) => {
      notice = value;
    },
  });

  assert.equal(result, 'connected');
  assert.equal(notice, '');
  assert.equal(disconnectCalled, true, 'stale already-connected connector should be disconnected before retrying');
  assert.equal(connectAttempts, 2, 'normal Wagmi connect should be retried after clearing stale connector state');
}

{
  let notice = 'unchanged';
  let reconnectedWith = null;
  const result = await connectWalletWithWagmi({
    windowObject: {
      isSecureContext: true,
      ethereum: {
        request: async () => ['0x1234567890123456789012345678901234567890'],
      },
    },
    connectors: [genericInjected],
    connectAsync: () => {
      throw new Error('Wagmi route state failed after wallet approval. Version: @wagmi/core@3.5.0');
    },
    reconnectAsync: async ({ connectors }) => {
      reconnectedWith = connectors[0];
      return [{ accounts: ['0x1234567890123456789012345678901234567890'] }];
    },
    setWalletNotice: (value) => {
      notice = value;
    },
  });

  assert.equal(result, 'connected');
  assert.equal(notice, '');
  assert.equal(reconnectedWith, genericInjected);
}

{
  let notice = 'unchanged';
  const result = await connectWalletWithWagmi({
    windowObject: {
      isSecureContext: true,
      ethereum: {
        request: async () => ['0x1234567890123456789012345678901234567890'],
      },
    },
    connectors: [genericInjected],
    connectAsync: () => {
      throw new Error('Random provider failure. Version: @wagmi/core@3.5.0');
    },
    reconnectAsync: () => {
      throw new Error('reconnect failed');
    },
    setWalletNotice: (value) => {
      notice = value;
    },
  });

  assert.equal(result, 'failed');
  assert.equal(notice, 'Wallet connection failed. Unlock your Ethereum wallet and try again.');
  assert.doesNotMatch(notice, /@wagmi\/core|Version:|Random provider failure/);
}

assert.equal(
  getWalletConnectionNotice({ isSecureContext: true, hasInjectedWallet: true }),
  ''
);
