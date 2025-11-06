import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import WalletButton from './WalletButton'
import { Camera, Search, Menu, X } from 'lucide-react'
import { useState } from 'react'

const Navbar = () => {
  const { isConnected, account } = useApp()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Discover', href: '/', current: location.pathname === '/' },
    { name: 'Marketplace', href: '/marketplace', current: location.pathname === '/marketplace' },
    { name: 'Upload', href: '/upload', current: location.pathname === '/upload' },
    { name: 'Dashboard', href: '/dashboard', current: location.pathname === '/dashboard' },
  ]

  return (
    <nav className="bg-navy-800 border-b border-navy-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Camera className="h-8 w-8 text-blue-500" />
              <span className="text-xl font-bold text-white">Rightly</span>
            </Link>
            
            {/* Desktop navigation */}
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    item.current
                      ? 'bg-navy-900 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-navy-700'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Search and wallet section */}
          <div className="flex items-center space-x-4">
            {/* Search bar - hidden on mobile */}
            <div className="hidden md:block relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search clips..."
                className="input-field pl-10 pr-4 py-2 w-64"
              />
            </div>

            {/* Wallet button */}
            <WalletButton />

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-navy-700"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-navy-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    item.current
                      ? 'bg-navy-900 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-navy-700'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile search */}
              <div className="px-3 py-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search clips..."
                    className="input-field pl-10 pr-4 py-2 w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar