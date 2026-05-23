import axiosInstance from '@/lib/axios'

export async function getResults(electionId) {
  const res = await axiosInstance.get(`/elections/${electionId}/results`)
  return res.data
}

export async function getStats(electionId) {
  const res = await axiosInstance.get(`/elections/${electionId}/stats`)
  return res.data
}
