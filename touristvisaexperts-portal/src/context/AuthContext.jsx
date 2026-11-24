import { createContext, useContext, useState, useEffect } from 'react'
import { getMe, logout as logoutRequest } from '../api/auth'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('fv_user')
      if (!stored || stored === 'undefined' || stored === 'null') return null
      return JSON.parse(stored)
    } catch {
      localStorage.removeItem('fv_user')
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('fv_token')
    if (!token) {
      setLoading(false)
      return
    }
    getMe()
      .then((res) => {
        setUser(res.data.user)
        localStorage.setItem('fv_user', JSON.stringify(res.data.user))
      })
      .catch(() => {
        localStorage.removeItem('fv_token')
        localStorage.removeItem('fv_user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const loginUser = (token, userData) => {
    if (token) localStorage.setItem('fv_token', token)
    if (userData) localStorage.setItem('fv_user', JSON.stringify(userData))
    setUser(userData || null)
  }

  const logout = async () => {
    localStorage.removeItem('fv_token')
    localStorage.removeItem('fv_user')
    setUser(null)
    // Wait for the shared cross-subdomain session cookie to be cleared before
    // leaving, otherwise the marketing site would still see us as logged in.
    try { await logoutRequest() } catch { /* cookie may already be gone */ }
    window.location.href = import.meta.env.VITE_MARKETING_URL || 'https://touristvisaexperts.com'
  }

  const updateUser = (patch) => {
    const updated = { ...user, ...patch }
    if (updated) localStorage.setItem('fv_user', JSON.stringify(updated))
    setUser(updated)
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
