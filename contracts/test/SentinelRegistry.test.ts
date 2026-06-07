import { expect } from "chai";
import hre from "hardhat";

const { ethers } = await hre.network.create();

describe("SentinelRegistry", function () {
  let registry: any;
  let owner: any;
  let admin: any;
  let agent: any;
  let newAgent: any;
  let randomUser: any;

  beforeEach(async function () {
    [owner, admin, agent, newAgent, randomUser] = await ethers.getSigners();

    const SentinelRegistryFactory = await ethers.getContractFactory("SentinelRegistry");
    registry = await SentinelRegistryFactory.deploy(agent.address);
    await registry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await registry.owner()).to.equal(owner.address);
    });

    it("Should set the initial sentinel agent address", async function () {
      expect(await registry.sentinelAgent()).to.equal(agent.address);
    });
  });

  describe("Protocol Registration", function () {
    it("Should allow a protocol to register and emit ProtocolRegistered event", async function () {
      const targetAddress = randomUser.address; // Use mock address for test

      await expect(registry.connect(admin).registerProtocol(targetAddress))
        .to.emit(registry, "ProtocolRegistered")
        .withArgs(targetAddress, admin.address);

      const protocol = await registry.registeredProtocols(targetAddress);
      expect(protocol.admin).to.equal(admin.address);
      expect(protocol.isActive).to.be.true;
    });

    it("Should fail if registering an already active protocol", async function () {
      const targetAddress = randomUser.address;
      await registry.connect(admin).registerProtocol(targetAddress);

      await expect(registry.connect(admin).registerProtocol(targetAddress))
        .to.be.revertedWith("Already registered");
    });

    it("Should fail if registering address(0)", async function () {
      await expect(registry.connect(admin).registerProtocol(ethers.ZeroAddress))
        .to.be.revertedWith("Invalid address");
    });
  });

  describe("Protocol Deregistration", function () {
    it("Should allow the admin of a protocol to deregister", async function () {
      const targetAddress = randomUser.address;
      await registry.connect(admin).registerProtocol(targetAddress);

      await expect(registry.connect(admin).deregisterProtocol(targetAddress))
        .to.emit(registry, "ProtocolDeregistered")
        .withArgs(targetAddress);

      const protocol = await registry.registeredProtocols(targetAddress);
      expect(protocol.isActive).to.be.false;
    });

    it("Should fail if a non-admin attempts to deregister", async function () {
      const targetAddress = randomUser.address;
      await registry.connect(admin).registerProtocol(targetAddress);

      await expect(registry.connect(randomUser).deregisterProtocol(targetAddress))
        .to.be.revertedWith("Not protocol admin");
    });
  });

  describe("Sentinel Agent Management", function () {
    it("Should allow the owner to update the sentinel agent address", async function () {
      await expect(registry.connect(owner).setSentinelAgent(newAgent.address))
        .to.emit(registry, "SentinelAgentUpdated")
        .withArgs(newAgent.address);

      expect(await registry.sentinelAgent()).to.equal(newAgent.address);
    });

    it("Should prevent non-owners from updating the sentinel agent", async function () {
      await expect(registry.connect(randomUser).setSentinelAgent(newAgent.address))
        .to.be.revertedWith("Not registry owner");
    });

    it("Should fail if updating to address(0)", async function () {
      await expect(registry.connect(owner).setSentinelAgent(ethers.ZeroAddress))
        .to.be.revertedWith("Invalid address");
    });
  });
});
