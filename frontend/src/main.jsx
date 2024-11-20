import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Videos from './Components/Videos.jsx'
import Home from './Components/home.jsx'
import Contact from './Components/Contact.jsx'
import About from './Components/About.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Videos />
    <Home />
    <Contact />
    <About />
  </StrictMode>,
)
