const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [relayer, buyer] = await ethers.getSigners();
  
  console.log("Relayer account:", relayer.address);
  console.log("Buyer account:", buyer.address);
  
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
  console.log("Price:", ethers.formatEther(clip.price), "USX");

  // Check buyer's USX balance and approve if needed
  const buyerBalance = await mockUSX.balanceOf(buyer.address);
  if (buyerBalance < clip.price) {
    console.log("Insufficient USX balance. Using faucet...");
    const faucetAmount = clip.price * 2n;
    const faucetTx = await mockUSX.connect(buyer).faucet(buyer.address, faucetAmount);
    await faucetTx.wait();
  }

  // Buyer approves USX spending
  console.log("Buyer approving USX spending...");
  const approveTx = await mockUSX.connect(buyer).approve(clipLicenseAddress, clip.price);
  await approveTx.wait();

  // Get nonce for the buyer
  const nonce = await clipLicense.nonces(buyer.address);
  const deadline = Math.floor(Date.now() / 1000) + 600; // 10 minutes from now

  // Prepare EIP-712 signature data
  const domain = {
    name: "Rightly ClipLicense",
    version: "1",
    chainId: (await ethers.provider.getNetwork()).chainId,
    verifyingContract: clipLicenseAddress
  };

  const types = {
    BuyIntent: [
      { name: "clipId", type: "uint256" },
      { name: "buyer", type: "address" },
      { name: "price", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ]
  };

  const value = {
    clipId: clipId,
    buyer: buyer.address,
    price: clip.price,
    nonce: nonce,
    deadline: deadline
  };

  console.log("\nSigning EIP-712 message...");
  console.log("Message:", value);

  // Buyer signs the message
  const signature = await buyer.signTypedData(domain, types, value);
  console.log("Signature:", signature);

  // Relayer submits the transaction
  console.log("\nRelayer submitting gasless purchase...");
  const gaslessTx = await clipLicense.connect(relayer).buyLicenseFor(
    value.clipId,
    value.buyer,
    value.price,
    value.nonce,
    value.deadline,
    signature
  );

  console.log("Gasless purchase transaction sent:", gaslessTx.hash);

  const receipt = await gaslessTx.wait();
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
    console.log("\n✅ Gasless purchase completed successfully!");
    console.log("License ID:", parsedEvent.args.licenseId.toString());
    console.log("Buyer:", parsedEvent.args.buyer);
  }

  // Verify nonce was incremented
  const newNonce = await clipLicense.nonces(buyer.address);
  console.log("Nonce updated from", nonce.toString(), "to", newNonce.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });