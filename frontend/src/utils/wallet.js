import { ethers } from 'ethers'
import { CONTRACT_ADDRESS, SCROLL_RPC } from './constants'

let provider = null
let signer = null

export const getProvider = () => {
  if (!provider) {
    if (window.ethereum) {
      provider = new ethers.BrowserProvider(window.ethereum)
    } else {
      provider = new ethers.JsonRpcProvider(SCROLL_RPC)
    }
  }
  return provider
}

export const getSigner = async () => {
  if (!signer) {
    const provider = getProvider()
    signer = await provider.getSigner()
  }
  return signer
}

export const connectWallet = async () => {
  if (!window.ethereum) {
    throw new Error('No Ethereum wallet found. Please install MetaMask or Core Wallet.')
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    })
    
    return accounts[0]
  } catch (error) {
    throw new Error('User rejected the connection request')
  }
}

export const getCurrentAccount = async () => {
  if (!window.ethereum) return null

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts'
    })
    return accounts[0] || null
  } catch (error) {
    return null
  }
}

export const switchToScrollNetwork = async () => {
  if (!window.ethereum) return

  const scrollChainId = '0x8274F' // Scroll Sepolia testnet

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: scrollChainId }],
    })
  } catch (error) {
    if (error.code === 4902) {
      // Chain not added, let's add it
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: scrollChainId,
            chainName: 'Scroll Sepolia',
            rpcUrls: ['https://sepolia-rpc.scroll.io'],
            nativeCurrency: {
              name: 'Ether',
              symbol: 'ETH',
              decimals: 18,
            },
            blockExplorerUrls: ['https://sepolia-blockscout.scroll.io'],
          },
        ],
      })
    }
  }
}

export const formatAddress = (address) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const formatUSX = (amount) => {
  return ethers.formatUnits(amount, 18)
}

export const parseUSX = (amount) => {
  return ethers.parseUnits(amount.toString(), 18)
}