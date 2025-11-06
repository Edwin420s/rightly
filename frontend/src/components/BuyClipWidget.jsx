import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { ShoppingCart, Zap, Shield, AlertCircle } from 'lucide-react'
import { formatUSX, parseUSX, getSigner } from '../utils/wallet'
import { apiClient } from '../utils/api'

const BuyClipWidget = ({ clip, onPurchaseComplete }) => {
  const { account, isConnected } = useApp()
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [purchaseMethod, setPurchaseMethod] = useState('gasless') // 'gasless' or 'direct'
  const [error, setError] = useState('')

  const handlePurchase = async () => {
    if (!isConnected || !account) {
      setError('Please connect your wallet first')
      return
    }

    setIsPurchasing(true)
    setError('')

    try {
      if (purchaseMethod === 'gasless') {
        await purchaseWithGasless()
      } else {
        await purchaseDirect()
      }
    } catch (err) {
      console.error('Purchase failed:', err)
      setError(err.message || 'Purchase failed. Please try again.')
    } finally {
      setIsPurchasing(false)
    }
  }

  const purchaseWithGasless = async () => {
    try {
      // Get nonce from backend
      const nonceData = await apiClient.getNonce(account)
      const nonce = nonceData.nonce

      // Prepare EIP-712 signature data
      const deadline = Math.floor(Date.now() / 1000) + 600 // 10 minutes
      const message = {
        clipId: clip.onchainClipId || clip.id,
        buyer: account,
        price: clip.price,
        nonce: nonce,
        deadline: deadline
      }

      const signer = await getSigner()
      
      // In a real implementation, we would use _signTypedData
      // For demo, we'll use a simple signature
      const signature = await signer.signMessage(JSON.stringify(message))

      // Submit to relayer
      const result = await apiClient.submitBuyIntent({
        ...message,
        signature
      })

      if (onPurchaseComplete) {
        onPurchaseComplete(result)
      }

    } catch (error) {
      throw new Error('Gasless purchase failed: ' + error.message)
    }
  }

  const purchaseDirect = async () => {
    try {
      const signer = await getSigner()
      
      // In a real implementation, we would call the contract directly
      // For demo, we'll simulate this
      console.log('Direct purchase simulation:', {
        clipId: clip.onchainClipId || clip.id,
        buyer: account,
        price: clip.price
      })

      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 3000))

      if (onPurchaseComplete) {
        onPurchaseComplete({ success: true, method: 'direct' })
      }

    } catch (error) {
      throw new Error('Direct purchase failed: ' + error.message)
    }
  }

  if (!isConnected) {
    return (
      <div className="card text-center">
        <ShoppingCart className="h-12 w-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          Connect Wallet to License
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          Connect your wallet to purchase a license for this clip
        </p>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">License This Clip</h3>
        <div className="text-2xl font-bold text-blue-500">
          {formatUSX(clip.price)} USX
        </div>
      </div>

      {/* Purchase Method Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Purchase Method
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPurchaseMethod('gasless')}
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              purchaseMethod === 'gasless'
                ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                : 'border-navy-600 bg-navy-700 hover:border-navy-500'
            }`}
          >
            <Zap className="h-5 w-5 text-blue-500 mb-2" />
            <div className="text-white font-medium text-sm">Gasless</div>
            <div className="text-gray-400 text-xs">No ETH needed</div>
          </button>

          <button
            onClick={() => setPurchaseMethod('direct')}
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              purchaseMethod === 'direct'
                ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                : 'border-navy-600 bg-navy-700 hover:border-navy-500'
            }`}
          >
            <Shield className="h-5 w-5 text-green-500 mb-2" />
            <div className="text-white font-medium text-sm">Direct</div>
            <div className="text-gray-400 text-xs">Pay gas yourself</div>
          </button>
        </div>
      </div>

      {/* License Terms */}
      <div className="mb-6 p-4 bg-navy-700 rounded-lg">
        <h4 className="text-white font-medium mb-2">License Includes:</h4>
        <ul className="text-gray-400 text-sm space-y-1">
          <li>• {clip.durationDays} days commercial use</li>
          <li>• Worldwide distribution rights</li>
          <li>• Modification and adaptation allowed</li>
          <li>• Permanent on-chain proof</li>
        </ul>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg">
          <div className="flex items-center space-x-2 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Purchase Button */}
      <button
        onClick={handlePurchase}
        disabled={isPurchasing}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isPurchasing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <ShoppingCart className="h-4 w-4" />
            <span>License for {formatUSX(clip.price)} USX</span>
          </>
        )}
      </button>

      {/* Help Text */}
      <div className="mt-4 text-center">
        <p className="text-gray-500 text-xs">
          {purchaseMethod === 'gasless' 
            ? 'You will sign a message to authorize the purchase'
            : 'You will confirm the transaction in your wallet'
          }
        </p>
      </div>
    </div>
  )
}

export default BuyClipWidget