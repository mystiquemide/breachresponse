import { expect } from "chai";
import { ethers } from "hardhat";
import { SentinelRegistry, TargetVault, Attacker } from "../typechain-types";

describe("TargetVault & Attacker Exploit", function () {
  let registry: SentinelRegistry;
  let vault: TargetVault;
  let attacker: Attacker;
  
  let owner: any;
  let user: any;
  let attackerSigner: any;
  let agent: any;

  beforeEach(async function () {
    [owner, user, attackerSigner, agent] = await ethers.getSigners();

    // 1. Deploy registry
    const SentinelRegistryFactory = await ethers.getContractFactory("SentinelRegistry");
    registry = await SentinelRegistryFactory.deploy(agent.address);
    await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();

    // 2. Deploy vault
    const TargetVaultFactory = await ethers.getContractFactory("TargetVault");
    vault = await TargetVaultFactory.deploy(registryAddress);
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();

    // 3. Deploy attacker
    const AttackerFactory = await ethers.getContractFactory("Attacker");
    attacker = await AttackerFactory.connect(attackerSigner).deploy(vaultAddress);
    await attacker.waitForDeployment();
  });

  describe("Normal Operations", function () {
    it("Should allow deposits and track balances", async function () {
      await expect(vault.connect(user).deposit({ value: ethers.parseEther("5.0") }))
        .to.emit(vault, "Deposited")
        .withArgs(user.address, ethers.parseEther("5.0"));

      expect(await vault.balances(user.address)).to.equal(ethers.parseEther("5.0"));
      expect(await ethers.provider.getBalance(await vault.getAddress())).to.equal(ethers.parseEther("5.0"));
    });

    it("Should allow normal withdrawals", async function () {
      await vault.connect(user).deposit({ value: ethers.parseEther("3.0") });
      
      await expect(vault.connect(user).withdraw(ethers.parseEther("1.0")))
        .to.emit(vault, "Withdrawn")
        .withArgs(user.address, ethers.parseEther("1.0"));

      expect(await vault.balances(user.address)).to.equal(ethers.parseEther("2.0"));
      expect(await ethers.provider.getBalance(await vault.getAddress())).to.equal(ethers.parseEther("2.0"));
    });
  });

  describe("Reentrancy Exploit", function () {
    it("Should be vulnerable to reentrancy drain when undefended", async function () {
      // Seed vault with 10 ETH from user
      await vault.connect(user).deposit({ value: ethers.parseEther("10.0") });
      
      // Attacker deposits 1 ETH to target
      await attacker.connect(attackerSigner).depositToTarget({ value: ethers.parseEther("1.0") });
      
      const vaultAddress = await vault.getAddress();
      const attackerAddress = await attacker.getAddress();

      expect(await ethers.provider.getBalance(vaultAddress)).to.equal(ethers.parseEther("11.0"));
      expect(await ethers.provider.getBalance(attackerAddress)).to.equal(ethers.parseEther("0.0"));

      // Attacker launches exploit
      await attacker.connect(attackerSigner).attack(ethers.parseEther("1.0"));

      // Vault is fully drained, Attacker receives all 11 ETH
      expect(await ethers.provider.getBalance(vaultAddress)).to.equal(ethers.parseEther("0.0"));
      expect(await ethers.provider.getBalance(attackerAddress)).to.equal(ethers.parseEther("11.0"));
    });
  });

  describe("Sentinel Active Defense (Pause)", function () {
    it("Should allow the sentinel agent to pause target contract", async function () {
      await expect(vault.connect(agent).pause())
        .to.emit(vault, "Paused");

      expect(await vault.isPaused()).to.be.true;
    });

    it("Should prevent random users or attackers from pausing", async function () {
      await expect(vault.connect(attackerSigner).pause())
        .to.be.revertedWith("Not sentinel agent or owner");
    });

    it("Should block deposits and withdrawals (reentrancy) when paused", async function () {
      // Seed vault with 5 ETH
      await vault.connect(user).deposit({ value: ethers.parseEther("5.0") });
      
      // Sentinel pauses contract
      await vault.connect(agent).pause();

      // Attempts to deposit or withdraw fail
      await expect(vault.connect(user).deposit({ value: ethers.parseEther("1.0") }))
        .to.be.revertedWith("Contract is paused");

      await expect(vault.connect(user).withdraw(ethers.parseEther("1.0")))
        .to.be.revertedWith("Contract is paused");
    });

    it("Should block attacker exploit recursive loops when paused", async function () {
      // Seed vault with 10 ETH
      await vault.connect(user).deposit({ value: ethers.parseEther("10.0") });
      await attacker.connect(attackerSigner).depositToTarget({ value: ethers.parseEther("1.0") });

      // Sentinel pauses target contract
      await vault.connect(agent).pause();

      // Attacker attempts attack but reverts
      await expect(attacker.connect(attackerSigner).attack(ethers.parseEther("1.0")))
        .to.be.revertedWith("Contract is paused");

      // Balance remains safe
      expect(await ethers.provider.getBalance(await vault.getAddress())).to.equal(ethers.parseEther("11.0"));
    });
  });
});
