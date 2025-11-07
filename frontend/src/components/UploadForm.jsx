import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Upload, X, Plus, Minus } from 'lucide-react'
import { LICENSE_DURATIONS, LICENSE_TYPES, CONTRACT_ADDRESS } from '../utils/constants'
import { parseUSX, getSigner } from '../utils/wallet'
import { apiClient } from '../utils/api'
import { ethers } from 'ethers'

const UploadForm = () => {
  const { account } = useApp()
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '1.0',
    durationDays: '7',
    licenseType: LICENSE_TYPES.COMMERCIAL,
    splits: [{ address: '', bps: 10000 }]
  })
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreviewUrl(URL.createObjectURL(selectedFile))
    }
  }

  const handleSplitChange = (index, field, value) => {
    const newSplits = [...formData.splits]
    newSplits[index][field] = value
    setFormData({ ...formData, splits: newSplits })
  }

  const addSplit = () => {
    setFormData({
      ...formData,
      splits: [...formData.splits, { address: '', bps: 0 }]
    })
  }

  const removeSplit = (index) => {
    const newSplits = formData.splits.filter((_, i) => i !== index)
    setFormData({ ...formData, splits: newSplits })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!account || !file) return

    setIsUploading(true)
    try {
      // 1) Pin file to IPFS via backend
      const arrayBuffer = await file.arrayBuffer()
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
      const { cid: assetCID } = await apiClient.pinClip({ filename: file.name, dataBase64: base64 })

      // 2) Call on-chain createClip
      const signer = await getSigner()
      const clipLicenseAbi = [
        "function createClip(string assetCID, uint256 price, uint32 durationDays, address[] splits, uint16[] splitBps) external returns (uint256 clipId)"
      ]
      const contract = new ethers.Contract(CONTRACT_ADDRESS, clipLicenseAbi, signer)

      const priceWei = parseUSX(formData.price)
      const duration = parseInt(formData.durationDays, 10)
      const splitsFiltered = formData.splits.filter(s => s.address && Number(s.bps) > 0)
      const splitAddrs = splitsFiltered.map(s => s.address)
      const splitBps = splitsFiltered.map(s => parseInt(s.bps, 10))

      const tx = await contract.createClip(assetCID, priceWei, duration, splitAddrs, splitBps)
      const receipt = await tx.wait()

      // Try to extract clipId from events (optional fallback sets undefined)
      let onchainClipId
      try {
        const iface = new ethers.Interface(clipLicenseAbi.concat(["event ClipCreated(uint256 clipId, address creator, uint256 price, uint32 durationDays, string assetCID)"]))
        for (const log of receipt.logs) {
          try {
            const parsed = iface.parseLog(log)
            if (parsed && parsed.name === 'ClipCreated') {
              onchainClipId = Number(parsed.args.clipId.toString())
              break
            }
          } catch (_) {}
        }
      } catch (_) {}

      // 3) Create off-chain record
      const clipData = {
        title: formData.title,
        description: formData.description,
        price: priceWei.toString(),
        durationDays: duration,
        creator: account,
        assetCID,
        splits: splitsFiltered,
        ...(onchainClipId ? { onchainClipId } : {})
      }
      await apiClient.createClip(clipData)
      
      // Reset form after successful upload
      setFormData({
        title: '',
        description: '',
        price: '1.0',
        durationDays: '7',
        licenseType: LICENSE_TYPES.COMMERCIAL,
        splits: [{ address: '', bps: 10000 }]
      })
      setFile(null)
      setPreviewUrl('')
      
      alert('Clip created on-chain and published!')
      
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const totalBps = formData.splits.reduce((sum, split) => sum + (parseInt(split.bps) || 0), 0)

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Clip File
          </label>
          <div className="border-2 border-dashed border-navy-600 rounded-lg p-6 text-center hover:border-navy-500 transition-colors">
            {previewUrl ? (
              <div className="relative">
                <video
                  src={previewUrl}
                  className="max-h-64 mx-auto rounded-lg"
                  controls
                />
                <button
                  type="button"
                  onClick={() => {
                    setFile(null)
                    setPreviewUrl('')
                  }}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 rounded-full p-1"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="btn-primary cursor-pointer">
                    Choose File
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept="video/*,image/*,audio/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <p className="text-gray-400 text-sm mt-2">
                    MP4, MOV, GIF, or MP3 files supported
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="input-field w-full"
            placeholder="Enter a descriptive title"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="input-field w-full"
            placeholder="Describe your clip and how it can be used..."
          />
        </div>

        {/* Price and Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-2">
              Price (USX)
            </label>
            <input
              type="number"
              id="price"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              step="0.1"
              min="0.1"
              className="input-field w-full"
              required
            />
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-300 mb-2">
              License Duration
            </label>
            <select
              id="duration"
              value={formData.durationDays}
              onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
              className="input-field w-full"
            >
              {Object.entries(LICENSE_DURATIONS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Revenue Splits */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-300">
              Revenue Splits
            </label>
            <button
              type="button"
              onClick={addSplit}
              className="flex items-center space-x-1 text-blue-500 hover:text-blue-400 text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Split</span>
            </button>
          </div>

          <div className="space-y-3">
            {formData.splits.map((split, index) => (
              <div key={index} className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="Wallet address (0x...)"
                  value={split.address}
                  onChange={(e) => handleSplitChange(index, 'address', e.target.value)}
                  className="input-field flex-1"
                />
                <input
                  type="number"
                  placeholder="BPS"
                  value={split.bps}
                  onChange={(e) => handleSplitChange(index, 'bps', parseInt(e.target.value) || 0)}
                  className="input-field w-24"
                  min="0"
                  max="10000"
                />
                {formData.splits.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSplit(index)}
                    className="p-2 text-red-500 hover:text-red-400"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {totalBps !== 10000 && (
            <p className="text-red-400 text-sm mt-2">
              Total splits must equal 10000 BPS (100%). Current: {totalBps} BPS
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isUploading || !file || totalBps !== 10000}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Uploading...' : 'Publish License'}
        </button>
      </form>
    </div>
  )
}

export default UploadForm