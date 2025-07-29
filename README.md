# 🧬 ProofMint

**ProofMint** is a full-stack dApp that combines a time-limited ERC-20 token crowdsale with ERC-721 NFT receipts as proof of contribution. This project demonstrates how NFTs can serve real utility — beyond collectibles — by functioning as on-chain participation records.

---

## 🚀 Features

- 🪙 **ERC-20 Crowdsale:** A smart contract that accepts ETH in exchange for a custom token.
- 🧾 **NFT Receipt Minting:** Each contributor receives a unique, non-transferable ERC-721 token.
- ⏳ **Time-Limited Sale:** Accepts contributions only during a fixed window.
- 🖥️ **Frontend Interface:** Built with React + Ethers.js for live participation and NFT preview.
- 🧪 **Unit Tests:** Comprehensive Hardhat test suite for both contracts.

---

## 📚 What You'll Learn

- How to structure a dual-contract dApp (ERC-20 + ERC-721)
- How to write and test custom crowdsale logic in Solidity
- How to mint NFTs on-chain in response to real events
- How to connect a React frontend to smart contracts with Ethers.js

---

## 🧱 Tech Stack

- **Solidity** (ERC-20 + ERC-721)
- **Hardhat** (local blockchain + testing)
- **Ethers.js**
- **React + Vite or CRA** (frontend)
- **Tailwind CSS** (UI, optional)
- **Redux Toolkit** (state, optional)

---

## Getting Started

Clone the repo:

```bash
git clone https://github.com/CryptoMachineGene/proofmint.git
cd proofmint
npm install
```
Compile contracts:
```bash
npx hardhat compile
```

Run tests:
```bash
npx hardhat test
```

Spin up local network (optional for frontend dev):
```bash
npx hardhat node
```

## Directory Overview
```bash
contracts/           → Solidity smart contracts
scripts/             → Deployment + helper scripts
test/                → Mocha/Chai test files
frontend/            → React-based frontend (coming soon)
hardhat.config.js    → Hardhat setup
```

Author
Eugene McGrath
Blockchain Developer | Solidity + React
🔗 @CryptoMachineG
🌐 New World Cryptos®

License
MIT — free to use, fork, or remix for your own learning and dev journey.
