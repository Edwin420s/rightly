import { formatUnits } from 'ethers'

export const formatCurrency = (amount, decimals = 18) => {
  return parseFloat(formatUnits(amount, decimals)).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  })
}

export const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const formatDateTime = (timestamp) => {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const truncateAddress = (address, startLength = 6, endLength = 4) => {
  if (!address) return ''
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`
}

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export const capitalizeFirst = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
}

export const formatLicenseType = (type) => {
  const types = {
    commercial: 'Commercial',
    personal: 'Personal',
    educational: 'Educational'
  }
  return types[type] || capitalizeFirst(type)
}