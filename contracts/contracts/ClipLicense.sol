// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ClipLicense is Ownable, ReentrancyGuard, EIP712 {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    IERC20 public immutable usx;
    address public platformAddress;
    uint16 public platformFeeBps;

    uint256 public nextClipId;

    struct Clip {
        address creator;
        string assetCID;
        uint256 price;
        uint32 durationDays;
        address[] splits;
        uint16[] splitBps;
        bool active;
    }

    mapping(uint256 => Clip) public clips;
    mapping(address => uint256) public nonces;

    event ClipCreated(uint256 indexed clipId, address indexed creator, uint256 price, uint32 durationDays, string assetCID);
    event ClipUpdated(uint256 indexed clipId, address indexed editor);
    event ClipToggled(uint256 indexed clipId, bool active);
    event LicensePurchased(uint256 indexed licenseId, uint256 indexed clipId, address indexed buyer, uint256 startTs, uint256 expiryTs, uint256 amount, bytes32 receiptHash);

    bytes32 private constant BUY_TYPEHASH = keccak256("BuyIntent(uint256 clipId,address buyer,uint256 price,uint256 nonce,uint256 deadline)");

    constructor(address _usx, address _platform, uint16 _platformFeeBps) 
        EIP712("Rightly ClipLicense", "1") {
        require(_usx != address(0), "USX token zero address");
        usx = IERC20(_usx);
        platformAddress = _platform;
        platformFeeBps = _platformFeeBps;
        nextClipId = 1;
    }

    function createClip(
        string calldata assetCID,
        uint256 price,
        uint32 durationDays,
        address[] calldata splits,
        uint16[] calldata splitBps
    ) external returns (uint256 clipId) {
        require(bytes(assetCID).length > 0, "Asset CID required");
        require(price > 0, "Price must be positive");
        require(splits.length == splitBps.length, "Splits length mismatch");

        uint256 totalBps;
        for (uint i = 0; i < splitBps.length; i++) {
            totalBps += splitBps[i];
        }
        require(totalBps <= 10000, "Split basis points overflow");

        clipId = nextClipId++;
        Clip storage c = clips[clipId];
        c.creator = msg.sender;
        c.assetCID = assetCID;
        c.price = price;
        c.durationDays = durationDays;
        c.splits = splits;
        c.splitBps = splitBps;
        c.active = true;

        emit ClipCreated(clipId, msg.sender, price, durationDays, assetCID);
    }

    function updateClip(
        uint256 clipId,
        string calldata assetCID,
        uint256 price,
        uint32 durationDays
    ) external {
        Clip storage c = clips[clipId];
        require(c.creator == msg.sender || owner() == msg.sender, "Not authorized");
        c.assetCID = assetCID;
        c.price = price;
        c.durationDays = durationDays;
        emit ClipUpdated(clipId, msg.sender);
    }

    function toggleClip(uint256 clipId, bool active) external {
        Clip storage c = clips[clipId];
        require(c.creator == msg.sender || owner() == msg.sender, "Not authorized");
        c.active = active;
        emit ClipToggled(clipId, active);
    }

    function setPlatform(address _addr, uint16 _bps) external onlyOwner {
        platformAddress = _addr;
        platformFeeBps = _bps;
    }

    function buyLicense(uint256 clipId) external nonReentrant returns (bytes32) {
        return _executePurchase(clipId, msg.sender);
    }

    function buyLicenseFor(
        uint256 clipId,
        address buyer,
        uint256 price,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external nonReentrant returns (bytes32) {
        require(block.timestamp <= deadline, "Intent expired");
        
        bytes32 structHash = keccak256(abi.encode(BUY_TYPEHASH, clipId, buyer, price, nonce, deadline));
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(hash, signature);
        
        require(signer == buyer, "Invalid signature");
        require(nonce == nonces[buyer], "Nonce mismatch");
        nonces[buyer]++;

        return _executePurchase(clipId, buyer);
    }

    function _executePurchase(uint256 clipId, address buyer) internal returns (bytes32) {
        Clip storage c = clips[clipId];
        require(c.active, "Clip inactive");
        uint256 amount = c.price;
        require(amount > 0, "Invalid price");

        usx.safeTransferFrom(buyer, address(this), amount);

        uint256 platformFee = (amount * platformFeeBps) / 10000;
        uint256 remainder = amount - platformFee;

        uint256 paid = 0;
        uint256 totalSplitBps;
        for (uint i = 0; i < c.splitBps.length; i++) {
            totalSplitBps += c.splitBps[i];
        }
        
        if (totalSplitBps > 0) {
            for (uint i = 0; i < c.splits.length; i++) {
                uint256 share = (remainder * c.splitBps[i]) / totalSplitBps;
                if (share > 0) {
                    usx.safeTransfer(c.splits[i], share);
                    paid += share;
                }
            }
        }

        uint256 creatorShare = remainder - paid;
        if (creatorShare > 0) {
            usx.safeTransfer(c.creator, creatorShare);
        }

        if (platformFee > 0 && platformAddress != address(0)) {
            usx.safeTransfer(platformAddress, platformFee);
        }

        uint256 startTs = block.timestamp;
        uint256 expiryTs = startTs + (uint256(c.durationDays) * 1 days);
        bytes32 receiptHash = keccak256(abi.encodePacked(clipId, buyer, startTs, expiryTs, amount, block.number));

        uint256 licenseId = uint256(receiptHash);
        emit LicensePurchased(licenseId, clipId, buyer, startTs, expiryTs, amount, receiptHash);
        return receiptHash;
    }

    function getNonce(address account) external view returns (uint256) {
        return nonces[account];
    }
}
