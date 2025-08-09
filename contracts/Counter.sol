// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Counter {
    uint256 public value;

    event Incremented(uint256 newValue);

    constructor(uint256 initialValue) {
        value = initialValue;
    }

    function increment(uint256 by) external {
        value += by;
        emit Incremented(value);
    }
}


