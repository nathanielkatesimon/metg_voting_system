import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/context/AuthContext'
import ErrorBoundary from '@/components/ErrorBoundary'
import './index.css'
import 'boxicons/css/boxicons.min.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <App />
          <Toaster position="top-right" richColors />
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
