import { ethers } from "hardhat";

/**
 * Deploys:
 *  - ProofNFT (ERC-721 receipts)
 *  - Token (ERC-20)
 *  - Crowdsale(token, rate, cap, nft)
 * Grants:
 *  - ERC20 MINTER_ROLE (if present) to Crowdsale
 *  - NFT  MINTER_ROLE to Crowdsale
 *
 * Adjust names/addresses as needed.
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // ---- Config ----
  // tokens per 1 ETH (18 decimals). Example: 1000e18 means 1000 tokens per ETH.
  const RATE = ethers.parseUnits("1000", 18); // adjust as needed
  // hard cap in wei (example: 100 ETH)
  const CAP  = ethers.parseEther("100");      // adjust as needed

  // If you already have deployed addresses, set them here and skip deploys.
  const EXISTING_TOKEN = ""; // e.g., "0x..." to reuse
  const EXISTING_NFT   = ""; // e.g., "0x..." to reuse

  // ---- Deploy / Attach ERC-721 ----
  let proofNftAddr: string;
  if (EXISTING_NFT) {
    proofNftAddr = EXISTING_NFT;
    console.log("Using existing ProofNFT:", proofNftAddr);
  } else {
    const ProofNFT = await ethers.getContractFactory("ProofNFT");
    const proofNFT = await ProofNFT.deploy("Proof of Purchase", "RECEIPT", "ipfs://base/");
    await proofNFT.waitForDeployment();
    proofNftAddr = await proofNFT.getAddress();
    console.log("Deployed ProofNFT:", proofNftAddr);
  }

  // ---- Deploy / Attach ERC-20 ----
  let tokenAddr: string;
  if (EXISTING_TOKEN) {
    tokenAddr = EXISTING_TOKEN;
    console.log("Using existing ERC20:", tokenAddr);
  } else {
    const Token = await ethers.getContractFactory("Crowdsale"); // <-- rename to your contract
    const token = await Token.deploy();
    await token.waitForDeployment();
    tokenAddr = await token.getAddress();
    console.log("Deployed ERC20:", tokenAddr);
  }

  // ---- Deploy Crowdsale(token, rate, cap, nft) ----
  const Crowdsale = await ethers.getContractFactory("Crowdsale");
  const crowdsale = await Crowdsale.deploy(tokenAddr, RATE, CAP, proofNftAddr);
  await crowdsale.waitForDeployment();
  const crowdsaleAddr = await crowdsale.getAddress();
  console.log("Deployed Crowdsale:", crowdsaleAddr);

  // ---- Grant Roles ----
  // ERC20 MINTER_ROLE (if the token exposes AccessControl)
  try {
  // before:
  // const Token = await ethers.getContractAt("YourMintableToken", tokenAddr);

  // after:
  const Token = await ethers.getContractAt("Token", tokenAddr);

  // @ts-ignore: not all tokens expose this
  if (Token.MINTER_ROLE) {
    // @ts-ignore
    const MINTER_ROLE = await Token.MINTER_ROLE();
    const tx1 = await Token.grantRole(MINTER_ROLE, crowdsaleAddr);
    await tx1.wait();
    console.log("Granted ERC20 MINTER_ROLE to Crowdsale");
  } else {
    console.log("NOTE: Token has no MINTER_ROLE() accessor; ensure Crowdsale can mint.");
  }
} catch {
  console.log("NOTE: Skipped ERC20 role grant (no AccessControl or ABI mismatch).");
}

  // NFT MINTER_ROLE
  {
    const ProofNFT = await ethers.getContractAt("ProofNFT", proofNftAddr);
    const MINTER_ROLE = await ProofNFT.MINTER_ROLE();
    const tx2 = await ProofNFT.grantRole(MINTER_ROLE, crowdsaleAddr);
    await tx2.wait();
    console.log("Granted NFT MINTER_ROLE to Crowdsale");
  }

  console.log("✅ Deployment complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
