// @ts-nocheck
import hre from "hardhat";

const { ethers } = await hre.network.connect();

async function main() {
  const targetVaultAddress = "0x9d9b602CFe69cfF9706EAc399808E84682ce94FB";
  const targetVault = await ethers.getContractAt("TargetVault", targetVaultAddress);

  const [deployer] = await ethers.getSigners();
  console.log("Caller address:", deployer.address);
  console.log("Vault Owner:", await targetVault.owner());
  console.log("Vault Registry:", await targetVault.registry());
  console.log("Vault isPaused status:", await targetVault.isPaused());

  try {
    console.log("Calling pause() on-chain...");
    const tx = await targetVault.pause();
    console.log("Tx sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("Tx succeeded! Status:", receipt?.status);
  } catch (error: any) {
    console.error("Revert Error Details:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
