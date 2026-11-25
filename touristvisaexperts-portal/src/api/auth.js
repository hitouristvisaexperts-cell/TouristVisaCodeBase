import api from './axios'

export const login = (email, password, portal = 'client') =>
  api.post('/auth/login', { email, password, portal })

export const adminLogin = (email, password) =>
  api.post('/auth/admin/login', { email, password, portal: 'admin' })

// Continue with Google — consents only needed the first time (new account)
export const googleLogin = (credential, consents) =>
  api.post('/auth/google', consents ? { credential, consents } : { credential })

export const getMe = () => api.get('/auth/me')

export const logout = () => api.post('/auth/logout')

export const changePassword = (currentPassword, newPassword) =>
  api.post('/auth/change-password', { currentPassword, newPassword })

export const register = (data) => api.post('/auth/register', data)

export const verifyRegistrationOtp = (email, otp) =>
  api.post('/auth/verify-registration-otp', { email, otp })

export const resendRegistrationOtp = (email) =>
  api.post('/auth/resend-registration-otp', { email })

export const forgotPassword = (email) => api.post('/auth/forgot-password', { email })

export const resetPassword = (token, password) => api.put(`/auth/reset-password/${token}`, { password })
