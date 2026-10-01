import { Link, Outlet } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import Header from '../components/Header'

export default function CustomerLayout() {
  return (
    <div className="app-shell">
      <Header />
      <main className="page-shell"><Outlet /></main>
      <footer className="site-footer">
        <Link className="wordmark footer-wordmark" to="/"><span className="wordmark-mark">n</span>nosh<span className="wordmark-period">.</span></Link>
        <span>Good food, good mood. Bengaluru.</span>
        <Link to="/restaurants">Find your next favourite <ArrowUpRight size={14} /></Link>
      </footer>
    </div>
  )
}
