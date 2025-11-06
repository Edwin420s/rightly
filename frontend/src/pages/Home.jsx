import React from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import ContentCard from '../components/ContentCard'
import { Play, Upload, Shield, Zap } from 'lucide-react'

const Home = () => {
  const { clips } = useApp()

  const featuredClips = clips.slice(0, 6)

  const features = [
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'On-Chain Proof',
      description: 'Every license is permanently recorded on Scroll zkEVM with tamper-proof verification.'
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: 'Instant Settlement',
      description: 'Creators receive payments immediately in USX stablecoin with automatic revenue splits.'
    },
    {
      icon: <Play className="h-8 w-8" />,
      title: 'Simple Licensing',
      description: 'Buy commercial licenses for short-form content in just a few clicks.'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-navy-800 to-navy-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              License Content
              <span className="text-blue-500 block">Rightly</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              The on-chain marketplace for micro-licensing short-form content. 
              Fair for creators, simple for buyers, transparent for everyone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/marketplace" className="btn-primary text-lg px-8 py-3">
                Discover Clips
              </Link>
              <Link to="/upload" className="btn-secondary text-lg px-8 py-3 flex items-center justify-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Upload Content</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Why Choose Rightly?
            </h2>
            <p className="text-gray-400 text-lg">
              Built on Scroll zkEVM for fast, low-cost, and transparent licensing
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card text-center">
                <div className="text-blue-500 mb-4 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Clips Section */}
      <section className="py-20 bg-navy-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Featured Clips
              </h2>
              <p className="text-gray-400">
                Discover amazing short-form content available for licensing
              </p>
            </div>
            <Link to="/marketplace" className="btn-secondary">
              View All
            </Link>
          </div>

          {featuredClips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredClips.map((clip) => (
                <ContentCard key={clip.id} clip={clip} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Play className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                No clips available yet
              </h3>
              <p className="text-gray-500 mb-6">
                Be the first to upload content to the marketplace
              </p>
              <Link to="/upload" className="btn-primary">
                Upload Your First Clip
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to License Content Rightly?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Join creators and buyers building the future of transparent content licensing
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/upload" className="btn-primary bg-white text-blue-600 hover:bg-blue-50">
              Start Uploading
            </Link>
            <Link to="/marketplace" className="btn-secondary bg-blue-700 hover:bg-blue-800">
              Browse Marketplace
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home