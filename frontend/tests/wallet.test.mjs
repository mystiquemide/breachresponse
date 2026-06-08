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

assert.equal(
  getWalletConnectionNotice({ isSecureContext: true, hasInjectedWallet: true }),
  ''
);
