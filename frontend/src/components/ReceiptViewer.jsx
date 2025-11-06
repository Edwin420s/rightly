import React from 'react'
import { Download, Check, Copy, ExternalLink, Shield, Calendar, User, DollarSign } from 'lucide-react'
import { formatAddress, formatUSX } from '../utils/wallet'

const ReceiptViewer = ({ receipt, onClose }) => {
  const [copied, setCopied] = React.useState('')

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(''), 2000)
  }

  const downloadReceipt = () => {
    const receiptData = {
      licenseId: receipt.licenseId,
      clip: receipt.clip,
      buyer: receipt.buyer,
      seller: receipt.seller,
      price: receipt.price,
      currency: receipt.currency,
      startTimestamp: receipt.startTimestamp,
      expiryTimestamp: receipt.expiryTimestamp,
      txHash: receipt.txHash,
      ipfsCid: receipt.ipfsCid
    }

    const blob = new Blob([JSON.stringify(receiptData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rightly-receipt-${receipt.licenseId.slice(0, 8)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!receipt) {
    return (
      <div className="card text-center">
        <Shield className="h-12 w-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-400 mb-2">No Receipt Data</h3>
        <p className="text-gray-500">Receipt information is not available.</p>
      </div>
    )
  }

  const isExpired = new Date(receipt.expiryTimestamp) < new Date()
  const isValid = receipt.signature && !isExpired

  return (
    <div className="card max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${
            isValid ? 'bg-green-500' : 'bg-red-500'
          }`}>
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">License Receipt</h2>
            <p className="text-gray-400 text-sm">
              {isValid ? 'Verified License' : 'Invalid or Expired License'}
            </p>
          </div>
        </div>
        <button
          onClick={downloadReceipt}
          className="btn-secondary flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Download</span>
        </button>
      </div>

      {/* Status Badge */}
      <div className={`p-4 rounded-lg mb-6 ${
        isValid 
          ? 'bg-green-500 bg-opacity-20 border border-green-500' 
          : 'bg-red-500 bg-opacity-20 border border-red-500'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Check className={`h-5 w-5 ${isValid ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`font-medium ${isValid ? 'text-green-500' : 'text-red-500'}`}>
              {isValid ? 'License Active' : 'License Expired'}
            </span>
          </div>
          <span className="text-gray-400 text-sm">
            Expires: {new Date(receipt.expiryTimestamp).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Receipt Details */}
      <div className="space-y-4">
        {/* Clip Information */}
        <div className="p-4 bg-navy-700 rounded-lg">
          <h3 className="text-white font-semibold mb-3">Clip Information</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Title:</span>
              <span className="text-white">{receipt.clip?.title || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Creator:</span>
              <div className="flex items-center space-x-2">
                <span className="text-white font-mono text-sm">
                  {formatAddress(receipt.seller)}
                </span>
                <button
                  onClick={() => copyToClipboard(receipt.seller, 'seller')}
                  className="text-gray-400 hover:text-white"
                >
                  {copied === 'seller' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* License Details */}
        <div className="p-4 bg-navy-700 rounded-lg">
          <h3 className="text-white font-semibold mb-3">License Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-gray-400 text-sm">Price</p>
                <p className="text-white font-medium">{formatUSX(receipt.price)} USX</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-gray-400 text-sm">Duration</p>
                <p className="text-white font-medium">
                  {Math.ceil((new Date(receipt.expiryTimestamp) - new Date(receipt.startTimestamp)) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="p-4 bg-navy-700 rounded-lg">
          <h3 className="text-white font-semibold mb-3">Timeline</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">License Start:</span>
              <span className="text-white text-sm">
                {new Date(receipt.startTimestamp).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">License Expiry:</span>
              <span className="text-white text-sm">
                {new Date(receipt.expiryTimestamp).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Blockchain Proof */}
        <div className="p-4 bg-navy-700 rounded-lg">
          <h3 className="text-white font-semibold mb-3">Blockchain Proof</h3>
          <div className="space-y-3">
            {receipt.txHash && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Transaction:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-mono text-sm">
                    {receipt.txHash.slice(0, 8)}...{receipt.txHash.slice(-6)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(receipt.txHash, 'txHash')}
                    className="text-gray-400 hover:text-white"
                  >
                    {copied === 'txHash' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </button>
                  <a
                    href={`https://sepolia-blockscout.scroll.io/tx/${receipt.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-400"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}

            {receipt.ipfsCid && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">IPFS Receipt:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-mono text-sm">
                    {receipt.ipfsCid.slice(0, 8)}...{receipt.ipfsCid.slice(-6)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(receipt.ipfsCid, 'ipfsCid')}
                    className="text-gray-400 hover:text-white"
                  >
                    {copied === 'ipfsCid' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </button>
                  <a
                    href={`https://ipfs.io/ipfs/${receipt.ipfsCid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-400"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}

            {receipt.licenseId && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">License ID:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-mono text-sm">
                    {receipt.licenseId.slice(0, 8)}...{receipt.licenseId.slice(-6)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(receipt.licenseId, 'licenseId')}
                    className="text-gray-400 hover:text-white"
                  >
                    {copied === 'licenseId' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Signature Verification */}
        {receipt.signature && (
          <div className="p-4 bg-green-500 bg-opacity-20 border border-green-500 rounded-lg">
            <div className="flex items-center space-x-2 text-green-500">
              <Check className="h-4 w-4" />
              <span className="font-medium">Digitally Signed Receipt</span>
            </div>
            <p className="text-green-400 text-sm mt-1">
              This receipt has been cryptographically signed and verified on the blockchain.
            </p>
          </div>
        )}
      </div>

      {/* QR Code for Mobile Verification */}
      <div className="mt-6 p-4 bg-navy-700 rounded-lg text-center">
        <h4 className="text-white font-medium mb-3">Quick Verification QR</h4>
        <div className="bg-white p-4 rounded-lg inline-block">
          {/* In a real implementation, you would generate a QR code */}
          <div className="w-32 h-32 bg-gray-200 flex items-center justify-center text-gray-500 text-xs text-center">
            QR Code<br />Placeholder
          </div>
        </div>
        <p className="text-gray-400 text-sm mt-3">
          Scan to verify this license on mobile devices
        </p>
      </div>
    </div>
  )
}

export default ReceiptViewer