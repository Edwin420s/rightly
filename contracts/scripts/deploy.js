const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy MockUSX first
  console.log("\nDeploying MockUSX...");
  const MockUSX = await ethers.getContractFactory("MockUSX");
  const mockUSX = await MockUSX.deploy(18); // 18 decimals
  await mockUSX.waitForDeployment();
  const mockUSXAddress = await mockUSX.getAddress();
  console.log("MockUSX deployed to:", mockUSXAddress);

  // Deploy ClipLicense
  console.log("\nDeploying ClipLicense...");
  const platformFeeRecipient = deployer.address; // Use deployer as platform fee recipient for testing
  const platformFeeBps = 100; // 1% platform fee
  
  const ClipLicense = await ethers.getContractFactory("ClipLicense");
  const clipLicense = await ClipLicense.deploy(mockUSXAddress, platformFeeRecipient, platformFeeBps);
  await clipLicense.waitForDeployment();
  const clipLicenseAddress = await clipLicense.getAddress();
  console.log("ClipLicense deployed to:", clipLicenseAddress);

  // Save deployment addresses to a file
  const deploymentInfo = {
    network: network.name,
    timestamp: new Date().toISOString(),
    contracts: {
      MockUSX: mockUSXAddress,
      ClipLicense: clipLicenseAddress
    },
    deployer: deployer.address
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `deployment-${network.name}-${Date.now()}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\nDeployment information saved to:", deploymentFile);
  console.log("\nDeployment completed successfully!");

  // Log some useful information
  console.log("\n=== Deployment Summary ===");
  console.log("MockUSX Address:", mockUSXAddress);
  console.log("ClipLicense Address:", clipLicenseAddress);
  console.log("Platform Fee Recipient:", platformFeeRecipient);
  console.log("Platform Fee BPS:", platformFeeBps);
  console.log("Deployer:", deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });