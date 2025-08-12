// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IToken { function mint(address to, uint256 amount) external; }

contract Crowdsale is ReentrancyGuard {
    IToken public immutable token;
    address public immutable owner;
    uint256 public immutable rate;  // tokens per 1 ETH (18 decimals)
    uint256 public immutable cap;   // max wei to raise
    uint256 public weiRaised;

    constructor(address tokenAddress, uint256 _rate, uint256 _cap) {
        require(tokenAddress != address(0), "token addr=0");
        require(_rate != 0, "rate=0");
        require(_cap  != 0, "cap=0");
        token = IToken(tokenAddress);
        owner = msg.sender;
        rate  = _rate;
        cap   = _cap;
    }

    receive() external payable { _buy(); }
    function buyTokens() external payable nonReentrant { _buy(); }

    function withdraw() external {
        require(msg.sender == owner, "not owner");
        (bool ok,) = payable(owner).call{value: address(this).balance}("");
        require(ok, "withdraw fail");
    }

    function _buy() internal {
        require(weiRaised + msg.value <= cap, "cap reached");
        uint256 tokens = (msg.value * rate) / 1e18;
        weiRaised += msg.value;
        token.mint(msg.sender, tokens);
        emit TokensPurchased(msg.sender, msg.value, tokens);
    }

    event TokensPurchased(address indexed buyer, uint256 value, uint256 amount);
}
