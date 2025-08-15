// scripts/02_deploy_proofnft.ts
import { ethers } from "hardhat";

async function main() {
  const NAME = "Proofmint Receipt";
  const SYMBOL = "PMR";
  const BASE_URI = ""; // e.g., "ipfs://<collectionCID>/"

  const ProofNFT = await ethers.getContractFactory("ProofNFT");
  const nft = await ProofNFT.deploy(NAME, SYMBOL, BASE_URI);
  await nft.deployed();

  console.log("ProofNFT deployed to:", nft.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
