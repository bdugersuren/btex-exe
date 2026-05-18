import { AxiosResponse, InternalAxiosRequestConfig, AxiosError } from 'axios'

export function requestInterceptor(config: InternalAxiosRequestConfig) {
  return config
}

export function responseInterceptor(response: AxiosResponse) {
  return response
}

export function errorInterceptor(error: AxiosError) {
  const message =
    (error.response?.data as { error?: { message?: string } })?.error?.message ??
    error.message ??
    'Сүлжээний алдаа гарлаа'

  return Promise.reject(new Error(message))
}
