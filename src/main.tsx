import '@fontsource-variable/noto-sans-kr'
import '@fontsource-variable/noto-serif-kr'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
