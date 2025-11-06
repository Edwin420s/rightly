import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { connectWallet, getCurrentAccount, getProvider } from '../utils/wallet'

const AppContext = createContext()

const initialState = {
  account: null,
  isConnected: false,
  clips: [],
  licenses: [],
  loading: false,
  error: null
}

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ACCOUNT':
      return { 
        ...state, 
        account: action.payload,
        isConnected: !!action.payload
      }
    case 'SET_CLIPS':
      return { ...state, clips: action.payload }
    case 'SET_LICENSES':
      return { ...state, licenses: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  useEffect(() => {
    checkWalletConnection()
  }, [])

  const checkWalletConnection = async () => {
    try {
      const account = await getCurrentAccount()
      if (account) {
        dispatch({ type: 'SET_ACCOUNT', payload: account })
      }
    } catch (error) {
      console.log('No wallet connected')
    }
  }

  const connect = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'CLEAR_ERROR' })
      
      const account = await connectWallet()
      dispatch({ type: 'SET_ACCOUNT', payload: account })
      
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error.message || 'Failed to connect wallet' 
      })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const disconnect = () => {
    dispatch({ type: 'SET_ACCOUNT', payload: null })
  }

  const value = {
    ...state,
    connect,
    disconnect
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}