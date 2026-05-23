import { createContext, useState, useEffect } from 'react'
import { getMe, login as apiLogin, logout as apiLogout, register as apiRegister } from '@/services/authService'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  async function login(data) {
    const userData = await apiLogin(data)
    setUser(userData)
    return userData
  }

  async function logout() {
    await apiLogout()
    setUser(null)
  }

  async function register(data) {
    const userData = await apiRegister(data)
    return userData
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}
