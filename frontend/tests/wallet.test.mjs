import assert from 'node:assert/strict';
import { getWalletConnectionNotice } from '../src/lib/wallet.js';

assert.equal(
  getWalletConnectionNotice({ isSecureContext: false, hasInjectedWallet: true }),
  'Wallet connection requires HTTPS or localhost. Use the secure BreachResponse URL.'
);

assert.equal(
  getWalletConnectionNotice({ isSecureContext: true, hasInjectedWallet: false }),
  'No injected wallet detected. Install MetaMask or open this app in a wallet browser.'
);

const { getPreferredWalletConnector, connectWalletWithWagmi, getMetaMaskDappLink } = await import('../src/lib/wagmiWallet.js');

const genericInjected = { id: 'injected', name: 'Injected' };
const metaMask = { id: 'io.metamask', name: 'MetaMask' };
const walletConnect = { id: 'walletConnect', name: 'WalletConnect' };

assert.equal(getPreferredWalletConnector([walletConnect, genericInjected, metaMask]), metaMask);
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
  let redirectedTo = '';
  const result = await connectWalletWithWagmi({
    windowObject: {
      isSecureContext: true,
      location: {
        href: 'https://breachresponse.43.131.9.176.nip.io/',
        assign: (url) => {
          redirectedTo = url;
        },
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

  assert.equal(result, 'opening-metamask');
  assert.equal(notice, 'No injected wallet found. Opening this dapp in MetaMask wallet browser.');
  assert.equal(connectedWith, null);
  assert.equal(redirectedTo, 'https://metamask.app.link/dapp/breachresponse.43.131.9.176.nip.io/');
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

  assert.equal(result, 'missing-connector');
  assert.equal(notice, 'Wallet connector is not ready yet. Reload the page and try again.');
}

{
  let notice = '';
  let redirectedTo = '';
  const result = await connectWalletWithWagmi({
    windowObject: {
      isSecureContext: true,
      location: {
        href: 'https://breachresponse.43.131.9.176.nip.io/dashboard?tour=1#connect',
        assign: (url) => {
          redirectedTo = url;
        },
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

  assert.equal(result, 'opening-metamask');
  assert.equal(notice, 'No injected wallet found. Opening this dapp in MetaMask wallet browser.');
  assert.equal(redirectedTo, 'https://metamask.app.link/dapp/breachresponse.43.131.9.176.nip.io/dashboard?tour=1#connect');
}

{
  let notice = '';
  let requestedMethod = '';
  const result = await connectWalletWithWagmi({
    windowObject: {
      isSecureContext: true,
      ethereum: {
        request: async ({ method }) => {
          requestedMethod = method;
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
  assert.equal(requestedMethod, 'eth_requestAccounts');
  assert.equal(notice, '');
}

{
  let notice = '';
  const never = new Promise(() => {});
  const result = await connectWalletWithWagmi({
    windowObject: {
      isSecureContext: true,
      ethereum: {
        request: () => never,
      },
    },
    connectors: [genericInjected],
    connectAsync: () => {
      throw new Error('should not call wagmi while wallet request is stuck');
    },
    setWalletNotice: (value) => {
      notice = value;
    },
    timeoutMs: 5,
  });

  assert.equal(result, 'timed-out');
  assert.equal(notice, 'Wallet request is still pending. Open MetaMask, approve the request, then tap Connect Wallet again.');
}

assert.equal(
  getMetaMaskDappLink({ location: { href: 'https://breachresponse.43.131.9.176.nip.io/history' } }),
  'https://metamask.app.link/dapp/breachresponse.43.131.9.176.nip.io/history'
);

assert.equal(
  getWalletConnectionNotice({ isSecureContext: true, hasInjectedWallet: true }),
  ''
);
