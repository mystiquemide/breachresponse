import { ethers } from "hardhat";

async function main() {
  const registryAddress = "0x48c3eB74c378D1a2d8E1Ac81a956Ba22aF6502b0";
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
