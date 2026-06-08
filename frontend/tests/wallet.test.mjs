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

const { getPreferredWalletConnector, connectWalletWithWagmi } = await import('../src/lib/wagmiWallet.js');

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
  const result = await connectWalletWithWagmi({
    windowObject: { isSecureContext: true },
    connectors: [metaMask],
    connect: ({ connector }) => {
      connectedWith = connector;
    },
    setWalletNotice: (value) => {
      notice = value;
    },
  });

  assert.equal(result, 'connecting');
  assert.equal(notice, '');
  assert.equal(connectedWith, metaMask);
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

assert.equal(
  getWalletConnectionNotice({ isSecureContext: true, hasInjectedWallet: true }),
  ''
);
