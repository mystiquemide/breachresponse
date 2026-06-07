import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import * as dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      mining: {
        auto: true,
        interval: 0
      }
    },
    mantle_sepolia: {
      url: "https://mantle-sepolia.drpc.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      timeout: 1000000
    }
  }
};

export default config;
