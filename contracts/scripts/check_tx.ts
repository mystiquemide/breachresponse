// @ts-nocheck
import hre from "hardhat";

const { ethers } = await hre.network.connect();

async function main() {
  const txHash = "0x2c1d89e9a489b58fe7fd2d18c8064cc5c41f869891cade77b8a6be7b2f37d782";
  console.log("Querying transaction receipt for:", txHash);

  try {
    const receipt = await ethers.provider.getTransactionReceipt(txHash);
    if (!receipt) {
      console.log("Transaction receipt not found!");
      return;
    }

    console.log(`Block Number: ${receipt.blockNumber}`);
    console.log(`Status: ${receipt.status}`);
    console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
    console.log(`Logs Count: ${receipt.logs.length}`);
    
    receipt.logs.forEach((log, index) => {
      console.log(`Log #${index}:`);
      console.log(`  Address: ${log.address}`);
      console.log(`  Topics: ${JSON.stringify(log.topics)}`);
      console.log(`  Data: ${log.data}`);
    });
  } catch (error: any) {
    console.error("Error querying transaction:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
