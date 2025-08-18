import hre, { ethers, network, run } from "hardhat";
import { readAddresses, writeAddresses } from "../utils/addresses";

function first<T>(...vals: (T | undefined | null | "" )[]): T | undefined {
  for (const v of vals) if (v !== undefined && v !== null && v !== "") return v as T;
}

function toWeiFromEthInt(ethStr: string): bigint {
  if (!/^\d+$/.test(ethStr)) {
    throw new Error(`CAP_ETH must be an integer (e.g., "10"). Use CROWDSALE_CAP (wei) for decimals.`);
  }
  return BigInt(ethStr) * 10n ** 18n;
}

async function main() {
  const net = network.name;
  const addrs = await readAddresses(net);

  // Use existing crowdsale if provided
  const envCrowdsale = (process.env.CROWDSALE_ADDRESS || process.env.CROWDSALE || "").trim();
  if (envCrowdsale) {
    console.log("ℹ️ Using existing Crowdsale from .env:", envCrowdsale);
    addrs.Crowdsale = envCrowdsale;
    await writeAddresses(net, addrs);
    return;
  }

  // ---- tokenAddress ----
  const envToken = (process.env.TOKEN_ADDRESS || "").trim();
  const fileToken = addrs.Token;
  const tokenAddress = first<string>(envToken, fileToken);
  if (!tokenAddress) throw new Error("❌ Missing TOKEN_ADDRESS in .env and no 'Token' in deployments file.");
  if (envToken) console.log("ℹ️ Using TOKEN_ADDRESS from .env:", tokenAddress);
  else console.log("ℹ️ Using TOKEN_ADDRESS from deployments file:", tokenAddress);

  // ---- rate ----
  const rateStr = first<string>(
    (process.env.RATE || "").trim(),
    (process.env.RATE_TOKENS_PER_ETH || "").trim()
  );
  if (!rateStr) throw new Error("❌ Missing RATE (or RATE_TOKENS_PER_ETH) in .env.");
  const rate = BigInt(rateStr);
  console.log("ℹ️ Using RATE (tokens per ETH):", rate.toString());

  // ---- cap ----
  const capWeiStr = (process.env.CROWDSALE_CAP || "").trim();
  const capEthStr = (process.env.CAP_ETH || "").trim();
  let cap: bigint | undefined;
  if (capWeiStr) {
    if (!/^\d+$/.test(capWeiStr)) throw new Error("❌ CROWDSALE_CAP must be a wei integer.");
    cap = BigInt(capWeiStr);
    console.log(`ℹ️ Using CROWDSALE_CAP from .env (wei): ${capWeiStr}`);
  } else if (capEthStr) {
    const capWei = toWeiFromEthInt(capEthStr);
    cap = capWei;
    console.log(`ℹ️ Using CAP_ETH from .env (ETH): ${capEthStr} → (wei): ${capWei.toString()}`);
  }
  if (cap === undefined) throw new Error("❌ Missing CROWDSALE_CAP (wei) or CAP_ETH (ETH int).");
  console.log("ℹ️ Final cap (wei) to pass to constructor:", cap.toString());

  // ---- nftAddress ----
  const envNft = (process.env.NFT_ADDRESS || "").trim();
  const fileNft = addrs.ProofNFT;
  const nftAddress = first<string>(envNft, fileNft);
  if (!nftAddress) throw new Error("❌ Missing NFT_ADDRESS in .env and no 'ProofNFT' in deployments file.");
  if (envNft) console.log("ℹ️ Using NFT_ADDRESS from .env:", nftAddress);
  else console.log("ℹ️ Using NFT_ADDRESS from deployments file:", nftAddress);

  // ---- Deploy ----
  const Crowdsale = await ethers.getContractFactory("Crowdsale");
  console.log("🚀 Deploying Crowdsale with args:", {
    tokenAddress,
    rate: rate.toString(),
    cap: cap.toString(),
    nftAddress,
  });
  const crowdsale = await Crowdsale.deploy(tokenAddress, rate, cap, nftAddress);
  await crowdsale.waitForDeployment();
  const crowdsaleAddress = await crowdsale.getAddress();
  console.log("✅ Crowdsale deployed:", crowdsaleAddress);

  // Persist
  addrs.Token = tokenAddress;
  addrs.ProofNFT = nftAddress;
  addrs.Crowdsale = crowdsaleAddress;
  await writeAddresses(net, addrs);

  // Optional: grant NFT minter to Crowdsale
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
