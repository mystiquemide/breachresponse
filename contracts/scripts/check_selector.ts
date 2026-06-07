// @ts-nocheck
import hre from "hardhat";

const { ethers } = await hre.network.connect();

async function main() {
  const selector = ethers.id("pause()").substring(0, 10);
  console.log("Selector for pause():", selector);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
