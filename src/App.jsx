import './App.css'
import IntroPage from './pages/IntroPage'
import LearnPage from './pages/LearnPage'
import AdminPage from './pages/AdminPage'

export default function App() {
  const path = window.location.pathname
  if (path === '/learn') return <LearnPage />
  if (path === '/admin') return <AdminPage />
  return <IntroPage />
}
