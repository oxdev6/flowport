// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MigratableCounter {
    address public owner;
    uint256 public value;

    event Incremented(uint256 newValue);
    event ValueSet(uint256 newValue);

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    constructor(uint256 initialValue) {
        owner = msg.sender;
        value = initialValue;
    }

    function increment(uint256 by) external {
        value += by;
        emit Incremented(value);
    }

    function setValue(uint256 newValue) external onlyOwner {
        value = newValue;
        emit ValueSet(newValue);
    }
}


