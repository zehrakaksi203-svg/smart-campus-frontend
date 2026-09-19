import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ToastContainer from './components/ToastContainer.jsx'
import ConfirmDialog from './components/ConfirmDialog.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <ToastContainer />
      <ConfirmDialog />
    </ErrorBoundary>
  </StrictMode>,
)
