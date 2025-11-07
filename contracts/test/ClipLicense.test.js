const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("ClipLicense", function () {
  async function deployContractsFixture() {
    const [owner, creator, buyer, collaborator1, collaborator2, platform] = await ethers.getSigners();

    // Deploy MockUSX
    const MockUSX = await ethers.getContractFactory("MockUSX");
    const mockUSX = await MockUSX.deploy(18);
    await mockUSX.waitForDeployment();

    // Deploy ClipLicense
    const ClipLicense = await ethers.getContractFactory("ClipLicense");
    const clipLicense = await ClipLicense.deploy(await mockUSX.getAddress(), platform.address, 100); // 1% platform fee
    await clipLicense.waitForDeployment();

    // Mint some USX to buyer for testing
    const amount = ethers.parseEther("1000");
    await mockUSX.mint(buyer.address, amount);

    return { 
      mockUSX, 
      clipLicense, 
      owner, 
      creator, 
      buyer, 
      collaborator1, 
      collaborator2, 
      platform 
    };
  }

  describe("Deployment", function () {
    it("Should set the right USX token address", async function () {
      const { mockUSX, clipLicense } = await loadFixture(deployContractsFixture);
      expect(await clipLicense.usx()).to.equal(await mockUSX.getAddress());
    });

    it("Should set the right platform fee recipient and BPS", async function () {
      const { clipLicense, platform } = await loadFixture(deployContractsFixture);
      expect(await clipLicense.platformAddress()).to.equal(platform.address);
      expect(await clipLicense.platformFeeBps()).to.equal(100);
    });
  });

  describe("Clip Creation", function () {
    it("Should allow creator to create a clip", async function () {
      const { clipLicense, creator } = await loadFixture(deployContractsFixture);
      
      const assetCID = "QmTestAssetCID123";
      const price = ethers.parseEther("1");
      const durationDays = 7;
      const splits = [];
      const splitBps = [];

      await expect(
        clipLicense.connect(creator).createClip(assetCID, price, durationDays, splits, splitBps)
      ).to.emit(clipLicense, "ClipCreated");
    });

    it("Should not allow creating clip with zero price", async function () {
      const { clipLicense, creator } = await loadFixture(deployContractsFixture);
      
      const assetCID = "QmTestAssetCID123";
      const price = 0;
      const durationDays = 7;
      const splits = [];
      const splitBps = [];

      await expect(
        clipLicense.connect(creator).createClip(assetCID, price, durationDays, splits, splitBps)
      ).to.be.revertedWith("Price must be positive");
    });

    it("Should not allow creating clip with empty asset CID", async function () {
      const { clipLicense, creator } = await loadFixture(deployContractsFixture);
      
      const assetCID = "";
      const price = ethers.parseEther("1");
      const durationDays = 7;
      const splits = [];
      const splitBps = [];

      await expect(
        clipLicense.connect(creator).createClip(assetCID, price, durationDays, splits, splitBps)
      ).to.be.revertedWith("Asset CID required");
    });
  });

  describe("License Purchase", function () {
    it("Should allow buyer to purchase license", async function () {
      const { mockUSX, clipLicense, creator, buyer } = await loadFixture(deployContractsFixture);
      
      // Create a clip
      const assetCID = "QmTestAssetCID123";
      const price = ethers.parseEther("1");
      const durationDays = 7;
      const splits = [];
      const splitBps = [];

      await clipLicense.connect(creator).createClip(assetCID, price, durationDays, splits, splitBps);

      // Approve USX spending
      await mockUSX.connect(buyer).approve(await clipLicense.getAddress(), price);

      // Purchase license
      await expect(
        clipLicense.connect(buyer).buyLicense(1)
      ).to.emit(clipLicense, "LicensePurchased");
    });

    it("Should distribute funds correctly with splits", async function () {
      const { mockUSX, clipLicense, creator, buyer, collaborator1, collaborator2, platform } = await loadFixture(deployContractsFixture);
      
      // Create a clip with splits
      const assetCID = "QmTestAssetCID123";
      const price = ethers.parseEther("1");
      const durationDays = 7;
      const splits = [collaborator1.address, collaborator2.address];
      const splitBps = [3000, 2000]; // 30% and 20%

      await clipLicense.connect(creator).createClip(assetCID, price, durationDays, splits, splitBps);

      // Get initial balances
      const initialCreatorBalance = await mockUSX.balanceOf(creator.address);
      const initialCollaborator1Balance = await mockUSX.balanceOf(collaborator1.address);
      const initialCollaborator2Balance = await mockUSX.balanceOf(collaborator2.address);
      const initialPlatformBalance = await mockUSX.balanceOf(platform.address);

      // Approve and purchase
      await mockUSX.connect(buyer).approve(await clipLicense.getAddress(), price);
      await clipLicense.connect(buyer).buyLicense(1);

      // Check final balances
      const platformFee = price * 100n / 10000n; // 1% platform fee
      const remaining = price - platformFee;
      const collaborator1Share = remaining * 3000n / 5000n;
      const collaborator2Share = remaining * 2000n / 5000n;
      const creatorShare = remaining - collaborator1Share - collaborator2Share;

      expect(await mockUSX.balanceOf(creator.address)).to.equal(initialCreatorBalance + creatorShare);
      expect(await mockUSX.balanceOf(collaborator1.address)).to.equal(initialCollaborator1Balance + collaborator1Share);
      expect(await mockUSX.balanceOf(collaborator2.address)).to.equal(initialCollaborator2Balance + collaborator2Share);
      expect(await mockUSX.balanceOf(platform.address)).to.equal(initialPlatformBalance + platformFee);
    });

    it("Should not allow purchasing inactive clip", async function () {
      const { mockUSX, clipLicense, creator, buyer } = await loadFixture(deployContractsFixture);
      
      // Create a clip
      const assetCID = "QmTestAssetCID123";
      const price = ethers.parseEther("1");
      const durationDays = 7;
      const splits = [];
      const splitBps = [];

      await clipLicense.connect(creator).createClip(assetCID, price, durationDays, splits, splitBps);

      // Deactivate clip
      await clipLicense.connect(creator).toggleClip(1, false);

      // Approve USX spending
      await mockUSX.connect(buyer).approve(await clipLicense.getAddress(), price);

      // Try to purchase - should fail
      await expect(
        clipLicense.connect(buyer).buyLicense(1)
      ).to.be.revertedWith("Clip inactive");
    });
  });

  describe("Gasless Purchase", function () {
    it("Should allow gasless purchase via relayer", async function () {
      const { mockUSX, clipLicense, creator, buyer } = await loadFixture(deployContractsFixture);
      
      // Create a clip
      const assetCID = "QmTestAssetCID123";
      const price = ethers.parseEther("1");
      const durationDays = 7;
      const splits = [];
      const splitBps = [];

      await clipLicense.connect(creator).createClip(assetCID, price, durationDays, splits, splitBps);

      // Approve USX spending
      await mockUSX.connect(buyer).approve(await clipLicense.getAddress(), price);

      // Get nonce
      const nonce = await clipLicense.nonces(buyer.address);
      const deadline = Math.floor(Date.now() / 1000) + 600; // 10 minutes from now

      // Sign the purchase intent
      const domain = {
        name: "Rightly ClipLicense",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await clipLicense.getAddress()
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
        clipId: 1,
        buyer: buyer.address,
        price: price,
        nonce: nonce,
        deadline: deadline
      };

      const signature = await buyer.signTypedData(domain, types, value);

      // Execute gasless purchase (relayer calls this)
      await expect(
        clipLicense.buyLicenseFor(
          value.clipId,
          value.buyer,
          value.price,
          value.nonce,
          value.deadline,
          signature
        )
      ).to.emit(clipLicense, "LicensePurchased");
    });
  });

  describe("Access Control", function () {
    it("Should allow only creator or owner to update clip", async function () {
      const { clipLicense, creator, buyer } = await loadFixture(deployContractsFixture);
      
      // Create a clip
      const assetCID = "QmTestAssetCID123";
      const price = ethers.parseEther("1");
      const durationDays = 7;
      const splits = [];
      const splitBps = [];

      await clipLicense.connect(creator).createClip(assetCID, price, durationDays, splits, splitBps);

      // Try to update as non-creator - should fail
      await expect(
        clipLicense.connect(buyer).updateClip(1, "newCID", price, durationDays)
      ).to.be.revertedWith("Not authorized");

      // Update as creator - should succeed
      await expect(
        clipLicense.connect(creator).updateClip(1, "newCID", price, durationDays)
      ).to.emit(clipLicense, "ClipUpdated");
    });

    it("Should allow owner to update platform settings", async function () {
      const { clipLicense, owner, buyer } = await loadFixture(deployContractsFixture);
      
      const newPlatform = buyer.address;
      const newBps = 200;

      // Try as non-owner - should fail
      await expect(
        clipLicense.connect(buyer).setPlatform(newPlatform, newBps)
      ).to.be.reverted;

      // Update as owner - should succeed
      await clipLicense.connect(owner).setPlatform(newPlatform, newBps);
      
      expect(await clipLicense.platformAddress()).to.equal(newPlatform);
      expect(await clipLicense.platformFeeBps()).to.equal(newBps);
    });
  });
});