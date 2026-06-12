// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title TestProtocol
/// @dev Dummy contract for sentinel registration testing on Mantle Sepolia.
contract TestProtocol {
    string public name;
    address public owner;
    uint256 public value;

    event ValueSet(uint256 newValue);

    constructor(string memory _name) {
        name = _name;
        owner = msg.sender;
    }

    function setValue(uint256 _value) external {
        value = _value;
        emit ValueSet(_value);
    }
}
