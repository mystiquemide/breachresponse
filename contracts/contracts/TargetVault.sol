// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ISentinelRegistry {
    function sentinelAgent() external view returns (address);
}

/**
 * @title TargetVault
 * @dev A vault contract vulnerable to reentrancy attacks, designed to demonstrate 
 * active sentinel monitoring and mitigation on Mantle Network.
 */
contract TargetVault {
    mapping(address => uint256) public balances;
    address public owner;
    ISentinelRegistry public registry;
    bool public isPaused;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event Paused();
    event Unpaused();

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlySentinelOrOwner() {
        require(
            msg.sender == owner || msg.sender == registry.sentinelAgent(),
            "Not sentinel agent or owner"
        );
        _;
    }

    modifier whenNotPaused() {
        require(!isPaused, "Contract is paused");
        _;
    }

    constructor(address _registryAddress) {
        owner = msg.sender;
        registry = ISentinelRegistry(_registryAddress);
    }

    function deposit() external payable whenNotPaused {
        require(msg.value > 0, "Deposit must be greater than 0");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @dev VULNERABLE withdraw function.
     * Performs external call *before* updating the user balance mapping, 
     * making it vulnerable to reentrancy attacks.
     */
    function withdraw(uint256 amount) external whenNotPaused {
        require(balances[msg.sender] >= amount, "Insufficient balance");

        // External call (reentrancy vector)
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        // State update after external call (unchecked to allow reentrancy underflow in 0.8+)
        unchecked {
            balances[msg.sender] -= amount;
        }

        emit Withdrawn(msg.sender, amount);
    }

    function pause() external onlySentinelOrOwner whenNotPaused {
        isPaused = true;
        emit Paused();
    }

    function unpause() external onlyOwner {
        isPaused = false;
        emit Unpaused();
    }

    // Fallback to receive funds
    receive() external payable {}
}
