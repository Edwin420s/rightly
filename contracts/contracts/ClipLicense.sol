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
    event LicensePurchased(uint256 indexed licenseId, uint256 indexed clipId, address indexed buyer, uint256 startTs, uint256 expiryTs, uint256 amount, bytes32 receiptHash);

    bytes32 private constant BUY_TYPEHASH = keccak256("BuyIntent(uint256 clipId,address buyer,uint256 price,uint256 nonce,uint256 deadline)");

    constructor(address _usx, address _platform, uint16 _platformFeeBps) 
        EIP712("Rightly ClipLicense", "1") {
        usx = IERC20(_usx);
        platformAddress = _platform;
        platformFeeBps = _platformFeeBps;
    }

    function createClip(
        string calldata assetCID,
        uint256 price,
        uint32 durationDays,
        address[] calldata splits,
        uint16[] calldata splitBps
    ) external returns (uint256 clipId) {
        require(bytes(assetCID).length > 0, "assetCID required");
        require(price > 0, "price must be > 0");
        require(splits.length == splitBps.length, "splits length mismatch");

        uint256 totalBps;
        for (uint i = 0; i < splitBps.length; i++) {
            totalBps += splitBps[i];
        }
        require(totalBps <= 10000, "splits exceed 100%");

        clipId = nextClipId++;
        clips[clipId] = Clip({
            creator: msg.sender,
            assetCID: assetCID,
            price: price,
            durationDays: durationDays,
            splits: splits,
            splitBps: splitBps,
            active: true
        });

        emit ClipCreated(clipId, msg.sender, price, durationDays, assetCID);
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
        require(block.timestamp <= deadline, "signature expired");
        require(nonce == nonces[buyer], "invalid nonce");

        bytes32 structHash = keccak256(abi.encode(BUY_TYPEHASH, clipId, buyer, price, nonce, deadline));
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(hash, signature);
        require(signer == buyer, "invalid signature");

        nonces[buyer]++;
        return _executePurchase(clipId, buyer);
    }

    function _executePurchase(uint256 clipId, address buyer) internal returns (bytes32) {
        Clip storage clip = clips[clipId];
        require(clip.active, "clip not active");
        require(clip.price > 0, "invalid price");

        usx.safeTransferFrom(buyer, address(this), clip.price);

        uint256 platformFee = (clip.price * platformFeeBps) / 10000;
        uint256 remainder = clip.price - platformFee;

        if (clip.splits.length > 0) {
            uint256 totalPaid;
            for (uint i = 0; i < clip.splits.length; i++) {
                uint256 share = (remainder * clip.splitBps[i]) / 10000;
                usx.safeTransfer(clip.splits[i], share);
                totalPaid += share;
            }
            uint256 creatorShare = remainder - totalPaid;
            if (creatorShare > 0) {
                usx.safeTransfer(clip.creator, creatorShare);
            }
        } else {
            usx.safeTransfer(clip.creator, remainder);
        }

        if (platformFee > 0) {
            usx.safeTransfer(platformAddress, platformFee);
        }

        uint256 startTs = block.timestamp;
        uint256 expiryTs = startTs + (clip.durationDays * 1 days);
        bytes32 receiptHash = keccak256(abi.encodePacked(clipId, buyer, startTs, expiryTs, clip.price));

        emit LicensePurchased(uint256(receiptHash), clipId, buyer, startTs, expiryTs, clip.price, receiptHash);
        return receiptHash;
    }

    function setPlatform(address _platform, uint16 _bps) external onlyOwner {
        platformAddress = _platform;
        platformFeeBps = _bps;
    }
}