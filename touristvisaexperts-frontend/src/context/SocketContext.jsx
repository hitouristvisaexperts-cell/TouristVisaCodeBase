import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import api from '../api/axios'

const SocketContext = createContext(null)

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://shop.touristvisaexperts.com'

export const SocketProvider = ({ children }) => {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [latestNotif, setLatestNotif] = useState(null)

  // Load initial unread count from REST API for all roles
  useEffect(() => {
    if (!user?.role) return
    const endpoint =
      user.role === 'admin' ? '/admin/notifications' :
      user.role === 'team'  ? '/team/notifications'  :
                               '/client/notifications'
    api.get(endpoint)
      .then(res => {
        const notifications = res.data.data || []
        setUnreadCount(notifications.filter(n => !n.isRead).length)
      })
      .catch(() => {})
  }, [user?._id])

  // Real-time socket connection
  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect()
      socketRef.current = null
      return
    }

    const token = localStorage.getItem('fv_token')
    if (!token) return

    const s = io(API_BASE, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    s.on('notification', (notif) => {
      setUnreadCount((c) => c + 1)
      setLatestNotif(notif)
    })

    socketRef.current = s

    return () => {
      s.disconnect()
      socketRef.current = null
    }
  }, [user?._id])

  const clearUnread = () => setUnreadCount(0)

  return (
    <SocketContext.Provider value={{ unreadCount, clearUnread, latestNotif }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
