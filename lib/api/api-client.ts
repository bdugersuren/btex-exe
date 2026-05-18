import axios from 'axios'
import { requestInterceptor, responseInterceptor, errorInterceptor } from './interceptors'

export const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

apiClient.interceptors.request.use(requestInterceptor)
apiClient.interceptors.response.use(responseInterceptor, errorInterceptor)
