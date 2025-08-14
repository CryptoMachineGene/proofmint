// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IToken { function mint(address to, uint256 amount) external; }

contract Crowdsale is ReentrancyGuard {
    IToken   public immutable token;
    address  public immutable owner;
    uint256  public immutable rate; // tokens per 1 ETH (18 decimals)
    uint256  public immutable cap;  // max wei to raise
    uint256  public weiRaised;

    event TokensPurchased(address indexed buyer, uint256 value, uint256 amount);
    event Withdrawn(address indexed to, uint256 value);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor(address tokenAddress, uint256 _rate, uint256 _cap) {
        require(tokenAddress != address(0), "token addr=0");
        require(_rate != 0, "rate=0");
        require(_cap  != 0, "cap=0");
        token = IToken(tokenAddress);
        owner = msg.sender;
        rate  = _rate;
        cap   = _cap;
    }

    // Plain ETH sends are treated as buys; inherit guard via buyTokens()
    receive() external payable {
        buyTokens();
    }

    // Single external entry point, guarded
    function buyTokens() public payable nonReentrant {
        _buy(msg.sender, msg.value);
    }

    function withdraw() external nonReentrant onlyOwner {
        uint256 amt = address(this).balance;
        (bool ok, ) = payable(owner).call{ value: amt }("");
        require(ok, "withdraw fail");
        emit Withdrawn(owner, amt);
    }

    // ---- Internal logic (no modifier needed) ----
    function _buy(address beneficiary, uint256 weiAmount) internal {
        require(weiAmount > 0, "no ETH sent");
        require(weiRaised + weiAmount <= cap, "cap reached");

        // rate = tokens per 1 ETH; scale from wei
        uint256 tokens = (weiAmount * rate) / 1e18;

        // effects before interaction
        weiRaised += weiAmount;

        // interaction (external call to token)
        token.mint(beneficiary, tokens);

        emit TokensPurchased(beneficiary, weiAmount, tokens);
    }
}
