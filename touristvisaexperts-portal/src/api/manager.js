import api from './axios'

export const getDashboard    = ()           => api.get('/manager/dashboard')
export const getClients      = (params)     => api.get('/manager/clients', { params })
export const getClient       = (id)         => api.get(`/manager/clients/${id}`)
export const assignClient    = (id, assignedTo) => api.put(`/manager/clients/${id}/assign`, { assignedTo })
export const getClientActivity = (id)       => api.get(`/manager/clients/${id}/activity`)
export const getTeam         = ()           => api.get('/manager/team')
export const getEscalations  = (params)     => api.get('/manager/escalations', { params })
export const acknowledgeEscalation = (id)   => api.put(`/manager/escalations/${id}/acknowledge`)

export const updateTask  = (clientId, data)  => api.put(`/manager/clients/${clientId}/tasks`, data)
export const updateStatus = (clientId, data) => api.put(`/manager/clients/${clientId}/status`, data)
export const scheduleMeeting = (clientId, data) => api.post(`/manager/clients/${clientId}/meeting`, data)
export const addNote     = (clientId, data)  => api.post(`/manager/clients/${clientId}/notes`, data)
export const getNotes    = (clientId)        => api.get(`/manager/clients/${clientId}/notes`)
export const getDocuments = (clientId)       => api.get(`/manager/clients/${clientId}/documents`)
export const uploadDocument = (clientId, formData) =>
  api.post(`/manager/clients/${clientId}/documents`, formData)
export const downloadDocument = (clientId, docId) =>
  api.get(`/manager/clients/${clientId}/documents/${docId}/download`, { responseType: 'blob' })

export const runOCR          = (clientId, docId)  => api.post(`/manager/clients/${clientId}/documents/${docId}/ocr`)
export const saveExtracted   = (clientId, docId, data) => api.put(`/manager/clients/${clientId}/documents/${docId}/extracted`, data)
export const raiseEscalation = (clientId, data)  => api.post(`/manager/clients/${clientId}/escalate`, data)
export const resolveFlag     = (clientId)         => api.put(`/manager/clients/${clientId}/flag/resolve`)
export const raiseClientFlag = (clientId, data)   => api.put(`/manager/clients/${clientId}/flag`, data)

export const getNotifications = () => api.get('/manager/notifications')
export const markRead  = (id)      => api.put(`/manager/notifications/${id}/read`)
export const markAllRead = ()      => api.put('/manager/notifications/mark-all-read')
