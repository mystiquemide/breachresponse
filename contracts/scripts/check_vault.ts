import { ethers } from "hardhat";

async function main() {
  const targetVaultAddress = "0x9d9b602CFe69cfF9706EAc399808E84682ce94FB";
  const targetVault = await ethers.getContractAt("TargetVault", targetVaultAddress);

  console.log("Vault isPaused status:", await targetVault.isPaused());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
