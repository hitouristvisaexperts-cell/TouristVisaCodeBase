import api from './axios'

export const getCases = () => api.get('/client/cases')
export const getStatus = (clientId) => api.get('/client/status', { params: { clientId } })
export const getDocuments = (clientId) => api.get('/client/documents', { params: { clientId } })
export const uploadDocument = (file, category, notes, familyMember = '', clientId) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      api.post('/client/documents', {
        originalName: file.name,
        mimeType: file.type,
        category,
        notes,
        data: base64,
        familyMember,
        clientId,
      }).then(resolve).catch(reject)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
export const getMeetings = (clientId) => api.get('/client/meetings', { params: { clientId } })
export const getNotifications = () => api.get('/client/notifications')
export const markRead = (id) => api.put(`/client/notifications/${id}/read`)
export const getNotes = (clientId) => api.get('/client/notes', { params: { clientId } })
export const getFAQs = () => api.get('/faqs')
export const sendSupport = (data) => api.post('/client/support', data)
export const confirmDocument = (docId, action, clientId) =>
  api.put(`/client/documents/${docId}/confirm`, { action, clientId })
export const downloadDocument = (docId, clientId) =>
  api.get(`/client/documents/${docId}/download`, { params: { clientId }, responseType: 'blob' })
export const deleteDocument = (docId, clientId) =>
  api.delete(`/client/documents/${docId}`, { params: { clientId } })
export const raiseEscalation = (data, clientId) => api.post('/client/escalate', { ...data, clientId })
export const raiseFlag = (data, clientId) => api.put('/client/flag', { ...data, clientId })
export const updateFamilyMembers = (members, clientId) =>
  api.put('/client/family-members', { familyMembers: members, clientId })
export const createAddMembersOrder = (count, clientId) => api.post('/client/add-members/create-order', { count, clientId })
export const verifyAddMembersPayment = (data, clientId) =>
  api.post('/client/add-members/verify', { ...data, clientId })
