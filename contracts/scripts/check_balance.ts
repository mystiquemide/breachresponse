// @ts-nocheck
import hre from "hardhat";

const { ethers } = await hre.network.connect();

async function main() {
  const rpcs = [
    "https://rpc.sepolia.mantle.xyz",
    "https://mantle-sepolia.drpc.org",
    "https://endpoints.omniatech.io/v1/mantle/sepolia/public"
  ];

  for (const rpc of rpcs) {
    console.log(`Testing RPC: ${rpc}`);
    try {
      const provider = new ethers.JsonRpcProvider(rpc);
      const [deployer] = await ethers.getSigners();
      const blockNumber = await provider.getBlockNumber();
      console.log(`  Connection Success! Block number: ${blockNumber}`);
      const balance = await provider.getBalance(deployer.address);
      console.log(`  Account: ${deployer.address}`);
      console.log(`  Balance: ${ethers.formatEther(balance)} MNT`);
      break;
    } catch (e: any) {
      console.log(`  Failed: ${e.message}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
