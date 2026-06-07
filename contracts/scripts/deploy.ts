// @ts-nocheck
import hre from "hardhat";

const { ethers } = await hre.network.connect();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  try {
    // 1. Deploy SentinelRegistry
    console.log("Deploying SentinelRegistry...");
    const SentinelRegistry = await ethers.getContractFactory("SentinelRegistry");
    const registry = await SentinelRegistry.deploy(deployer.address);
    console.log("Tx hash:", registry.deploymentTransaction()?.hash);
    
    try {
      await registry.waitForDeployment();
    } catch (e) {
      console.log("Wait for deployment threw (normal for L2), sleeping 15s...");
      await sleep(15000);
    }
    const registryAddress = await registry.getAddress();
    console.log("SentinelRegistry deployed to:", registryAddress);

    // 2. Deploy TargetVault
    console.log("Deploying TargetVault...");
    const TargetVault = await ethers.getContractFactory("TargetVault");
    const vault = await TargetVault.deploy(registryAddress);
    console.log("Tx hash:", vault.deploymentTransaction()?.hash);

    try {
      await vault.waitForDeployment();
    } catch (e) {
      console.log("Wait for deployment threw (normal for L2), sleeping 15s...");
      await sleep(15000);
    }
    const vaultAddress = await vault.getAddress();
    console.log("TargetVault deployed to:", vaultAddress);

    // 3. Register Vault
    console.log("Registering Vault with Registry...");
    const tx = await registry.registerProtocol(vaultAddress);
    console.log("Tx hash:", tx.hash);
    try {
      await tx.wait(1);
    } catch (e) {
      console.log("Wait threw, sleeping 15s...");
      await sleep(15000);
    }
    console.log("Vault registered successfully!");

    console.log("\n=================================");
    console.log("Deployment Complete!");
    console.log("REGISTRY_ADDRESS:", registryAddress);
    console.log("VAULT_ADDRESS:", vaultAddress);
    console.log("=================================\n");

  } catch (err) {
    console.error("Fatal deployment error:", err);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
