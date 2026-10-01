import { LayoutDashboard, ArrowUpRight, ClipboardList, IndianRupee, Utensils, Store } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { RestaurantDashboardProvider } from '../store/RestaurantDashboardStore'
import { useRestaurantDashboard } from '../hooks/useRestaurantDashboard'
import '../Dashboard.css'

const links = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/orders', label: 'Orders', icon: ClipboardList },
  { to: '/dashboard/menu', label: 'Menu', icon: Utensils },
  { to: '/dashboard/profile', label: 'Restaurant profile', icon: Store },
  { to: '/dashboard/earnings', label: 'Earnings', icon: IndianRupee },
]

function DashboardFrame() {
  const { profile, isOpen, setIsOpen, apiNotice } = useRestaurantDashboard()

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link className="dashboard-brand" to="/dashboard"><span>n</span>nosh<span className="brand-partner">PARTNER</span></Link>
        <div className="dashboard-restaurant-chip"><span className="restaurant-initial">{profile.name?.charAt(0) || 'R'}</span><span><strong>{profile.name}</strong><small>Restaurant workspace</small></span></div>
        <span className="dashboard-nav-label">WORKSPACE</span>
        <nav className="dashboard-nav" aria-label="Restaurant dashboard">
          {links.map(({ to, label, icon: Icon, end }) => <NavLink to={to} end={end} key={to}><Icon size={17} /><span>{label}</span>{label === 'Orders' && <i>5</i>}</NavLink>)}
        </nav>
        <div className="sidebar-spacer" />
        <Link className="dashboard-back-link" to="/"><ArrowUpRight size={15} /> View customer site</Link>
        <div className="dashboard-sidebar-foot"><span className="support-dot" /> Partner support <span>·</span> Help centre</div>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div><span className="dashboard-date">THURSDAY, OCTOBER 01, 2026</span><strong>{profile.name}</strong></div>
          <div className="dashboard-top-actions"><span className="sync-indicator" title={apiNotice || 'Local workspace'}>{apiNotice?.includes('MongoDB') ? 'MongoDB connected' : 'Workspace active'}</span><button className={`open-toggle ${isOpen ? 'open' : ''}`} type="button" role="switch" aria-checked={isOpen} onClick={() => setIsOpen(!isOpen)}><span />{isOpen ? 'Accepting orders' : 'Paused'}</button><span className="dashboard-avatar">{profile.name?.charAt(0) || 'R'}</span></div>
        </header>
        {apiNotice && <div className={`dashboard-notice ${apiNotice.includes('sync') || apiNotice.includes('Saved') ? 'notice-soft' : ''}`} role="status">{apiNotice}</div>}
        <div className="dashboard-content"><Outlet /></div>
      </main>
    </div>
  )
}

export default function RestaurantDashboardLayout() {
  return <RestaurantDashboardProvider><DashboardFrame /></RestaurantDashboardProvider>
}
