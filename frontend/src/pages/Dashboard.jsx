import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import ContentCard from '../components/ContentCard'
import LicenseCard from '../components/LicenseCard'
import { Package, ShoppingBag, DollarSign, TrendingUp } from 'lucide-react'
import { formatUSX } from '../utils/wallet'
import { apiClient } from '../utils/api'

const Dashboard = () => {
  const { account, isConnected, clips, licenses } = useApp()
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({
    totalEarnings: '0',
    totalSales: 0,
    activeLicenses: 0,
    clipsUploaded: 0
  })

  useEffect(() => {
    if (isConnected) {
      loadDashboardData()
    }
  }, [isConnected, account])

  const loadDashboardData = async () => {
    try {
      // In a real implementation, these would be API calls
      // const earningsData = await apiClient.getEarnings(account)
      // const licensesData = await apiClient.getLicenses(account)
      
      // Mock data for demo
      setStats({
        totalEarnings: '2500000000000000000', // 2.5 USX
        totalSales: 12,
        activeLicenses: 8,
        clipsUploaded: clips.length
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
  }

  const userClips = clips.filter(clip => clip.creator === account)
  const userLicenses = licenses.filter(license => license.buyer === account)

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-navy-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Package className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-400 mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-gray-500">
            Please connect your wallet to view your dashboard
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">
            Manage your content, track earnings, and view your licenses
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Earnings</p>
                <p className="text-2xl font-bold text-white">
                  {formatUSX(stats.totalEarnings)} USX
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Sales</p>
                <p className="text-2xl font-bold text-white">{stats.totalSales}</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Licenses</p>
                <p className="text-2xl font-bold text-white">{stats.activeLicenses}</p>
              </div>
              <Package className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Clips Uploaded</p>
                <p className="text-2xl font-bold text-white">{stats.clipsUploaded}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card">
          <div className="border-b border-navy-700 mb-6">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', name: 'Overview' },
                { id: 'myClips', name: 'My Clips' },
                { id: 'myLicenses', name: 'My Licenses' },
                { id: 'earnings', name: 'Earnings' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-500'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {userLicenses.slice(0, 5).map((license) => (
                      <div key={license.licenseId} className="flex items-center justify-between p-3 bg-navy-700 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{license.clip?.title}</p>
                          <p className="text-gray-400 text-sm">
                            Licensed for {formatUSX(license.price)} USX
                          </p>
                        </div>
                        <p className="text-gray-400 text-sm">
                          {new Date(license.startTs).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'myClips' && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Your Uploaded Clips</h3>
                {userClips.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userClips.map((clip) => (
                      <ContentCard key={clip.id} clip={clip} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">You haven't uploaded any clips yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'myLicenses' && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Your Licenses</h3>
                {userLicenses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userLicenses.map((license) => (
                      <LicenseCard key={license.licenseId} license={license} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">You haven't purchased any licenses yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'earnings' && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Earnings History</h3>
                <div className="space-y-3">
                  {userClips.map((clip) => (
                    <div key={clip.id} className="flex items-center justify-between p-4 bg-navy-700 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{clip.title}</p>
                        <p className="text-gray-400 text-sm">5 sales</p>
                      </div>
                      <p className="text-green-500 font-semibold">
                        {formatUSX('500000000000000000')} USX
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard