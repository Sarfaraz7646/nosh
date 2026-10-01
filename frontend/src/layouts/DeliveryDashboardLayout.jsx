import { Bike, ClipboardList, LayoutDashboard, LogOut, MapPinned, UserRound, Wallet } from 'lucide-react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useCustomer } from '../hooks/useCustomer'
import { useDeliveryPartner } from '../hooks/useDeliveryPartner'
import { DeliveryPartnerProvider } from '../store/DeliveryPartnerStore'
import '../Delivery.css'

const links = [
  { to: '/delivery/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/delivery/orders', label: 'Deliveries', icon: ClipboardList },
  { to: '/delivery/earnings', label: 'Earnings', icon: Wallet },
  { to: '/delivery/profile', label: 'My profile', icon: UserRound },
]

function DeliveryFrame() {
  const { profile, toggleOnline, updateLocation, apiNotice, setApiNotice } = useDeliveryPartner()
  const { signOut } = useCustomer()
  const navigate = useNavigate()
  const partnerName = profile.userId?.name || 'Delivery partner'

  async function handleLocation() {
    try {
      await updateLocation()
    } catch (error) {
      setApiNotice(error.message || 'Could not update your location.')
    }
  }

  function handleSignOut() {
    signOut()
    navigate('/delivery/login', { replace: true })
  }

  return (
    <div className="delivery-shell">
      <aside className="delivery-sidebar">
        <Link className="delivery-brand" to="/delivery/dashboard"><span className="delivery-brand-mark"><Bike size={19} /></span><span>nosh<small>DELIVERY</small></span></Link>
        <div className="delivery-partner-identity"><span className="delivery-avatar">{partnerName.charAt(0)}</span><span><strong>{partnerName}</strong><small>{profile.vehicleNumber || 'Partner account'}</small></span></div>
        <span className="delivery-nav-kicker">YOUR WORK</span>
        <nav className="delivery-nav" aria-label="Delivery partner navigation">
          {links.map(({ to, label, icon: Icon, end }) => <NavLink to={to} end={end} key={to}><Icon size={17} /><span>{label}</span>{label === 'Deliveries' && profile.isOnline && <i>{profile.isOnline ? 'ON' : ''}</i>}</NavLink>)}
        </nav>
        <div className="delivery-sidebar-bottom">
          <Link className="delivery-location-button" to="#location" onClick={(event) => { event.preventDefault(); handleLocation() }}><MapPinned size={15} /> Update my location</Link>
          <button className="delivery-signout" type="button" onClick={handleSignOut}><LogOut size={15} /> Sign out</button>
          <span className="delivery-help">Need a hand? <a href="mailto:partners@nosh.example">Partner support</a></span>
        </div>
      </aside>
      <main className="delivery-main">
        <header className="delivery-topbar">
          <div><span className="delivery-date-label">THURSDAY, OCTOBER 01, 2026</span><strong>Good day, {partnerName.split(' ')[0]}</strong></div>
          <div className="delivery-top-actions">
            <span className={`delivery-online-label ${profile.isOnline ? 'online' : ''}`}><i />{profile.isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            <button className={`delivery-switch ${profile.isOnline ? 'is-online' : ''}`} type="button" role="switch" aria-checked={Boolean(profile.isOnline)} aria-label={profile.isOnline ? 'Go offline' : 'Go online'} disabled={!profile.isOnline && !profile.isVerified} onClick={toggleOnline}><span /></button>
          </div>
        </header>
        {apiNotice && <div className={`delivery-notice ${apiNotice.toLowerCase().includes('verified') ? 'notice-warning' : ''}`} role="status">{apiNotice}</div>}
        {!profile.isVerified && <div className="verification-banner"><span className="verification-icon">!</span><span><strong>Verification in progress</strong><small>We’ll let you know once your documents are approved. You can update your profile while you wait.</small></span><Link to="/delivery/profile">View profile</Link></div>}
        <div className="delivery-content"><Outlet /></div>
      </main>
    </div>
  )
}

export default function DeliveryDashboardLayout() {
  return <DeliveryPartnerProvider><DeliveryFrame /></DeliveryPartnerProvider>
}
