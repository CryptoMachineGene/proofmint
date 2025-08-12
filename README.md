# Proofmint

A minimal Hardhat-based smart contract project for token sales.

## Features
- ERC20-like Token
- Crowdsale with cap and rate
- Reentrancy protection tests

## Setup
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
