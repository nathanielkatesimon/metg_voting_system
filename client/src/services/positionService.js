import axiosInstance from '@/lib/axios'

export async function getPositions(electionId) {
  const res = await axiosInstance.get(`/elections/${electionId}/positions`)
  return res.data
}

export async function createPosition(electionId, data) {
  const res = await axiosInstance.post(`/admin/elections/${electionId}/positions`, data)
  return res.data
}

export async function updatePosition(id, data) {
  const res = await axiosInstance.put(`/admin/positions/${id}`, data)
  return res.data
}

export async function deletePosition(id) {
  const res = await axiosInstance.delete(`/admin/positions/${id}`)
  return res.data
}
