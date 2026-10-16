#!/usr/bin/env node
/*
 * Validates the shipped arm64 Android APK and writes a stable JSON report for
 * CI. It compares byte size to the approved baseline but does not claim that
 * an APK byte size equals a device-specific Play download size.
 */
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const [apkPathArgument, budgetPathArgument, outputPathArgument] = process.argv.slice(2);
if (!apkPathArgument || !budgetPathArgument || !outputPathArgument) {
  throw new Error(
    "Usage: check-android-release-artifact.cjs <apk-path> <budget-json> <output-json>",
  );
}

const apkPath = path.resolve(apkPathArgument);
const budgetPath = path.resolve(budgetPathArgument);
const outputPath = path.resolve(outputPathArgument);
if (!fs.existsSync(apkPath) || fs.statSync(apkPath).size === 0) {
  throw new Error(`APK not found or empty: ${apkPath}`);
}
const budget = JSON.parse(fs.readFileSync(budgetPath, "utf8"));
for (const key of ["baselineBytes", "maxGrowthPercent", "absoluteMaxBytes"]) {
  if (!Number.isFinite(budget[key]) || budget[key] <= 0) {
    throw new Error(`Invalid Android size budget field: ${key}`);
  }
}

function command(commandName, argumentsList) {
  return execFileSync(commandName, argumentsList, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

const aapt = process.env.AAPT;
const apksigner = process.env.APKSIGNER;
if (!aapt || !apksigner) {
  throw new Error("AAPT and APKSIGNER environment variables are required.");
}

const badging = command(aapt, ["dump", "badging", apkPath]);
const archiveEntries = command("unzip", ["-Z1", apkPath]);
const signing = command(apksigner, ["verify", "--verbose", "--print-certs", apkPath]);

const packageMatch = badging.match(/package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'/);
if (!packageMatch || packageMatch[1] !== "com.narqa.ebos") {
  throw new Error("APK package ID must be com.narqa.ebos.");
}
if (!/native-code: 'arm64-v8a'/.test(badging)) {
  throw new Error("Distribution APK must contain only the arm64-v8a ABI.");
}
if (!archiveEntries.split("\n").includes("assets/index.android.bundle")) {
  throw new Error("APK does not contain assets/index.android.bundle.");
}
if (!/Verified using v2 scheme \(APK Signature Scheme v2\): true/.test(signing)) {
  throw new Error("APK v2 signature verification failed.");
}

const prohibitedPermissions = [
  "android.permission.WRITE_CONTACTS",
  "android.permission.READ_SMS",
  "android.permission.RECEIVE_SMS",
  "android.permission.READ_EXTERNAL_STORAGE",
  "android.permission.WRITE_EXTERNAL_STORAGE",
  "android.permission.SYSTEM_ALERT_WINDOW",
  "android.permission.USE_BIOMETRIC",
  "android.permission.USE_FINGERPRINT",
];
for (const permission of prohibitedPermissions) {
  if (badging.includes(`uses-permission: name='${permission}'`)) {
    throw new Error(`Prohibited permission found in final APK manifest: ${permission}`);
  }
}

const bytes = fs.statSync(apkPath).size;
const growthPercent = ((bytes - budget.baselineBytes) / budget.baselineBytes) * 100;
const report = {
  schemaVersion: 1,
  artifact: path.basename(apkPath),
  bytes,
  baselineBytes: budget.baselineBytes,
  growthPercent: Number(growthPercent.toFixed(2)),
  maxGrowthPercent: budget.maxGrowthPercent,
  absoluteMaxBytes: budget.absoluteMaxBytes,
  packageName: packageMatch[1],
  versionCode: packageMatch[2],
  versionName: packageMatch[3],
  abi: "arm64-v8a",
  embeddedBundle: true,
  apkV2SignatureVerified: true,
  prohibitedPermissionsChecked: prohibitedPermissions,
  generatedAt: new Date().toISOString(),
};
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));

if (bytes > budget.absoluteMaxBytes) {
  throw new Error(
    `APK size ${bytes} exceeds absolute budget ${budget.absoluteMaxBytes} bytes.`,
  );
}
if (growthPercent > budget.maxGrowthPercent) {
  throw new Error(
    `APK grew ${growthPercent.toFixed(2)}%, exceeding ${budget.maxGrowthPercent}% over baseline.`,
  );
}
