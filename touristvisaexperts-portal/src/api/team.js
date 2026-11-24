import api from './axios'

export const getMyClients = (params) => api.get('/team/clients', { params })
export const getClient = (id) => api.get(`/team/clients/${id}`)
export const updateTask = (id, data) => api.put(`/team/clients/${id}/tasks`, data)
export const updateStatus = (id, clientStatus) =>
  api.put(`/team/clients/${id}/status`, { clientStatus })

export const scheduleMeeting = (id, data) => api.post(`/team/clients/${id}/meeting`, data)

export const getNotes = (id) => api.get(`/team/clients/${id}/notes`)
export const addNote = (id, data) => api.post(`/team/clients/${id}/notes`, data)

export const getDocuments = (id) => api.get(`/team/clients/${id}/documents`)
export const uploadDocument = (id, formData) =>
  api.post(`/team/clients/${id}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
export const downloadDocument = (clientId, docId) =>
  api.get(`/team/clients/${clientId}/documents/${docId}/download`, { responseType: 'blob' })

export const runOCR = (clientId, docId) =>
  api.post(`/team/clients/${clientId}/documents/${docId}/ocr`)
export const saveExtracted = (clientId, docId, extractedData) =>
  api.put(`/team/clients/${clientId}/documents/${docId}/extracted`, { extractedData })

export const raiseEscalation = (clientId, data) =>
  api.post(`/team/clients/${clientId}/escalate`, data)
export const resolveFlag = (clientId) =>
  api.put(`/team/clients/${clientId}/flag/resolve`)
export const raiseClientFlag = (clientId, message) =>
  api.put(`/team/clients/${clientId}/flag`, { message })

export const getNotifications = () => api.get('/team/notifications')
export const markRead = (id) => api.put(`/team/notifications/${id}/read`)
export const markAllRead = () => api.put('/team/notifications/mark-all-read')
