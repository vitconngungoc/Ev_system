import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api/apiClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '')
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) return
      try {
        const { data } = await api.get('/profile/me')
        setUser(data)
        localStorage.setItem('user', JSON.stringify(data))
      } catch {
        localStorage.removeItem('token'); localStorage.removeItem('user')
        setToken(''); setUser(null)
      }
    }
    fetchMe()
  }, [token])

  // ---- LOGIN: { identifier, password } ----
  const login = async (identifier, password) => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { identifier, password })
      if (!data?.token) throw new Error('Missing token')
      localStorage.setItem('token', data.token); setToken(data.token)
      try {
        const me = await api.get('/profile/me')
        setUser(me.data); localStorage.setItem('user', JSON.stringify(me.data))
      } catch {
        const fallback = { fullName: data.fullName || 'User' }
        setUser(fallback); localStorage.setItem('user', JSON.stringify(fallback))
      }
      return data
    } finally { setLoading(false) }
  }

  // ---- REGISTER: { fullName, email, phone, password, confirmPassword, agreedToTerms } ----
  const register = async ({ fullName, email, phone, password, confirmPassword, agreedToTerms=true }) => {
    const payload = { fullName, email, phone, password, confirmPassword, agreedToTerms }
    const { data } = await api.post('/auth/register', payload)
    return data
  }

  // ---- FORGOT PASSWORD: bước 1 (gửi OTP/link) ----
  // BE thường cần email hoặc phone -> dùng chung 'identifier'
  const requestPasswordReset = async (identifier) => {
    const { data } = await api.post('/auth/forgot-password', { identifier })
    return data // ví dụ: { message: "...", channel: "email", tokenSent: true }
  }

  // ---- RESET PASSWORD: bước 2 (đổi mật khẩu bằng token) ----
  // Body thường: { token, newPassword, confirmPassword }
  const resetPassword = async ({ token, newPassword, confirmPassword }) => {
    const { data } = await api.post('/auth/reset-password', { token, newPassword, confirmPassword })
    return data
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch {}
    localStorage.removeItem('token'); localStorage.removeItem('user')
    setToken(''); setUser(null)
  }

  const value = useMemo(() => ({
    token, user, loading,
    login, register, logout,
    requestPasswordReset, resetPassword,
  }), [token, user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
