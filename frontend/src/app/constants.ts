export const REGISTRY_ADDRESS = (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || "0xea3C039795B5b04105B795c8B0cB85e0a42Cc85C") as `0x${string}`;

export const REGISTRY_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "protocolAddress",
        "type": "address"
      }
    ],
    "name": "registerProtocol",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "registeredProtocols",
    "outputs": [
      {
        "internalType": "address",
        "name": "admin",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "registeredAt",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
