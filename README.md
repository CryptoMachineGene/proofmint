Proofmint

A minimal Hardhat-based smart contract project for token sales.

Features
- ERC20-like Token
- Crowdsale with cap and rate
- Reentrancy protection tests

Setup
```bash
npm install
npx hardhat compile
npx hardhat test
```

Extras
Run coverage:
```bash
npx hardhat clean
```

Clean build artifacts:
```bash
npx hardhat clean
```

Project Structure
```bash
contracts/           # Solidity smart contracts
  Crowdsale.sol
  Token.sol
  MockTokenReenter.sol

test/                # Mocha/Chai test files
  Crowdsale.js

hardhat.config.js    # Hardhat configuration
.gitignore           # Ignores build, cache, coverage outputs
package.json         # Project dependencies and scripts
```

Live Test (Buy Tokens on Sepolia)

Use the script to purchase tokens from the deployed crowdsale:
```bash
npm run buy:sepolia
```

Withdraw raised ETH (owner only)
```bash
npm run withdraw:sepolia
```

Withdraw Raised ETH (Owner Only)
Withdraws all ETH in the Crowdsale to the owner account.

```bash
# Uses deployments/latest.json for the crowdsale address
npm run withdraw:sepolia

# Or override with a specific address
CROWDSALE_ADDR=0xCFCdAb4566285Ee54650E3B7877f740b83aE8Fcf npm run withdraw:sepolia
```

Buy Tokens (Sepolia)

You can purchase tokens from the deployed Crowdsale using a simple script (no frontend required).

Default (uses deployer account)
```bash
npm run buy:sepolia
```
