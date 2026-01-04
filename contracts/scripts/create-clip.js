const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer, creator] = await ethers.getSigners();
  
  console.log("Creating clip with account:", creator.address);
  
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

  // Clip creation parameters
  const assetCID = "QmXQY6VwG8z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8";
  const price = ethers.parseEther("1"); // 1 USX
  const durationDays = 7;
  const splits = []; // No collaborators for this example
  const splitBps = [];

  console.log("\nCreating clip...");
  console.log("Asset CID:", assetCID);
  console.log("Price:", ethers.formatEther(price), "USX");
  console.log("Duration:", durationDays, "days");

  const tx = await clipLicense.connect(creator).createClip(
    assetCID,
    price,
    durationDays,
    splits,
    splitBps
  );

  console.log("Transaction sent:", tx.hash);
  
  const receipt = await tx.wait();
  console.log("Transaction confirmed in block:", receipt.blockNumber);

  // Get the clip ID from the event
  const event = receipt.logs.find(log => {
    try {
      const parsedLog = clipLicense.interface.parseLog(log);
      return parsedLog && parsedLog.name === "ClipCreated";
    } catch {
      return false;
    }
  });

  if (event) {
    const parsedEvent = clipLicense.interface.parseLog(event);
    const clipId = parsedEvent.args.clipId;
    console.log("\n✅ Clip created successfully!");
    console.log("Clip ID:", clipId.toString());
    
    // Verify clip data
    const clip = await clipLicense.clips(clipId);
    console.log("\nClip details:");
    console.log("Creator:", clip.creator);
    console.log("Asset CID:", clip.assetCID);
    console.log("Price:", ethers.formatEther(clip.price), "USX");
    console.log("Duration:", clip.durationDays, "days");
    console.log("Active:", clip.active);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
