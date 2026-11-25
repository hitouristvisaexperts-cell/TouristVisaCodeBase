import api from './axios'

export const getDashboard = () => api.get('/admin/dashboard')

export const getClients = (params) => api.get('/admin/clients', { params })
export const getClient = (id) => api.get(`/admin/clients/${id}`)
export const getClientDocuments = (id) => api.get(`/admin/clients/${id}/documents`)
export const downloadClientDocument = (clientId, docId) =>
  api.get(`/admin/clients/${clientId}/documents/${docId}/download`, { responseType: 'blob' })
export const createClient = (data) => api.post('/admin/clients', data)
export const updateClient = (id, data) => api.put(`/admin/clients/${id}`, data)
export const assignClient = (id, assignedTo) =>
  api.put(`/admin/clients/${id}/assign`, { assignedTo })
export const updateStatus = (id, clientStatus) =>
  api.put(`/admin/clients/${id}/status`, { clientStatus })

export const getTeam = () => api.get('/admin/team')
export const createTeamMember = (data) => api.post('/admin/team', data)
export const toggleTeamStatus = (id) => api.put(`/admin/team/${id}/status`)

export const getFAQs = () => api.get('/faqs')
export const createFAQ = (data) => api.post('/admin/faqs', data)
export const updateFAQ = (id, data) => api.put(`/admin/faqs/${id}`, data)
export const deleteFAQ = (id) => api.delete(`/admin/faqs/${id}`)

export const getAuditLogs = (params) => api.get('/admin/audit-logs', { params })

export const getSettings = () => api.get('/settings')
export const updateSettings = (data) => api.put('/settings', data)
export const getPricing = () => api.get('/settings/pricing')
export const updatePricing = (data) => api.put('/settings', { pricing: JSON.stringify(data) })
export const getCashback = () => api.get('/settings/pricing').then(r => r) // reuses settings endpoint
export const updateCashback = (data) => api.put('/settings', { cashback: JSON.stringify(data) })

export const getEscalations = (params) => api.get('/admin/escalations', { params })
export const acknowledgeEscalation = (id) => api.put(`/admin/escalations/${id}/acknowledge`)
export const resolveEscalation = (id, resolutionNote) =>
  api.put(`/admin/escalations/${id}/resolve`, { resolutionNote })
export const getClientActivity = (clientId) => api.get(`/admin/clients/${clientId}/activity`)
export const grantAccess = (id, isPurchased) => api.put(`/admin/clients/${id}/access`, { isPurchased })
export const processRefund = (id, data) => api.post(`/admin/clients/${id}/refund`, data)

export const getFlightOrders = (params) => api.get('/flight', { params })
export const updateFlightOrder = (id, data) => api.put(`/flight/${id}`, data)

export const getArticles    = ()         => api.get('/admin/articles')
export const createArticle  = (data)     => api.post('/admin/articles', data)
export const updateArticle  = (id, data) => api.put(`/admin/articles/${id}`, data)
export const deleteArticle  = (id)       => api.delete(`/admin/articles/${id}`)

// Testimonials (client reviews shown on the website)
export const getTestimonials          = ()         => api.get('/admin/testimonials')
export const createTestimonial        = (data)     => api.post('/admin/testimonials', data)
export const updateTestimonial        = (id, data) => api.put(`/admin/testimonials/${id}`, data)
export const deleteTestimonial        = (id)       => api.delete(`/admin/testimonials/${id}`)
export const reorderTestimonials      = (ids)      => api.put('/admin/testimonials/reorder', { ids })
export const importDefaultTestimonials = ()        => api.post('/admin/testimonials/import-defaults')

export const getNotifications = () => api.get('/admin/notifications')
export const markRead = (id) => api.put(`/admin/notifications/${id}/read`)
export const markAllRead = () => api.put('/admin/notifications/mark-all-read')
