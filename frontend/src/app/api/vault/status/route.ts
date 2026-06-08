import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

// ABI for just the isPaused() method
const vaultAbi = [
  "function isPaused() external view returns (bool)"
];

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const rpcUrl = process.env.MANTLE_RPC_URL || "https://rpc.sepolia.mantle.xyz";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Default TargetVault address used by the vault status endpoint
    const targetVaultAddress = "0x9d9b602CFe69cfF9706EAc399808E84682ce94FB";
    const targetVault = new ethers.Contract(targetVaultAddress, vaultAbi, provider);

    const isPaused = await targetVault.isPaused();

    return NextResponse.json({ success: true, isPaused });
  } catch (error) {
    console.error("Vault Status check error:", error);
    return NextResponse.json({ success: false, error: 'Failed to fetch vault status', isPaused: false }, { status: 500 });
  }
}
