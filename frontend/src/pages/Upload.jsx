import React from 'react'
import { useApp } from '../context/AppContext'
import UploadForm from '../components/UploadForm'
import { Navigate } from 'react-router-dom'
import { Upload, Shield, DollarSign, Users } from 'lucide-react'

const Upload = () => {
  const { isConnected } = useApp()

  if (!isConnected) {
    return <Navigate to="/" replace />
  }

  const steps = [
    {
      icon: <Upload className="h-6 w-6" />,
      title: 'Upload Your Clip',
      description: 'Upload your short-form video, audio, or visual content'
    },
    {
      icon: <DollarSign className="h-6 w-6" />,
      title: 'Set License Terms',
      description: 'Choose price, duration, and revenue splits for collaborators'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Publish on Chain',
      description: 'Your license terms are recorded permanently on Scroll zkEVM'
    }
  ]

  return (
    <div className="min-h-screen bg-navy-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-4">Upload Your Content</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            License your short-form content on-chain and earn fairly from every purchase
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {steps.map((step, index) => (
            <div key={index} className="card text-center">
              <div className="text-blue-500 mb-4 flex justify-center">
                {step.icon}
              </div>
              <h3 className="font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-gray-400 text-sm">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Upload Form */}
        <div className="card">
          <UploadForm />
        </div>

        {/* Tips */}
        <div className="card mt-8">
          <h3 className="font-semibold text-white mb-4 flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-500" />
            <span>Tips for Success</span>
          </h3>
          <ul className="text-gray-400 space-y-2 text-sm">
            <li>• Use descriptive titles and detailed descriptions</li>
            <li>• Set fair prices based on content quality and market rates</li>
            <li>• Consider shorter durations for lower prices to attract more buyers</li>
            <li>• Set up revenue splits upfront for any collaborators</li>
            <li>• Ensure you have the rights to license the content you upload</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Upload