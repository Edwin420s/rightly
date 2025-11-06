import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { BarChart, TrendingUp, Users, DollarSign, Download, Eye } from 'lucide-react'
import { formatUSX, formatAddress } from '../utils/wallet'
import { apiClient } from '../utils/api'

const CreatorDashboard = () => {
  const { account, clips } = useApp()
  const [analytics, setAnalytics] = useState({
    totalRevenue: '0',
    monthlyRevenue: '0',
    totalSales: 0,
    activeLicenses: 0,
    clipViews: 0,
    conversionRate: 0
  })
  const [recentSales, setRecentSales] = useState([])
  const [topClips, setTopClips] = useState([])
  const [timeRange, setTimeRange] = useState('30d') // 7d, 30d, 90d, 1y

  useEffect(() => {
    if (account) {
      loadCreatorData()
    }
  }, [account, timeRange])

  const loadCreatorData = async () => {
    try {
      // Mock data for demo
      setAnalytics({
        totalRevenue: '4500000000000000000', // 4.5 USX
        monthlyRevenue: '1500000000000000000', // 1.5 USX
        totalSales: 23,
        activeLicenses: 15,
        clipViews: 1247,
        conversionRate: 1.84
      })

      setRecentSales([
        {
          id: '1',
          clipTitle: 'Urban City Time Lapse',
          buyer: '0x892d35Cc6634C0532925a3b8D4C9b2a3b8D4C9b4',
          amount: '1000000000000000000',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          clipTitle: 'Abstract Motion Graphics',
          buyer: '0x992d35Cc6634C0532925a3b8D4C9b2a3b8D4C9b5',
          amount: '2000000000000000000',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
        }
      ])

      setTopClips([
        {
          id: '1',
          title: 'Urban City Time Lapse',
          sales: 12,
          revenue: '2500000000000000000',
          views: 456
        },
        {
          id: '2',
          title: 'Abstract Motion Graphics',
          sales: 8,
          revenue: '1600000000000000000',
          views: 321
        }
      ])
    } catch (error) {
      console.error('Failed to load creator data:', error)
    }
  }

  const userClips = clips.filter(clip => clip.creator === account)

  const stats = [
    {
      label: 'Total Revenue',
      value: formatUSX(analytics.totalRevenue) + ' USX',
      change: '+12.5%',
      icon: DollarSign,
      color: 'text-green-500'
    },
    {
      label: 'Monthly Revenue',
      value: formatUSX(analytics.monthlyRevenue) + ' USX',
      change: '+5.2%',
      icon: TrendingUp,
      color: 'text-blue-500'
    },
    {
      label: 'Total Sales',
      value: analytics.totalSales.toString(),
      change: '+8.3%',
      icon: Users,
      color: 'text-purple-500'
    },
    {
      label: 'Active Licenses',
      value: analytics.activeLicenses.toString(),
      change: '+15.7%',
      icon: BarChart,
      color: 'text-orange-500'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Creator Analytics</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="input-field w-32"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                <p className="text-green-500 text-sm mt-1">{stat.change}</p>
              </div>
              <div className={`p-3 rounded-full bg-navy-700 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Sales</h3>
          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 bg-navy-700 rounded-lg">
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{sale.clipTitle}</p>
                  <p className="text-gray-400 text-xs">
                    {formatAddress(sale.buyer)} • {new Date(sale.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-green-500 font-semibold text-sm">
                    {formatUSX(sale.amount)} USX
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Clips */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Top Performing Clips</h3>
          <div className="space-y-3">
            {topClips.map((clip) => (
              <div key={clip.id} className="flex items-center justify-between p-3 bg-navy-700 rounded-lg">
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{clip.title}</p>
                  <div className="flex items-center space-x-4 text-gray-400 text-xs mt-1">
                    <span className="flex items-center space-x-1">
                      <Eye className="h-3 w-3" />
                      <span>{clip.views} views</span>
                    </span>
                    <span>{clip.sales} sales</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-500 font-semibold text-sm">
                    {formatUSX(clip.revenue)} USX
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">{analytics.conversionRate}%</div>
            <p className="text-gray-400 text-sm">Conversion Rate</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">{analytics.clipViews}</div>
            <p className="text-gray-400 text-sm">Total Views</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {userClips.length}
            </div>
            <p className="text-gray-400 text-sm">Clips Uploaded</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="btn-primary flex items-center justify-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </button>
          <button className="btn-secondary flex items-center justify-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>View Analytics</span>
          </button>
          <button className="btn-secondary flex items-center justify-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Audience Insights</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreatorDashboard