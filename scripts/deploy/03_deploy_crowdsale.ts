import hre, { ethers, network, run } from "hardhat";
import { readAddresses, writeAddresses } from "../utils/addresses";

function first<T>(...vals: (T | undefined | null | "" )[]): T | undefined {
  for (const v of vals) if (v !== undefined && v !== null && v !== "") return v as T;
}

function toWeiFromEthInt(ethStr: string): bigint {
  // Only supports integer ETH like "10". If you need decimals, use CROWDSALE_CAP in wei instead.
  if (!/^\d+$/.test(ethStr)) {
    throw new Error(`CAP_ETH must be an integer (e.g., 10). Use CROWDSALE_CAP (wei) for decimals.`);
  }
  return BigInt(ethStr) * 10n ** 18n;
}

async function main() {
  const net = network.name;
  const addrs = await readAddresses(net);

  // If you already have a deployed crowdsale, just record it and exit
  const envCrowdsale = (process.env.CROWDSALE_ADDRESS || process.env.CROWDSALE || "").trim();
  if (envCrowdsale) {
    console.log("ℹ️ Using existing Crowdsale from .env:", envCrowdsale);
    addrs.Crowdsale = envCrowdsale;
    await writeAddresses(net, addrs);
    return;
  }

  // ---- Resolve constructor params ----
  // tokenAddress
  const tokenAddress = first<string>(
    (process.env.TOKEN_ADDRESS || "").trim(),
    addrs.Token
  );
  if (!tokenAddress) throw new Error("Missing TOKEN_ADDRESS (or 'Token' in deployments file).");

  // _rate
  const rateStr = first<string>(
    (process.env.RATE || "").trim(),
    (process.env.RATE_TOKENS_PER_ETH || "").trim()
  );
  if (!rateStr) throw new Error("Missing RATE (or RATE_TOKENS_PER_ETH) in .env.");
  const rate = BigInt(rateStr); // uint256

  // _cap (prefer wei; fallback to integer ETH)
  const capWeiStr = (process.env.CROWDSALE_CAP || "").trim();
  const capEthStr = (process.env.CAP_ETH || "").trim();
  let cap: bigint | undefined;
  if (capWeiStr) {
    if (!/^\d+$/.test(capWeiStr)) throw new Error("CROWDSALE_CAP must be a wei integer.");
    cap = BigInt(capWeiStr);
  } else if (capEthStr) {
    cap = toWeiFromEthInt(capEthStr);
  }
  if (cap === undefined) {
    throw new Error("Missing CROWDSALE_CAP (wei) or CAP_ETH (integer ETH) in .env.");
  }

  // nftAddress
  const nftAddress = first<string>(
    (process.env.NFT_ADDRESS || "").trim(),
    addrs.ProofNFT
  );
  if (!nftAddress) throw new Error("Missing NFT_ADDRESS (or 'ProofNFT' in deployments file).");

  // ---- Deploy ----
  const Crowdsale = await ethers.getContractFactory("Crowdsale");
  const crowdsale = await Crowdsale.deploy(tokenAddress, rate, cap, nftAddress);
  await crowdsale.waitForDeployment();
  const crowdsaleAddress = await crowdsale.getAddress();
  console.log("✅ Crowdsale deployed:", crowdsaleAddress);

  addrs.Token = tokenAddress;
  addrs.ProofNFT = nftAddress;
  addrs.Crowdsale = crowdsaleAddress;
  await writeAddresses(net, addrs);

  // Optional: if your NFT requires roles, grant minter to Crowdsale
  try {
    await hre.run("grant-minter", { nft: nftAddress, to: crowdsaleAddress } as any);
    console.log("🔐 Granted minter on NFT to Crowdsale");
  } catch (e) {
    console.log("ℹ️ grant-minter skipped or failed:", (e as Error).message);
  }

  // Verify
  if (process.env.ETHERSCAN_API_KEY) {
    try {
      await run("verify:verify", {
        address: crowdsaleAddress,
        constructorArguments: [tokenAddress, rate, cap, nftAddress],
      });
      console.log("🔎 Verified Crowdsale");
    } catch (e) {
      console.log("ℹ️ Verify (crowdsale) skipped or failed:", (e as Error).message);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
