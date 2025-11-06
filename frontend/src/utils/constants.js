export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x...'
export const USX_TOKEN_ADDRESS = import.meta.env.VITE_USX_TOKEN_ADDRESS || '0x...'
export const SCROLL_RPC = import.meta.env.VITE_SCROLL_RPC || 'https://sepolia-rpc.scroll.io'
export const BACKEND_API = import.meta.env.VITE_BACKEND_API || 'http://localhost:4000/api'

export const LICENSE_TYPES = {
  COMMERCIAL: 'commercial',
  PERSONAL: 'personal',
  EDUCATIONAL: 'educational'
}

export const LICENSE_DURATIONS = {
  '7': '7 days',
  '30': '30 days',
  '90': '90 days',
  '365': '1 year'
}