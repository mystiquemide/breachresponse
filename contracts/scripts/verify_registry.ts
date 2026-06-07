// @ts-nocheck
import hre from "hardhat";

const { ethers } = await hre.network.connect();

async function main() {
  const registryAddress = process.env.REGISTRY_ADDRESS || process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || "0xea3C039795B5b04105B795c8B0cB85e0a42Cc85C";
  console.log("Querying SentinelRegistry at:", registryAddress);

  const registry = await ethers.getContractAt("SentinelRegistry", registryAddress);
  
  try {
    const owner = await registry.owner();
    const agent = await registry.sentinelAgent();
    console.log("Registry Owner:", owner);
    console.log("Registry Sentinel Agent:", agent);
  } catch (error: any) {
    console.error("Failed to query registry:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
