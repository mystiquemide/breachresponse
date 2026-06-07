#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const DEFAULT_ADDRESS = "0xea3C039795B5b04105B795c8B0cB85e0a42Cc85C";
const DEFAULT_CHAIN_ID = "5003";
const DEFAULT_CREATION_TX_HASH = "0x0dac721b1ed137bf93132222348aab39bae48ed3a6e8b8e6ed0d0ee9d91f2b07";
const DEFAULT_CONTRACT_IDENTIFIER = "project/contracts/SentinelRegistry.sol:SentinelRegistry";
const SOURCIFY_BASE_URL = "https://sourcify.dev/server";

const address = process.env.REGISTRY_ADDRESS || process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || DEFAULT_ADDRESS;
const chainId = process.env.CHAIN_ID || process.env.SOURCIFY_CHAIN_ID || DEFAULT_CHAIN_ID;
const creationTransactionHash = process.env.CREATION_TX_HASH || DEFAULT_CREATION_TX_HASH;
const contractIdentifier = process.env.CONTRACT_IDENTIFIER || DEFAULT_CONTRACT_IDENTIFIER;

function findBuildInfo(contractIdentifier) {
  const [sourceName, contractName] = contractIdentifier.split(":");
  if (!sourceName || !contractName) {
    throw new Error(`Invalid CONTRACT_IDENTIFIER: ${contractIdentifier}`);
  }

  const buildInfoDir = path.resolve("artifacts", "build-info");
  const files = fs
    .readdirSync(buildInfoDir)
    .filter((file) => file.endsWith(".json") && !file.endsWith(".output.json"));

  for (const file of files) {
    const fullPath = path.join(buildInfoDir, file);
    const buildInfo = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    const matchingSourceName = Object.keys(buildInfo.input?.sources || {}).find(
      (candidate) => candidate === sourceName || candidate.endsWith(`/${sourceName}`),
    );

    if (matchingSourceName) {
      const outputPath = fullPath.replace(/\.json$/, ".output.json");
      if (!fs.existsSync(outputPath)) {
        throw new Error(`Missing Hardhat output file for ${file}`);
      }
      const output = JSON.parse(fs.readFileSync(outputPath, "utf8"));
      const contractOutput = output.output?.contracts?.[matchingSourceName]?.[contractName];
      if (contractOutput) {
        return {
          buildInfoPath: fullPath,
          compilerVersion: buildInfo.solcLongVersion || buildInfo.solcVersion,
          stdJsonInput: buildInfo.input,
        };
      }
    }
  }

  throw new Error(`Could not find build info for ${contractIdentifier}. Run npm run compile first.`);
}

async function sourcifyJson(endpoint, options = {}) {
  const response = await fetch(`${SOURCIFY_BASE_URL}${endpoint}`, options);
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  return { ok: response.ok, status: response.status, body };
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function printVerified(contract) {
  console.log("Verified on Sourcify.");
  console.log(`Match: ${contract.match || "unknown"}`);
  console.log(`Runtime match: ${contract.runtimeMatch || "unknown"}`);
  console.log(`Verified at: ${contract.verifiedAt || "unknown"}`);
  console.log(`Repository: https://repo.sourcify.dev/${chainId}/${address}`);
  console.log(`Explorer: https://sepolia.mantlescan.xyz/address/${address}#code`);
}

async function main() {
  const { buildInfoPath, compilerVersion, stdJsonInput } = findBuildInfo(contractIdentifier);

  console.log(`Contract: ${contractIdentifier}`);
  console.log(`Address: ${address}`);
  console.log(`Chain ID: ${chainId}`);
  console.log(`Creation tx: ${creationTransactionHash}`);
  console.log(`Compiler: ${compilerVersion}`);
  console.log(`Build info: ${buildInfoPath}`);

  const existing = await sourcifyJson(`/v2/contract/${chainId}/${address}?fields=all`);
  if (existing.ok && (existing.body.match === "exact_match" || existing.body.match === "match" || existing.body.runtimeMatch === "exact_match")) {
    printVerified(existing.body);
    return;
  }

  const verification = await sourcifyJson(`/v2/verify/${chainId}/${address}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      stdJsonInput,
      compilerVersion,
      contractIdentifier,
      creationTransactionHash,
    }),
  });

  if (!verification.ok || !verification.body.verificationId) {
    console.error(JSON.stringify(verification.body, null, 2));
    process.exit(1);
  }

  console.log(`Verification job: ${verification.body.verificationId}`);

  let lastStatus = verification.body;
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    await sleep(3000);
    const status = await sourcifyJson(`/v2/verify/${verification.body.verificationId}`);
    lastStatus = status.body;
    console.log(`Poll ${attempt}: ${lastStatus.status || lastStatus.verificationStatus || status.status}`);

    const serialized = JSON.stringify(lastStatus).toLowerCase();
    if (serialized.includes("error") || serialized.includes("failed")) {
      console.error(JSON.stringify(lastStatus, null, 2));
      process.exit(1);
    }
    if (serialized.includes("perfect") || serialized.includes("exact_match") || serialized.includes("verified")) {
      printVerified(lastStatus.contract || lastStatus);
      return;
    }
  }

  console.log(JSON.stringify(lastStatus, null, 2));
  throw new Error("Verification job did not finish before timeout.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
