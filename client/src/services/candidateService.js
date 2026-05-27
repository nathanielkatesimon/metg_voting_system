import axiosInstance from '@/lib/axios'

export async function getAllAdminCandidates() {
  const res = await axiosInstance.get('/admin/candidates')
  return res.data
}

export async function getCandidates(electionId, positionId) {
  const params = positionId ? { positionId } : {}
  const res = await axiosInstance.get(`/elections/${electionId}/candidates`, { params })
  return res.data
}

export async function createCandidate(formData) {
  const res = await axiosInstance.post('/admin/candidates', formData)
  return res.data
}

export async function updateCandidate(id, formData) {
  const res = await axiosInstance.put(`/admin/candidates/${id}`, formData)
  return res.data
}

export async function deleteCandidate(id) {
  const res = await axiosInstance.delete(`/admin/candidates/${id}`)
  return res.data
}
