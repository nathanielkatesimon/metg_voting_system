import axiosInstance from '@/lib/axios'

export async function register(data) {
  const res = await axiosInstance.post('/auth/register', data)
  return res.data
}

export async function login(data) {
  const res = await axiosInstance.post('/auth/login', data)
  return res.data
}

export async function logout() {
  const res = await axiosInstance.post('/auth/logout')
  return res.data
}

export async function getMe() {
  const res = await axiosInstance.get('/auth/me')
  return res.data
}
