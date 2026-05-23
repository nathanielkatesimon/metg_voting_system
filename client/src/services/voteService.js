import axiosInstance from '@/lib/axios'

export async function castVote(data) {
  const res = await axiosInstance.post('/votes', data)
  return res.data
}

export async function getMyVotes(electionId) {
  const res = await axiosInstance.get(`/elections/${electionId}/my-votes`)
  return res.data
}

export async function getAllMyVotes() {
  const res = await axiosInstance.get('/my-votes')
  return res.data
}
