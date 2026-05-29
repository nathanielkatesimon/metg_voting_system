import axiosInstance from '@/lib/axios'

export async function getProfile() {
  const res = await axiosInstance.get('/users/me')
  return res.data
}

export async function updateProfile(data) {
  const res = await axiosInstance.put('/users/me', data)
  return res.data
}

export async function changePassword(data) {
  const res = await axiosInstance.put('/users/me/password', data)
  return res.data
}

export async function createAdminUser(data) {
  const res = await axiosInstance.post('/admin/users', data)
  return res.data
}

export async function getAdminUsers(page = 1, limit = 20) {
  const res = await axiosInstance.get('/admin/users', { params: { page, limit } })
  return res.data
}

export async function updateAdminUser(id, data) {
  const res = await axiosInstance.put(`/admin/users/${id}`, data)
  return res.data
}

export async function deleteAdminUser(id) {
  const res = await axiosInstance.delete(`/admin/users/${id}`)
  return res.data
}

export async function importAdminUsers(file) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await axiosInstance.post('/admin/users/import', formData)
  return res.data
}
