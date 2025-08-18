import hre, { ethers, network, run } from "hardhat";
import { readAddresses, writeAddresses } from "../utils/addresses";
import fs from "fs";
import path from "path";

/* ---------- helpers ---------- */
function upsertEnvVar(filePath: string, key: string, value: string) {
  const line = `${key}=${value}`;
  let contents = "";
  try { contents = fs.readFileSync(filePath, "utf8"); } catch { /* no .env yet */ }

  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(contents)) {
    contents = contents.replace(re, line);
  } else {
    if (contents.length && !contents.endsWith("\n")) contents += "\n";
    contents += line + "\n";
  }
  fs.writeFileSync(filePath, contents, "utf8");
}

function envFor(prefix: string, paramName: string): string | undefined {
  const raw = paramName;
  const sanitized = raw.replace(/_+$/, "");
  const keys = [
    `${prefix}_${raw}`.toUpperCase(),
    `${prefix}_${sanitized}`.toUpperCase(),
  ];
  for (const k of keys) {
    const v = process.env[k];
    if (v !== undefined && v !== "") return v;
  }
  return undefined;
}

async function resolveArgs(contractName: string, inputs: { name: string; type: string }[]) {
  const prefix = contractName.toUpperCase();
  const args: any[] = [];

  const [deployer] = await ethers.getSigners();

  for (const { name, type } of inputs) {
    let val = envFor(prefix, name);

    // special-case: admin/owner → fallback to deployer
    if (!val && name.toLowerCase().includes("admin")) {
      val = await deployer.getAddress();
      console.log(`ℹ️ No ${prefix}_${name.toUpperCase()} set in .env, defaulting to deployer: ${val}`);
    }

    if (val === undefined) {
      throw new Error(
        `Missing env var for ${contractName} constructor arg "${name}". ` +
        `Set ${prefix}_${name.toUpperCase()} (with or without trailing underscore).`
      );
    }

    const looksLikeAddr = val.startsWith("0x") && val.length >= 42;
    const isInt = /^\d+$/.test(val);
    if (isInt && !looksLikeAddr && type.startsWith("uint")) {
      args.push(BigInt(val));
    } else {
      args.push(val);
    }
  }
  return args;
}
/* ---------- /helpers ---------- */

async function main() {
  const net = network.name;
  const addrs = await readAddresses(net);

  const contractName = "ProofNFT";
  const artifact = await hre.artifacts.readArtifact(contractName);
  const ctor = (artifact.abi as any[]).find((x) => x.type === "constructor");
  const inputs: { name: string; type: string }[] = ctor?.inputs || [];

  const constructorArgs = await resolveArgs(contractName, inputs);

  const Factory = await ethers.getContractFactory(contractName);
  const nft = await Factory.deploy(...constructorArgs);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log(`✅ ${contractName} deployed: ${nftAddress}`);

  addrs.ProofNFT = nftAddress;
  await writeAddresses(net, addrs);

  const envPath = path.resolve(process.cwd(), ".env");
  upsertEnvVar(envPath, "NFT_ADDRESS", nftAddress);
  console.log(`📝 Updated .env with NFT_ADDRESS=${nftAddress}`);

  if (process.env.ETHERSCAN_API_KEY) {
    try {
      await run("verify:verify", {
        address: nftAddress,
        constructorArguments: constructorArgs,
      });
      console.log(`🔎 Verified ${contractName}`);
    } catch (e) {
      console.log("ℹ️ Verify (nft) skipped or failed:", (e as Error).message);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
