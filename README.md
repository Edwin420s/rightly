# Rightly — On‑chain Micro‑Licensing for Short‑Form Content

Rightly is an on‑chain marketplace that lets creators sell short, time‑bounded licenses (e.g., 1–7 days) for clips, loops, beats, and short videos. Buyers get verifiable proof of license on Scroll; creators receive instant settlement in USX with automatic collaborator splits.

Built for Scroll zkEVM with wallet‑based login (Core/MetaMask), gasless checkout (EIP‑712 intent + relayer), and IPFS‑pinned signed receipts.


## Highlights
- **On‑chain first**: Purchases emit `LicensePurchased` with timestamps and amount.
- **USX settlement + auto‑splits**: Funds split on purchase (creator, collaborators, platform fee).
- **Gasless UX (optional)**: Buyers sign EIP‑712 BuyIntent; relayer submits the tx.
- **Wallet = identity**: Core Wallet/MetaMask; no email/password.
- **Receipts on IPFS**: Canonical signed JSON receipts, pinned and retrievable.


## Repository Structure
- `contracts/` — Solidity smart contracts (Hardhat)
- `backend/` — Node.js/Express API, MongoDB models, BullMQ workers (relayer + indexer)
- `frontend/` — React (Vite) + Tailwind app


## Smart Contracts
- `ClipLicense.sol`
  - `createClip(assetCID, price, durationDays, splits, splitBps)`
  - `buyLicense(clipId)` — direct buyer call
  - `buyLicenseFor(clipId, buyer, price, nonce, deadline, signature)` — relayer path (EIP‑712)
  - Events: `ClipCreated`, `LicensePurchased`
  - `nonces(address)` for replay protection; EIP‑712 domain: `Rightly ClipLicense` v1
- `MockUSX.sol` — test ERC‑20 with faucet/mint for local/testnet

Hardhat networks preconfigured for Scroll Sepolia and Scroll mainnet.


## Backend
- Express routes
  - `POST /api/clips`, `GET /api/clips`, `GET /api/clips/:id`
  - `POST /api/auth/nonce` — returns current nonce
  - `POST /api/relayer/buy` — verifies typed data and enqueues `buyLicenseFor`
  - `GET /api/receipts/:licenseId` — fetch stored receipt with IPFS CID
- Services
  - `services/contract.js` — provider, relayer wallet, contract instance (ABI aligned)
  - `workers/relayerWorker.js` — submits `buyLicenseFor`
  - `workers/indexerWorker.js` — listens to `LicensePurchased`; signs + pins receipt JSON to IPFS; stores Mongo reference
  - `services/ipfs.js` — Pinata integration (falls back to mock CIDs if not configured)
- Database: MongoDB (`Clip`, `Receipt`, `Nonce` models)
- Queue: BullMQ (Redis/Upstash)


## Frontend
- React + Tailwind (Vite). Wallet connect (Core/MetaMask), Scroll network helper.
- Gasless checkout via EIP‑712 typed data in `BuyClipWidget.jsx`.
- API client at `VITE_BACKEND_API`.


## Environment Variables
Create the following files from the examples and fill in real values:

backend/.env (see backend/.env.example)
- PORT=4000
- MONGO_URI=mongodb://localhost:27017/rightly (or Atlas URI)
- REDIS_URL=redis://localhost:6379 (or Upstash)
- SCROLL_RPC=https://sepolia-rpc.scroll.io (or mainnet RPC)
- CHAIN_ID=534351 (Scroll Sepolia) or 534352 (mainnet)
- USX_TOKEN_ADDRESS=0x...
- CLIP_LICENSE_ADDRESS=0x...
- RELAYER_PRIVATE_KEY=0x...
- PLATFORM_PRIVATE_KEY=0x...
- PLATFORM_ADDRESS=0xYourPlatformWalletAddress
- FRONTEND_URL=http://localhost:5173 (Vite default)

frontend/.env (example)
- VITE_BACKEND_API=http://localhost:4000/api
- VITE_SCROLL_RPC=https://sepolia-rpc.scroll.io
- VITE_CONTRACT_ADDRESS=0xYourClipLicenseContractAddress
- VITE_USX_TOKEN_ADDRESS=0xYourUSXTokenAddress

contracts/.env
- SCROLL_RPC=https://sepolia-rpc.scroll.io
- PRIVATE_KEY=0xYourDeployerKey
- SCROLLSCAN_API_KEY=optional


## Install & Run (Local)
1) Contracts
- Open `contracts/`
- Install: `npm i`
- Compile: `npx hardhat compile`
- (Optional) Deploy to Scroll Sepolia: `npx hardhat run scripts/deploy.js --network scrollTestnet`
- Copy deployed addresses into backend/frontend envs

2) Backend
- Open `backend/`
- Install: `npm i`
- Start MongoDB and Redis
- Run API + workers: `npm run dev` (or `node src/server.js`)
- Health check: `http://localhost:4000/health`

3) Frontend
- Open `frontend/`
- Install: `npm i`
- Run: `npm run dev`
- App: `http://localhost:5173`


## Demo Flow
- Creator creates a clip (POST /api/clips) and/or via UI (Upload page if present)
- Buyer opens clip page and clicks “License This Clip”
- If gasless:
  - Frontend calls `POST /api/auth/nonce` and signs EIP‑712 BuyIntent
  - Sends to `POST /api/relayer/buy`
  - Relayer submits `buyLicenseFor` on-chain
  - Indexer catches `LicensePurchased`, signs canonical receipt JSON, pins to IPFS, stores ref
- Buyer/Creator can view receipt via `/api/receipts/:licenseId`


## Notes & Requirements
- Buyers must hold USX and have approved `ClipLicense` to spend, or you can add ERC‑2612 permit to USX (future improvement).
- For test runs, use `MockUSX` and its `faucet`/`mint`.
- Ensure relayer wallet has test ETH for gas on Scroll testnet.


## Security & Production Checklist
- Keep private keys in a secrets manager (never commit)
- Rate-limit `POST /api/relayer/buy`
- Monitor relayer balance and set job concurrency caps
- Use SafeERC20 and ReentrancyGuard (already in contract)
- Consider subgraph indexing for analytics in a fully on-chain data path


## License
MIT
