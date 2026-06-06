import { ethers } from "hardhat";

async function main() {
  const selector = ethers.id("pause()").substring(0, 10);
  console.log("Selector for pause():", selector);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
