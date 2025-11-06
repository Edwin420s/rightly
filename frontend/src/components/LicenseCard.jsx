import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, FileText, Download, ExternalLink } from 'lucide-react'
import { formatAddress, formatUSX } from '../utils/wallet'

const LicenseCard = ({ license }) => {
  const {
    licenseId,
    clip,
    buyer,
    price,
    startTs,
    expiryTs,
    ipfsCid,
    txHash
  } = license

  const isExpired = new Date(expiryTs) < new Date()
  const daysRemaining = Math.ceil((new Date(expiryTs) - new Date()) / (1000 * 60 * 60 * 24))

  return (
    <div className={`card ${isExpired ? 'border-red-500' : 'border-green-500'}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white mb-1">
            {clip?.title || 'Unknown Clip'}
          </h3>
          <p className="text-gray-400 text-sm">
            License ID: {licenseId.slice(0, 8)}...{licenseId.slice(-6)}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          isExpired 
            ? 'bg-red-500 text-white' 
            : 'bg-green-500 text-white'
        }`}>
          {isExpired ? 'Expired' : `${daysRemaining} days left`}
        </span>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Buyer:</span>
          <span className="text-white">{formatAddress(buyer)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">Price:</span>
          <span className="text-white">{formatUSX(price)} USX</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Valid Until:</span>
          <span className="text-white">
            {new Date(expiryTs).toLocaleDateString()}
          </span>
        </div>

        {ipfsCid && (
          <div className="flex justify-between">
            <span className="text-gray-400">Receipt:</span>
            <a
              href={`https://ipfs.io/ipfs/${ipfsCid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-400 flex items-center space-x-1"
            >
              <FileText className="h-4 w-4" />
              <span>View</span>
            </a>
          </div>
        )}
      </div>

      <div className="flex space-x-3 mt-4">
        <Link
          to={`/license/${licenseId}`}
          className="btn-secondary flex-1 text-center flex items-center justify-center space-x-2"
        >
          <ExternalLink className="h-4 w-4" />
          <span>Details</span>
        </Link>
        
        <button className="btn-primary flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Download</span>
        </button>
      </div>
    </div>
  )
}

export default LicenseCard