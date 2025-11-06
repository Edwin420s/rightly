import React from 'react'
import { Link } from 'react-router-dom'
import { Play, Clock, DollarSign, User } from 'lucide-react'
import { formatUSX } from '../utils/wallet'

const ContentCard = ({ clip }) => {
  const {
    id,
    title,
    description,
    price,
    durationDays,
    creator,
    thumbnailCID,
    assetCID
  } = clip

  const thumbnailUrl = thumbnailCID 
    ? `https://ipfs.io/ipfs/${thumbnailCID}`
    : `https://ipfs.io/ipfs/${assetCID}`

  return (
    <div className="card group hover:border-navy-600 transition-all duration-200">
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-lg overflow-hidden bg-navy-700 mb-4">
        <img
          src={thumbnailUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
          <button className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 bg-white bg-opacity-90 rounded-full p-3">
            <Play className="h-5 w-5 text-navy-900 fill-current" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        <h3 className="font-semibold text-white line-clamp-2 group-hover:text-blue-400 transition-colors">
          {title}
        </h3>
        
        <p className="text-gray-400 text-sm line-clamp-2">
          {description}
        </p>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4 text-gray-400">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{durationDays} days</span>
            </div>
            <div className="flex items-center space-x-1">
              <DollarSign className="h-4 w-4" />
              <span>{formatUSX(price)} USX</span>
            </div>
          </div>

          <div className="flex items-center space-x-1 text-gray-400">
            <User className="h-4 w-4" />
            <span className="text-xs">{formatAddress(creator)}</span>
          </div>
        </div>

        <Link
          to={`/license/${id}`}
          className="btn-primary w-full text-center block"
        >
          License Clip
        </Link>
      </div>
    </div>
  )
}

export default ContentCard