import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { getCases } from '../api/client'

const ClientCaseContext = createContext(null)

const storageKey = (userId) => `fv_active_case_${userId}`

export const ClientCaseProvider = ({ children }) => {
  const { user } = useAuth()
  const [cases, setCases] = useState([])
  const [activeCaseId, setActiveCaseIdState] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    if (!user || user.role !== 'client') { setLoading(false); return }
    setLoading(true)
    getCases()
      .then((res) => {
        const list = res.data.data || []
        setCases(list)
        setActiveCaseIdState((prev) => {
          if (prev && list.some((c) => c._id === prev)) return prev
          const stored = localStorage.getItem(storageKey(user.id))
          if (stored && list.some((c) => c._id === stored)) return stored
          return list[0]?._id || null
        })
      })
      .catch(() => setCases([]))
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  const setActiveCaseId = (id) => {
    setActiveCaseIdState(id)
    if (user) localStorage.setItem(storageKey(user.id), id || '')
  }

  return (
    <ClientCaseContext.Provider value={{ cases, activeCaseId, setActiveCaseId, loading, refresh }}>
      {children}
    </ClientCaseContext.Provider>
  )
}

export const useClientCase = () => useContext(ClientCaseContext)
