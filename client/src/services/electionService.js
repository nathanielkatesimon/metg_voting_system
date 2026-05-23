import axiosInstance from '@/lib/axios'

export async function getElections() {
  const res = await axiosInstance.get('/elections')
  return res.data
}

export async function getElection(id) {
  const res = await axiosInstance.get(`/elections/${id}`)
  return res.data
}

export async function getAdminElections() {
  const res = await axiosInstance.get('/admin/elections')
  return res.data
}

export async function createElection(data) {
  const res = await axiosInstance.post('/admin/elections', data)
  return res.data
}

export async function updateElection(id, data) {
  const res = await axiosInstance.put(`/admin/elections/${id}`, data)
  return res.data
}

export async function deleteElection(id) {
  const res = await axiosInstance.delete(`/admin/elections/${id}`)
  return res.data
}

export async function openElection(id) {
  const res = await axiosInstance.patch(`/admin/elections/${id}/open`)
  return res.data
}

export async function closeElection(id) {
  const res = await axiosInstance.patch(`/admin/elections/${id}/close`)
  return res.data
}
