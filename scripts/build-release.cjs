const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const backend = path.resolve(root, "../Backend");
const appJsonPath = path.join(root, "app.json");
const envPath = path.join(backend, ".env");
const androidDir = path.join(root, "android");
const apkPath = path.join(
  androidDir,
  "app/build/outputs/apk/release/app-release.apk",
);

const repo = "PranjalScripts/Vault_frontend";
const apkUrl = `https://github.com/${repo}/releases/latest/download/app-release.apk`;

const UPDATE_KEYS = [
  "VAULT_UPDATE_LATEST_VERSION",
  "VAULT_UPDATE_LATEST_VERSION_CODE",
  "VAULT_UPDATE_MINIMUM_VERSION_CODE",
  "VAULT_UPDATE_APK_URL",
  "VAULT_UPDATE_RELEASE_NOTES",
  "VAULT_UPDATE_MANDATORY",
];

function run(command, args, cwd, input) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    input,
    stdio: input === undefined ? "inherit" : ["pipe", "inherit", "inherit"],
  });

  if (result.error) throw result.error;

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed with exit code ${result.status}`,
    );
  }

  return result.stdout || "";
}

function readEnv() {
  if (!fs.existsSync(envPath)) {
    throw new Error(`Backend .env not found: ${envPath}`);
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  const values = {};

  for (const key of UPDATE_KEYS) {
    const pattern = new RegExp(`^\\s*(?:export\\s+)?${key}\\s*=`);

    const line = lines.find((item) => pattern.test(item));

    if (!line) continue;

    let value = line.replace(pattern, "").trim();

    if (value.startsWith('"') && value.endsWith('"')) {
      try {
        value = JSON.parse(value);
      } catch {
        value = value.slice(1, -1);
      }
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    } else {
      value = value.split(/\s+#/)[0].trim();
    }

    values[key] = value;
  }

  return { lines, values };
}

function writeEnv(values) {
  const { lines } = readEnv();
  const keys = Object.keys(values);
  const seen = new Set();

  const updated = lines.map((line) => {
    for (const key of keys) {
      const pattern = new RegExp(`^\\s*(?:export\\s+)?${key}\\s*=`);

      if (pattern.test(line)) {
        seen.add(key);
        return `${key}=${JSON.stringify(String(values[key]))}`;
      }
    }

    return line;
  });

  for (const key of keys) {
    if (!seen.has(key)) {
      updated.push(`${key}=${JSON.stringify(String(values[key]))}`);
    }
  }

  fs.writeFileSync(envPath, updated.join("\n").replace(/\n*$/, "\n"));
}

function getMetadata() {
  const config = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
  const expo = config.expo;

  if (
    !expo?.version ||
    !Number.isInteger(expo.android?.versionCode) ||
    expo.android.versionCode < 1
  ) {
    throw new Error(
      "Check expo.version and expo.android.versionCode in app.json",
    );
  }

  const { values: current } = readEnv();
  const versionCode = expo.android.versionCode;
  const mandatory = String(current.VAULT_UPDATE_MANDATORY ?? "").toLowerCase();

  if (!["true", "false"].includes(mandatory)) {
    throw new Error(
      "Set VAULT_UPDATE_MANDATORY to true or false in Backend/.env",
    );
  }

  return {
    VAULT_UPDATE_LATEST_VERSION: expo.version,
    VAULT_UPDATE_LATEST_VERSION_CODE: String(versionCode),

    // Every release requires users on older version codes to update.
    VAULT_UPDATE_MINIMUM_VERSION_CODE: String(versionCode),

    VAULT_UPDATE_APK_URL: apkUrl,
    VAULT_UPDATE_RELEASE_NOTES: `Vault Android release ${expo.version} (versionCode ${versionCode})`,
    VAULT_UPDATE_MANDATORY: mandatory,
  };
}

function syncMetadata() {
  const metadata = getMetadata();

  console.log("\nUpdating Backend/.env...");
  writeEnv(metadata);

  console.log("\nSyncing Vercel Production environment variables...");

  for (const [key, value] of Object.entries(metadata)) {
    console.log(`Updating ${key}...`);

    run(
      "npx",
      ["vercel", "env", "update", key, "production", "--yes"],
      backend,
      `${value}\n`,
    );
  }

  console.log("\nRedeploying Vault backend to Production...");
  run("npx", ["vercel", "--prod"], backend);

  console.log("\nMetadata sync and deployment completed.");
}

function main() {
  // Recovery mode: sync metadata without rebuilding or publishing.
  if (process.argv.includes("--sync-only")) {
    try {
      syncMetadata();
    } catch (error) {
      console.error("\nMetadata sync/deployment failed:", error.message);
      process.exitCode = 1;
    }

    return;
  }

  if (!fs.existsSync(appJsonPath)) {
    console.error(`app.json not found: ${appJsonPath}`);
    process.exitCode = 1;
    return;
  }

  const originalAppJson = fs.readFileSync(appJsonPath, "utf8");

  let version;
  let versionCode;

  try {
    const config = JSON.parse(originalAppJson);
    const expo = config.expo;
    const match = expo.version?.match(/^(\d+)\.(\d+)\.(\d+)$/);

    if (!match || !Number.isInteger(expo.android?.versionCode)) {
      throw new Error(
        "Invalid Expo version or Android versionCode in app.json",
      );
    }

    const [, major, minor, patch] = match;

    expo.version = `${major}.${minor}.${Number(patch) + 1}`;
    expo.android.versionCode += 1;

    version = expo.version;
    versionCode = expo.android.versionCode;

    if (!Number.isInteger(versionCode) || versionCode < 1) {
      throw new Error("Invalid new Android versionCode");
    }

    // Validate existing update policy before building.
    const { values: current } = readEnv();
    const mandatory = String(
      current.VAULT_UPDATE_MANDATORY ?? "",
    ).toLowerCase();

    if (!["true", "false"].includes(mandatory)) {
      throw new Error(
        "Set VAULT_UPDATE_MANDATORY to true or false in Backend/.env",
      );
    }

    fs.writeFileSync(appJsonPath, JSON.stringify(config, null, 2) + "\n");

    console.log(`\nBuilding Vault ${version}`);
    console.log(`Android versionCode: ${versionCode}`);
    console.log(`Minimum versionCode: ${versionCode}\n`);

    run(
      "npx",
      ["expo", "prebuild", "--platform", "android", "--no-install"],
      root,
    );

    run("./gradlew", ["assembleRelease"], androidDir);

    if (!fs.existsSync(apkPath) || fs.statSync(apkPath).size === 0) {
      throw new Error("APK is missing or empty after build");
    }

    console.log("\nAPK build successful!");
    console.log(`APK: ${apkPath}`);
  } catch (error) {
    fs.writeFileSync(appJsonPath, originalAppJson);

    console.error("\nBuild failed:", error.message);
    console.error("Restored the original app.json.");

    process.exitCode = 1;
    return;
  }

  const tag = `v${version}`;
  const notes =
    `Vault Android release ${version}\n\n` +
    `Android versionCode: ${versionCode}\n` +
    `Minimum versionCode: ${versionCode}`;

  try {
    console.log(`\nPublishing GitHub Release ${tag}...`);

    run(
      "gh",
      [
        "release",
        "create",
        tag,
        apkPath,
        "--repo",
        repo,
        "--title",
        `Vault ${version}`,
        "--notes",
        notes,
      ],
      root,
    );

    console.log(
      `\nGitHub release created: https://github.com/${repo}/releases/tag/${tag}`,
    );
  } catch (error) {
    console.error("\nAPK built, but GitHub release publishing failed.");
    console.error(error.message);
    console.error("The new app version and APK have been preserved.");
    process.exitCode = 1;
    return;
  }

  try {
    syncMetadata();
  } catch (error) {
    console.error(
      "\nGitHub release exists, but metadata sync/deployment failed.",
    );
    console.error(error.message);
    console.error("After fixing the issue, run: npm run sync:release");
    process.exitCode = 1;
  }
}

main();
