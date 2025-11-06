import React from 'react'
import { useApp } from '../context/AppContext'
import { Wallet, LogOut, User } from 'lucide-react'
import { formatAddress } from '../utils/wallet'
import { useState } from 'react'

const WalletButton = () => {
  const { isConnected, account, connect, disconnect, loading } = useApp()
  const [showDropdown, setShowDropdown] = useState(false)

  const handleConnect = async () => {
    await connect()
  }

  const handleDisconnect = () => {
    disconnect()
    setShowDropdown(false)
  }

  if (!isConnected) {
    return (
      <button
        onClick={handleConnect}
        disabled={loading}
        className="btn-primary flex items-center space-x-2 disabled:opacity-50"
      >
        <Wallet className="h-4 w-4" />
        <span>{loading ? 'Connecting...' : 'Connect Wallet'}</span>
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 bg-navy-700 hover:bg-navy-600 px-4 py-2 rounded-lg transition-colors"
      >
        <User className="h-4 w-4" />
        <span>{formatAddress(account)}</span>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-navy-800 border border-navy-700 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <button
              onClick={handleDisconnect}
              className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-navy-700 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default WalletButton