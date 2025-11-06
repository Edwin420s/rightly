import axios from 'axios'
import { BACKEND_API } from './constants'

const api = axios.create({
  baseURL: BACKEND_API,
  timeout: 10000,
})

export const apiClient = {
  // Clip endpoints
  getClips: async (page = 1, limit = 20) => {
    const response = await api.get(`/clips?page=${page}&limit=${limit}`)
    return response.data
  },

  getClip: async (id) => {
    const response = await api.get(`/clips/${id}`)
    return response.data
  },

  createClip: async (clipData) => {
    const response = await api.post('/clips', clipData)
    return response.data
  },

  // License endpoints
  getLicenses: async (address) => {
    const response = await api.get(`/licenses?address=${address}`)
    return response.data
  },

  getLicense: async (licenseId) => {
    const response = await api.get(`/licenses/${licenseId}`)
    return response.data
  },

  // Relayer endpoints
  submitBuyIntent: async (buyData) => {
    const response = await api.post('/relayer/buy', buyData)
    return response.data
  },

  // Receipt endpoints
  getReceipt: async (licenseId) => {
    const response = await api.get(`/receipts/${licenseId}`)
    return response.data
  },

  // Nonce endpoints
  getNonce: async (address) => {
    const response = await api.get(`/nonce/${address}`)
    return response.data
  },
}

export default api