import axios from 'axios'

// Має бути:
export const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Єдина точка обробки помилок мережі/сервера для всіх модулів.
// Кожен виклик повертає або data, або кидає Error з людським повідомленням,
// яке потім показуємо в toast (буде підключено в Модулі 2+).
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const detail = error.response?.data?.detail

    let message = 'Не вдалося з\u2019єднатися з сервером. Перевірте, чи запущено бекенд на ' + BASE_URL
    if (status) {
      message = detail || `Помилка сервера (код ${status})`
    }

    return Promise.reject(new Error(message))
  }
)

// client.js — додати interceptor
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default client
