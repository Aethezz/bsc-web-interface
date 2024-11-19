import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Videos from './Videos.jsx'
import Home from './home.jsx'
import Contact from './Contact.jsx'
import About from './About.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Videos />
    <Home />
    <Contact />
    <About />
  </StrictMode>,
)
