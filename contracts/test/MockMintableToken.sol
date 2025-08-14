// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ultra-minimal mintable token for testing/demo
contract MockMintableToken {
    string public name = "Mock Token";
    string public symbol = "MOCK";
    uint8 public decimals = 18;

    mapping(address => uint256) public balanceOf;
    event Transfer(address indexed from, address indexed to, uint256 value);

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }
}
