// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title SentinelRegistry
 * @dev A central registry for protocols to onboard their smart contracts and 
 * grant permissioned execution rights to the Sentinel.ax active-defense agent.
 */
contract SentinelRegistry {
    struct Protocol {
        address admin;
        bool isActive;
        uint256 registeredAt;
    }

    // Mapping from Protocol Contract Address => Protocol Details
    mapping(address => Protocol) public registeredProtocols;
    
    // Global Sentinel Agent Address controlled by the protocol's approved operator path.
    address public sentinelAgent;
    address public owner;

    event ProtocolRegistered(address indexed protocolAddress, address indexed admin);
    event ProtocolDeregistered(address indexed protocolAddress);
    event SentinelAgentUpdated(address indexed newAgent);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not registry owner");
        _;
    }

    modifier onlyProtocolAdmin(address protocolAddress) {
        require(registeredProtocols[protocolAddress].admin == msg.sender, "Not protocol admin");
        _;
    }

    constructor(address _sentinelAgent) {
        owner = msg.sender;
        sentinelAgent = _sentinelAgent;
    }

    /**
     * @dev Called by a protocol admin to register their smart contract for monitoring.
     * The protocol must independently grant the `sentinelAgent` address the PAUSER_ROLE 
     * on their own contract before active defense can be utilized.
     */
    function registerProtocol(address protocolAddress) external {
        require(protocolAddress != address(0), "Invalid address");
        require(!registeredProtocols[protocolAddress].isActive, "Already registered");

        registeredProtocols[protocolAddress] = Protocol({
            admin: msg.sender,
            isActive: true,
            registeredAt: block.timestamp
        });

        emit ProtocolRegistered(protocolAddress, msg.sender);
    }

    function deregisterProtocol(address protocolAddress) external onlyProtocolAdmin(protocolAddress) {
        require(registeredProtocols[protocolAddress].isActive, "Not registered");
        
        registeredProtocols[protocolAddress].isActive = false;
        
        emit ProtocolDeregistered(protocolAddress);
    }

    function setSentinelAgent(address _newAgent) external onlyOwner {
        require(_newAgent != address(0), "Invalid address");
        sentinelAgent = _newAgent;
        emit SentinelAgentUpdated(_newAgent);
    }
}
