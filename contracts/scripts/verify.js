const { run } = require("hardhat");

async function verify(contractAddress, constructorArguments) {
  console.log(`Verifying contract at ${contractAddress}...`);
  
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArguments,
    });
    console.log("Contract verified successfully!");
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("Contract already verified!");
    } else {
      console.error("Verification failed:", error);
    }
  }
}

async function main() {
  // These values should be updated with your actual deployment addresses and constructor arguments
  const mockUSXAddress = "YOUR_MOCK_USX_ADDRESS";
  const clipLicenseAddress = "YOUR_CLIP_LICENSE_ADDRESS";
  const platformFeeRecipient = "YOUR_PLATFORM_FEE_RECIPIENT";
  const platformFeeBps = 100;

  console.log("Starting contract verification...");

  // Verify MockUSX
  await verify(mockUSXAddress, [18]);

  // Verify ClipLicense
  await verify(clipLicenseAddress, [mockUSXAddress, platformFeeRecipient, platformFeeBps]);

  console.log("All contracts verified!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });