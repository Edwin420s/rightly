import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import ContentCard from '../components/ContentCard'
import { Search, Filter, Grid, List } from 'lucide-react'
import { apiClient } from '../utils/api'

const Marketplace = () => {
  const { clips, setClips } = useApp()
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    duration: '',
    sortBy: 'newest'
  })

  useEffect(() => {
    loadClips()
  }, [])

  const loadClips = async () => {
    try {
      setLoading(true)
      // In a real implementation, this would be an API call
      // const data = await apiClient.getClips()
      // setClips(data.clips)
      
      // Mock data for demo
      setTimeout(() => {
        setClips([
          {
            id: '1',
            title: 'Urban City Time Lapse',
            description: 'Beautiful time lapse of city traffic at night with neon lights',
            price: '1000000000000000000', // 1 USX
            durationDays: 7,
            creator: '0x742d35Cc6634C0532925a3b8D4C9b2a3b8D4C9b2',
            assetCID: 'QmXyz...',
            thumbnailCID: 'QmAbc...'
          },
          {
            id: '2',
            title: 'Abstract Motion Graphics',
            description: 'Smooth abstract animations perfect for background visuals',
            price: '2000000000000000000', // 2 USX
            durationDays: 30,
            creator: '0x842d35Cc6634C0532925a3b8D4C9b2a3b8D4C9b3',
            assetCID: 'QmDef...',
            thumbnailCID: 'QmDef...'
          }
        ])
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Failed to load clips:', error)
      setLoading(false)
    }
  }

  const filteredClips = clips.filter(clip =>
    clip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clip.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Marketplace</h1>
          <p className="text-gray-400">
            Discover and license amazing short-form content from creators worldwide
          </p>
        </div>

        {/* Search and Filters */}
        <div className="card mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search clips by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field w-full pl-10"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center space-x-2 bg-navy-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${
                  viewMode === 'grid' ? 'bg-navy-600 text-white' : 'text-gray-400'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${
                  viewMode === 'list' ? 'bg-navy-600 text-white' : 'text-gray-400'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Filter Button */}
            <button className="btn-secondary flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Results */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <p className="text-gray-400">
              {filteredClips.length} clip{filteredClips.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {filteredClips.length > 0 ? (
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }>
              {filteredClips.map((clip) => (
                <ContentCard key={clip.id} clip={clip} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                No clips found
              </h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? `No results for "${searchTerm}". Try a different search term.`
                  : 'No clips available in the marketplace yet.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Marketplace