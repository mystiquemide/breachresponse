export function getWalletConnectionNotice({ isSecureContext = true, hasInjectedWallet = true } = {}) {
  if (!isSecureContext) {
    return 'Wallet connection requires HTTPS or localhost. Use the secure BreachResponse URL.';
  }

  if (!hasInjectedWallet) {
    return 'No injected Ethereum wallet detected. Open this app in Rabby, MetaMask, OKX, or another Ethereum wallet browser.';
  }

  return '';
}

export function hasInjectedWalletProvider(windowObject) {
  return Boolean(windowObject && windowObject.ethereum);
}

export function getBrowserWalletConnectionNotice(windowObject) {
  if (!windowObject) return '';

  return getWalletConnectionNotice({
    isSecureContext: Boolean(windowObject.isSecureContext),
    hasInjectedWallet: hasInjectedWalletProvider(windowObject),
  });
}
