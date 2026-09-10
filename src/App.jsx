import { HashRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import Home from './pages/Home.jsx'
import SinglePlayer from './pages/SinglePlayer.jsx'
import Multiplayer from './pages/Multiplayer.jsx'

// HashRouter is used (rather than BrowserRouter) so the built app can be
// dropped onto GitHub Pages at any subpath and survive a hard refresh or
// a shared deep link without any server-side rewrite configuration.
export default function App() {
  return (
    <HashRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/single" element={<SinglePlayer />} />
        <Route path="/multiplayer" element={<Multiplayer />} />
      </Routes>
    </HashRouter>
  )
}
