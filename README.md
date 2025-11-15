# Rightly — On‑chain Micro‑Licensing for Short‑Form Content

Rightly is an on‑chain marketplace for short, time‑bounded licenses (e.g., 1–7 days) covering clips, loops, beats, and short videos. Buyers get verifiable proof of license on Scroll; creators receive instant USX settlement with automatic collaborator splits.

Built for Scroll zkEVM. Wallet‑based login (Core/MetaMask), optional gasless checkout (EIP‑712 intent + relayer), and IPFS‑pinned signed receipts.

## Quick Start 
- **Contracts**
  - `cd contracts && npm i && npx hardhat compile`
  - Deploy (Scroll Sepolia): `npx hardhat run scripts/deploy.js --network scrollTestnet`
  - Copy addresses to backend/frontend `.env`
- **Backend**
  - `cd backend && npm i`
  - Start MongoDB + Redis
  - `npm run dev` → `http://localhost:4000/health`
- **Frontend**
  - `cd frontend && npm i && npm run dev` → `http://localhost:5173`

## Table of Contents
- [Executive Summary](#executive-summary)
- [Key Features](#key-features)
- [Architecture at a glance](#architecture-at-a-glance)
- [Project Structure](#project-structure)
- [Smart Contracts](#smart-contracts)
- [Backend](#backend)
- [Frontend](#frontend)
 
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Install & Run (Local)](#install--run-local)
- [Contract Addresses](#contract-addresses)
- [Demo Flow](#demo-flow)
- [Notes & Requirements](#notes--requirements)
- [Security & Production Checklist](#security--production-checklist)
- [Roadmap](#roadmap)
- [FAQ](#faq)
- [License](#license)
- [Appendix A — Hackathon Materials](#appendix-a--hackathon-materials)

## Executive Summary
- Micro‑licensing for short clips with on‑chain proof and instant USX settlement on Scroll.
- Gasless checkout via EIP‑712 intent + relayer; signed IPFS receipts for real‑world proof.
- Clean React/Tailwind frontend, Express/Mongo backend (relayer + indexer), Solidity contracts.


## Key Features
- **On‑chain first**: Every purchase emits `LicensePurchased` with timestamps and amount.
- **Instant USX settlement + auto‑splits**: Creator, collaborators, and platform fee handled atomically.
- **Gasless checkout (optional)**: EIP‑712 BuyIntent signed by buyer; relayer submits the tx.
- **Wallet = identity**: Core Wallet/MetaMask; no email or password.
- **Receipts on IPFS**: Canonical signed JSON receipts, pinned and verifiable.

## Architecture at a glance
- **Frontend (React/Vite/Tailwind)** ↔ calls **Backend (Express/Mongo/Redis)** for IPFS pinning, nonce, receipts, and gasless relayer
- **Frontend** reads/writes **Smart Contracts (Scroll zkEVM)** via ethers.js; gasless buy uses EIP‑712 → relayer → `buyLicenseFor`
- **Contracts** emit `LicensePurchased` → **Indexer worker** signs & pins canonical receipt JSON to **IPFS** and stores reference in **MongoDB**


## Project Structure
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

Hardhat networks are preconfigured for Scroll Sepolia (534351) and Scroll Mainnet (534352).


## Backend
- Express routes
  - `POST /api/clips`, `GET /api/clips`, `GET /api/clips/:id`
  - `POST /api/auth/nonce` — returns current nonce
  - `POST /api/relayer/buy` — verifies typed data and enqueues `buyLicenseFor`
  - `GET /api/receipts/:licenseId` — fetch stored receipt with IPFS CID
- Services
  - `services/contract.js` — provider, relayer wallet, contract instance (ABI aligned)
  - `workers/relayerWorker.js` — submits `buyLicenseFor`
  - `workers/indexerWorker.js` — listens to `LicensePurchased`; signs + pins receipt JSON to IPFS; stores Mongo reference (BullMQ queue: `indexerQueue`)
  - `services/ipfs.js` — Pinata integration (falls back to mock CIDs if not configured)
- Database: MongoDB (`Clip`, `Receipt`, `Nonce` models)
- Queue: BullMQ (Redis/Upstash)

### API Endpoints (summary)
- `GET  /health`
- `POST /api/clips` — create clip (off‑chain record)
- `GET  /api/clips` — list active clips
- `GET  /api/clips/:id` — get clip by id
- `POST /api/clips/pin` — pin base64 file to IPFS → `{ cid }`
- `POST /api/auth/nonce` — `{ address }` → `{ nonce }`
- `POST /api/relayer/buy` — gasless buy intent
- `GET  /api/receipts/:licenseId` — fetch stored receipt


## Frontend
- React + Tailwind (Vite). Wallet connect (Core/MetaMask), Scroll network helper.
- Gasless checkout via EIP‑712 typed data in `BuyClipWidget.jsx`.
- API client at `VITE_BACKEND_API`.


## Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or Upstash for BullMQ)
- Wallet (Core/MetaMask) on Scroll network

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


## Contract Addresses
Populate after deployment:
- Scroll Network: Scroll Sepolia (534351) / Scroll Mainnet (534352)
- ClipLicense: `0x...`
- USX (or MockUSX): `0x...`

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

---

## Appendix A — Hackathon Materials

### Problem, Solution, and Hackathon Context

- **Problem (real, current):** Short‑form creators and micro‑businesses lack a fast, cheap, verifiable way to license 10–60s clips. Manual contracts are too heavy; generic “tipping” doesn’t convey legal usage rights; payouts are slow or fragmented.
- **Solution (Rightly):** An on‑chain micro‑licensing marketplace on Scroll zkEVM where buyers can acquire time‑bounded commercial rights in under 60 seconds, creators get instant USX settlement with automatic splits, and every purchase is anchored by an immutable on‑chain event plus a signed IPFS receipt.
- **Why Scroll:** Low fees, Ethereum compatibility, strong ecosystem (USX, HoneyPop, ChatterPay), and great fit for frequent micro‑transactions and event indexing.

### What makes Rightly unique
- **Built for micro‑licenses** ($1–10) with on‑chain proof and real‑world receipts (QR/PDF).
- **Gasless checkout option** (EIP‑712 + relayer) for non‑crypto‑native buyers.
- **Instant, stable settlement in USX** with automatic splits (creator/collabs/platform).
- **Embeddable UX** (buy widget) and creator‑first flows.

## Features
- **Create Clip on‑chain:** `createClip(assetCID, price, durationDays, splits, splitBps)`.
- **Purchase License:** Direct or gasless (`buyLicenseFor`) with verifiable on‑chain events.
- **Receipts:** Signed JSON pinned to IPFS; explorer links for on‑chain txs.
- **Mongo‑backed discovery:** Simple off‑chain catalog for fast UI, anchored to on‑chain truth.

### Architecture Overview
- Frontend (React/Vite/Tailwind, ethers.js) connects wallet, uploads to IPFS via backend, calls contracts, shows receipts.
- Backend (Express/Mongo/BullMQ) exposes REST, verifies typed data, relays gasless txs, indexes `LicensePurchased`, signs/pins receipts to IPFS.
- Contracts (Solidity/OpenZeppelin) handle storage of clip offers, license purchases, fee splits, nonces, and emit events.

### Setup Quickstart
1) Contracts: `cd contracts && npm i && npx hardhat compile`
   - Deploy (Scroll Sepolia): `npx hardhat run scripts/deploy.js --network scrollTestnet`
   - Copy addresses → backend/.env and frontend/.env
2) Backend: `cd backend && npm i && npm run dev`
   - Requires MongoDB + Redis/Upstash; set envs from `.env.example`.
3) Frontend: `cd frontend && npm i && npm run dev` → http://localhost:5173

### Demo Checklist (fast)
- Set `VITE_CONTRACT_ADDRESS`, `VITE_USX_TOKEN_ADDRESS`, `VITE_BACKEND_API`.
- Fund relayer (test ETH) and buyer (USX). Approve USX for ClipLicense if using direct buy.
- Upload a sample clip via Upload page → on‑chain `createClip` → off‑chain record.
- Use Buy widget: gasless (sign intent) or direct (contract tx). Verify receipt and explorer link.

### Roadmap
- **Challenge #2 — UGC Video (60–90s script):**
  - 0–6s: “I’m Edwin from Kenya — here’s how creators can license short clips in 60s.”
  - 6–20s: Show Upload → set price (1 USX), duration (7 days), Publish (on‑chain).
  - 20–40s: Buyer clicks Buy → sign (gasless) → show on‑chain event and receipt CID.
  - 40–60s: Show receipt (QR/IPFS), highlight USX settlement + splits.
  - Close: “Built on Scroll zkEVM — low fees, instant settlement.” + required tags.

### Evaluation Mapping
- Creativity: embeddable widget + gasless UX + real‑world receipt flow.
- Mention of key projects: Scroll zkEVM, USX; optional HoneyPop/ChatterPay in roadmap.
- Reach & engagement: thread + video; consider posting to multiple platforms.
- Content quality: clear hook, demo, impact, and call‑to‑action.

## Roadmap
- ERC‑1155 receipt NFTs (optional upgrade) and subgraph indexing.
- Fiat on/off‑ramp integrations (e.g., M‑Pesa partners) and EtherFi Cash.
- Dispute tooling and moderation workflows; creator reputation contract.
- Mobile SDK and shareable buy widgets.

### Risks & Mitigations
- DRM vs licensing: receipts provide legal entitlement and provenance, not content lock.
- Gasless abuse: rate‑limit relayer, nonces on‑chain + server‑side checks, CAPTCHA in prod.
- Key security: use vaults/KMS; monitor relayer spend; set emergency pause.

### FAQ
- Do buyers need ETH? Not with gasless mode; they still need USX. Direct mode requires ETH for gas.
- Where are files stored? IPFS (Pinata optional); receipts are signed JSON pinned to IPFS.
- Can licenses be refunded/voided? Not in MVP; add policy + admin/DAO arbitration later.

### Credits
- Built by Edwin Mwiti and contributors for Scroll Content Hackathon 2025.
- Ecosystem: Scroll zkEVM, USX, and community partners.
