import { useState, useEffect } from 'react'
import { connectWallet, getCurrentAccount, switchToScrollNetwork } from '../utils/wallet'

export const useWallet = () => {
  const [account, setAccount] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    checkConnection()
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  const checkConnection = async () => {
    try {
      const currentAccount = await getCurrentAccount()
      if (currentAccount) {
        setAccount(currentAccount)
        setIsConnected(true)
      }
    } catch (error) {
      console.log('No wallet connected')
    }
  }

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      setAccount(null)
      setIsConnected(false)
    } else {
      setAccount(accounts[0])
      setIsConnected(true)
    }
  }

  const handleChainChanged = (chainId) => {
    // Reload the page when the chain changes
    window.location.reload()
  }

  const connect = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      // Switch to Scroll network if needed
      await switchToScrollNetwork()
      
      const account = await connectWallet()
      setAccount(account)
      setIsConnected(true)
      return account
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    setAccount(null)
    setIsConnected(false)
    setError(null)
  }

  return {
    account,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect
  }
}