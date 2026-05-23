import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const publicPaths = ['/login', '/register']
    if (error.response?.status === 401 && !publicPaths.includes(window.location.pathname)) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
