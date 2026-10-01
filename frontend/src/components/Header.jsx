import { Link, NavLink } from 'react-router-dom'
import { ArrowRight, Bell, MapPin, ShoppingBag, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { useCart } from '../hooks/useCart'
import { useCustomer } from '../hooks/useCustomer'

export default function Header() {
  const { itemCount } = useCart()
  const { user, notifications = [] } = useCustomer()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="wordmark" to="/" aria-label="Nosh home">
          <span className="wordmark-mark">n</span>nosh<span className="wordmark-period">.</span>
        </Link>
        <button className="delivery-location" type="button" aria-label="Delivery location">
          <MapPin size={17} strokeWidth={2.2} />
          <span><small>Delivering to</small><strong>Indiranagar, Bengaluru</strong></span>
          <ArrowRight className="location-arrow" size={14} />
        </button>
        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/restaurants">Explore</NavLink>
          <NavLink to="/orders">Orders</NavLink>
          <NavLink to="/dashboard">Partner</NavLink>
        </nav>
        <div className="header-actions">
          <div className="notification-wrap">
            <button className="header-notification-button" type="button" aria-label={`${notifications.length} notifications`} aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)}><Bell size={18} />{notifications.length > 0 && <b>{Math.min(notifications.length, 9)}</b>}</button>
            {notificationsOpen && <section className="notification-popover"><div className="notification-popover-head"><strong>Updates</strong><button type="button" aria-label="Close notifications" onClick={() => setNotificationsOpen(false)}><X size={14} /></button></div>{notifications.length ? notifications.slice(0, 5).map((notification) => <Link className="notification-entry" to={notification.data?.orderId ? `/order/${notification.data.orderId}` : '/orders'} key={notification._id} onClick={() => setNotificationsOpen(false)}><strong>{notification.title}</strong><span>{notification.message}</span><small>{new Date(notification.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</small></Link>) : <p className="notification-empty">You're all caught up.</p>}</section>}
          </div>
          <Link className="icon-link profile-link" to="/profile" aria-label="Your profile">
            <UserRound size={19} />
            <span>{user?.name?.split(' ')[0] || 'Profile'}</span>
          </Link>
          <Link className="bag-link" to="/cart" aria-label={`Cart with ${itemCount} items`}>
            <ShoppingBag size={19} />
            <span>Bag</span>
            {itemCount > 0 && <b className="bag-count">{itemCount}</b>}
          </Link>
        </div>
      </div>
    </header>
  )
}
