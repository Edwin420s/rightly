const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer, buyer] = await ethers.getSigners();
  
  console.log("Purchasing license with account:", buyer.address);
  
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
  const mockUSXAddress = deploymentInfo.contracts.MockUSX;
  
  const clipLicense = await ethers.getContractAt("ClipLicense", clipLicenseAddress);
  const mockUSX = await ethers.getContractAt("MockUSX", mockUSXAddress);

  const clipId = 1; // Assuming we're purchasing clip with ID 1
  
  // Get clip details
  const clip = await clipLicense.clips(clipId);
  if (clip.creator === ethers.ZeroAddress) {
    throw new Error(`Clip with ID ${clipId} does not exist`);
  }

  console.log("\nClip details:");
  console.log("Creator:", clip.creator);
  console.log("Price:", ethers.formatEther(clip.price), "USX");
  console.log("Duration:", clip.durationDays, "days");
  console.log("Active:", clip.active);

  if (!clip.active) {
    throw new Error("Clip is not active");
  }

  // Check buyer's USX balance
  const buyerBalance = await mockUSX.balanceOf(buyer.address);
  console.log("\nBuyer USX balance:", ethers.formatEther(buyerBalance), "USX");

  if (buyerBalance < clip.price) {
    // Use faucet to get USX if needed
    console.log("Insufficient USX balance. Using faucet...");
    const faucetAmount = clip.price * 2n; // Get double the needed amount
    const faucetTx = await mockUSX.connect(buyer).faucet(buyer.address, faucetAmount);
    await faucetTx.wait();
    console.log("Faucet transaction:", faucetTx.hash);
  }

  // Approve USX spending
  console.log("\nApproving USX spending...");
  const approveTx = await mockUSX.connect(buyer).approve(clipLicenseAddress, clip.price);
  await approveTx.wait();
  console.log("Approval transaction:", approveTx.hash);

  // Purchase license
  console.log("\nPurchasing license...");
  const purchaseTx = await clipLicense.connect(buyer).buyLicense(clipId);
  console.log("Purchase transaction sent:", purchaseTx.hash);

  const receipt = await purchaseTx.wait();
  console.log("Transaction confirmed in block:", receipt.blockNumber);

  // Get the license purchase event
  const event = receipt.logs.find(log => {
    try {
      const parsedLog = clipLicense.interface.parseLog(log);
      return parsedLog && parsedLog.name === "LicensePurchased";
    } catch {
      return false;
    }
  });

  if (event) {
    const parsedEvent = clipLicense.interface.parseLog(event);
    console.log("\n✅ License purchased successfully!");
    console.log("License ID:", parsedEvent.args.licenseId.toString());
    console.log("Buyer:", parsedEvent.args.buyer);
    console.log("Start Timestamp:", new Date(Number(parsedEvent.args.startTs) * 1000).toISOString());
    console.log("Expiry Timestamp:", new Date(Number(parsedEvent.args.expiryTs) * 1000).toISOString());
    console.log("Amount:", ethers.formatEther(parsedEvent.args.amount), "USX");
    console.log("Receipt Hash:", parsedEvent.args.receiptHash);
  }

  // Verify final balances
  const finalBalance = await mockUSX.balanceOf(buyer.address);
  console.log("\nFinal buyer USX balance:", ethers.formatEther(finalBalance), "USX");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });