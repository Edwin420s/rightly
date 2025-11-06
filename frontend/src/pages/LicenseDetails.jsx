import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { 
  Calendar, 
  DollarSign, 
  User, 
  Shield, 
  Download,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react'
import { formatAddress, formatUSX, parseUSX, getSigner } from '../utils/wallet'
import { apiClient } from '../utils/api'
import { CONTRACT_ADDRESS } from '../utils/constants'

const LicenseDetails = () => {
  const { id } = useParams()
  const { account, isConnected } = useApp()
  const [license, setLicense] = useState(null)
  const [clip, setClip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadLicenseDetails()
  }, [id])

  const loadLicenseDetails = async () => {
    try {
      setLoading(true)
      // In a real implementation, these would be API calls
      // const licenseData = await apiClient.getLicense(id)
      // const clipData = await apiClient.getClip(licenseData.clipId)
      
      // Mock data for demo
      setTimeout(() => {
        setLicense({
          licenseId: id,
          clipId: '1',
          buyer: '0x' + '0'.repeat(40),
          price: '1000000000000000000',
          startTs: new Date().toISOString(),
          expiryTs: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          ipfsCid: 'QmXyz123...',
          txHash: '0x' + '0'.repeat(64)
        })
        
        setClip({
          id: '1',
          title: 'Urban City Time Lapse',
          description: 'Beautiful time lapse of city traffic at night with neon lights. Perfect for background visuals in videos, presentations, or digital art projects.',
          price: '1000000000000000000',
          durationDays: 7,
          creator: '0x742d35Cc6634C0532925a3b8D4C9b2a3b8D4C9b2',
          assetCID: 'QmXyz...',
          thumbnailCID: 'QmAbc...',
          splits: [
            { address: '0x742d35Cc6634C0532925a3b8D4C9b2a3b8D4C9b2', bps: 10000 }
          ]
        })
        
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Failed to load license details:', error)
      setLoading(false)
    }
  }

  const handlePurchase = async () => {
    if (!isConnected || !account) return

    setPurchasing(true)
    try {
      const signer = await getSigner()
      
      // In a real implementation, you would:
      // 1. Get nonce from backend
      // 2. Sign EIP-712 intent
      // 3. Submit to relayer or call contract directly
      
      console.log('Purchasing license...')
      
      // Mock purchase success
      setTimeout(() => {
        alert('License purchased successfully!')
        setPurchasing(false)
      }, 2000)
      
    } catch (error) {
      console.error('Purchase failed:', error)
      alert('Purchase failed. Please try again.')
      setPurchasing(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!license || !clip) {
    return (
      <div className="min-h-screen bg-navy-900 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Shield className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-400 mb-2">License Not Found</h2>
          <p className="text-gray-500 mb-6">
            The license you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/marketplace" className="btn-primary">
            Browse Marketplace
          </Link>
        </div>
      </div>
    )
  }

  const isOwner = license.buyer === account
  const canPurchase = isConnected && !isOwner && license.buyer === '0x' + '0'.repeat(40)
  const isExpired = new Date(license.expiryTs) < new Date()

  return (
    <div className="min-h-screen bg-navy-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="card mb-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Thumbnail */}
            <div className="lg:w-1/3">
              <div className="aspect-video rounded-lg overflow-hidden bg-navy-700">
                <img
                  src={`https://ipfs.io/ipfs/${clip.thumbnailCID || clip.assetCID}`}
                  alt={clip.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Details */}
            <div className="lg:w-2/3">
              <h1 className="text-2xl font-bold text-white mb-2">{clip.title}</h1>
              <p className="text-gray-400 mb-6">{clip.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center space-x-2 text-gray-300">
                  <DollarSign className="h-5 w-5 text-blue-500" />
                  <span>{formatUSX(clip.price)} USX</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-300">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <span>{clip.durationDays} days</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-300">
                  <User className="h-5 w-5 text-blue-500" />
                  <span>Creator: {formatAddress(clip.creator)}</span>
                </div>
                {isOwner && (
                  <div className="flex items-center space-x-2 text-gray-300">
                    <Shield className="h-5 w-5 text-green-500" />
                    <span>You own this license</span>
                  </div>
                )}
              </div>

              {canPurchase && (
                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="btn-primary w-full md:w-auto disabled:opacity-50"
                >
                  {purchasing ? 'Purchasing...' : `License for ${formatUSX(clip.price)} USX`}
                </button>
              )}

              {isOwner && (
                <div className="flex space-x-3">
                  <button className="btn-primary flex items-center space-x-2">
                    <Download className="h-4 w-4" />
                    <span>Download Clip</span>
                  </button>
                  <button className="btn-secondary flex items-center space-x-2">
                    <ExternalLink className="h-4 w-4" />
                    <span>View Receipt</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* License Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* License Details */}
          <div className="card">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-500" />
              <span>License Information</span>
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">License ID:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-mono text-sm">
                    {license.licenseId.slice(0, 8)}...{license.licenseId.slice(-6)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(license.licenseId)}
                    className="text-gray-400 hover:text-white"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isExpired 
                    ? 'bg-red-500 text-white' 
                    : isOwner 
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-500 text-white'
                }`}>
                  {isExpired ? 'Expired' : isOwner ? 'Active' : 'Available'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Valid From:</span>
                <span className="text-white">
                  {isOwner ? new Date(license.startTs).toLocaleDateString() : 'Upon purchase'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Expires:</span>
                <span className="text-white">
                  {isOwner 
                    ? new Date(license.expiryTs).toLocaleDateString()
                    : `${clip.durationDays} days after purchase`
                  }
                </span>
              </div>

              {license.txHash && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Transaction:</span>
                  <a
                    href={`https://sepolia-blockscout.scroll.io/tx/${license.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-400 flex items-center space-x-1 text-sm"
                  >
                    <span>View on Explorer</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Usage Rights */}
          <div className="card">
            <h2 className="text-xl font-semibold text-white mb-4">Usage Rights</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <span className="text-gray-300">Commercial use in digital projects</span>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <span className="text-gray-300">Modification and adaptation allowed</span>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <span className="text-gray-300">Worldwide distribution rights</span>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <span className="text-gray-300">Resale or redistribution of original file</span>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <span className="text-gray-300">Claiming original authorship</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-navy-700 rounded-lg">
              <p className="text-gray-300 text-sm">
                This license is recorded on Scroll zkEVM and provides permanent, 
                verifiable proof of your usage rights.
              </p>
            </div>
          </div>
        </div>

        {/* Revenue Splits */}
        {clip.splits && clip.splits.length > 0 && (
          <div className="card mt-8">
            <h2 className="text-xl font-semibold text-white mb-4">Revenue Distribution</h2>
            <div className="space-y-3">
              {clip.splits.map((split, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-navy-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-white font-mono text-sm">
                      {formatAddress(split.address)}
                    </span>
                    {split.address === clip.creator && (
                      <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                        Creator
                      </span>
                    )}
                  </div>
                  <span className="text-gray-300">
                    {(split.bps / 100).toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LicenseDetails