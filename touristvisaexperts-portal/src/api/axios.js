import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fv_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally — redirect to login for expired sessions, but allow login errors through
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginReq = err.config?.url?.includes('/auth/login')
    const isOnLoginPage = typeof window !== 'undefined' && window.location.pathname.includes('/login')
    if (err.response?.status === 401 && !isLoginReq && !isOnLoginPage) {
      localStorage.removeItem('fv_token')
      localStorage.removeItem('fv_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
