import { HashRouter, Routes, Route } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Acompanhar from './pages/Acompanhar'
import Admin from './pages/Admin'
import './index.css'

function App() {
  return (
    <HashRouter>
      <div id="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/acompanhar" element={<Acompanhar />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
        <BottomNav />
      </div>
    </HashRouter>
  )
}

export default App
