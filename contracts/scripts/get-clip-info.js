const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const clipId = process.argv[2] || 1;
  
  console.log(`Getting info for clip ID: ${clipId}`);
  
  // Load deployment info 
  const deploymentsDir = path.join(__dirname, "../deployments");
  const deploymentFiles = fs.readdirSync(deploymentsDir);
  const latestDeployment = deploymentFiles
    .filter(f => f.startsWith('deployment-') && f.endsWith('.json'))
    .sort()
    .pop();
  
  if (!latestDeployment) {
    throw new Error("No deployment file found. Please deploy contracts first.");
  }
  
  const deploymentInfo = JSON.parse(
    fs.readFileSync(path.join(deploymentsDir, latestDeployment), 'utf8')
  );

  const clipLicenseAddress = deploymentInfo.contracts.ClipLicense;
  const clipLicense = await ethers.getContractAt("ClipLicense", clipLicenseAddress);

  // Get clip details
  const clip = await clipLicense.clips(clipId);
  
  if (clip.creator === ethers.ZeroAddress) {
    console.log(`❌ Clip with ID ${clipId} does not exist`);
    return;
  }

  console.log("\n📋 Clip Information:");
  console.log("====================");
  console.log("Clip ID:", clipId);
  console.log("Creator:", clip.creator);
  console.log("Asset CID:", clip.assetCID);
  console.log("Price:", ethers.formatEther(clip.price), "USX");
  console.log("Duration:", clip.durationDays, "days");
  console.log("Active:", clip.active);
  
  console.log("\n👥 Splits:");
  if (clip.splits.length === 0) {
    console.log("No splits configured");
  } else {
    for (let i = 0; i < clip.splits.length; i++) {
      console.log(`  ${clip.splits[i]}: ${clip.splitBps[i] / 100}%`);
    }
  }

  // Get contract info
  console.log("\n📊 Contract Info:");
  console.log("Platform Address:", await clipLicense.platformAddress());
  console.log("Platform Fee BPS:", await clipLicense.platformFeeBps());
  console.log("USX Token:", await clipLicense.usx());
  console.log("Next Clip ID:", (await clipLicense.nextClipId()).toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
