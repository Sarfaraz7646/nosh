import { ArrowRight, Clock3, MapPin, Navigation, PackageCheck, Phone, Star, Wallet, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '../utils/currency'
import { useDeliveryPartner } from '../hooks/useDeliveryPartner'

export default function DeliveryDashboardPage() {
  const { profile, dashboard, acceptDelivery, declineDelivery, markPickedUp, markDelivered, updateLocation, setApiNotice } = useDeliveryPartner()
  const active = dashboard.activeDelivery
  const order = active?.order
  const today = dashboard.today || {}
  const nearbyOrders = profile.isOnline ? dashboard.availableOrders || [] : []
  const assignmentStatus = active?.assignment?.status || order?.deliveryStatus
  const restaurantName = order?.restaurantName || 'ABC Restaurant'
  const customerName = order?.customer || 'Rahul'
  const distance = order?.distance || '2.3 km'

  function handleMainAction() {
    if (!order) return
    if (assignmentStatus === 'ACCEPTED') markPickedUp(order).catch((error) => setApiNotice(error.message))
    else markDelivered(order).catch((error) => setApiNotice(error.message))
  }

  async function getLocation() {
    try {
      await updateLocation()
    } catch (error) {
      setApiNotice(error.message || 'Could not update your location.')
    }
  }

  const metrics = [
    { label: "Today's deliveries", value: today.deliveries ?? 8, detail: 'Keep your pace', icon: PackageCheck, tone: 'coral' },
    { label: "Today's earnings", value: formatCurrency(today.earnings ?? 920), detail: 'Updated after each drop', icon: Wallet, tone: 'green' },
    { label: 'Your rating', value: Number(today.rating ?? profile.rating ?? 4.8).toFixed(1), detail: 'Customer feedback', icon: Star, tone: 'gold' },
  ]

  return (
    <div className="delivery-page delivery-dashboard-page page-enter">
      <div className="delivery-page-heading"><div><span className="delivery-eyebrow">YOUR SHIFT, AT A GLANCE</span><h1>Ready for the next <em>good turn?</em></h1><p>Stay available, ride safe, and let the city come to you.</p></div><button className="delivery-location-cta" type="button" onClick={getLocation}><Navigation size={15} /> Share location</button></div>
      <section className="delivery-metric-grid">{metrics.map(({ label, value, detail, icon: Icon, tone }) => <article className="delivery-metric" key={label}><span className={`delivery-metric-icon ${tone}`}><Icon size={17} /></span><span className="delivery-metric-label">{label}</span><strong>{value}</strong><small>{detail}</small></article>)}</section>
      <section className="current-delivery-section"><div className="delivery-section-heading"><div><span className="delivery-eyebrow">ON YOUR ROUTE</span><h2>Current delivery</h2></div>{order && <span className={`delivery-state-tag ${assignmentStatus === 'PICKED_UP' ? 'on-road' : ''}`}><i />{assignmentStatus === 'PICKED_UP' ? 'On the way' : 'Ready for pickup'}</span>}</div>
        {order ? <article className="current-delivery-card"><div className="delivery-route-visual"><div className="route-map-grid"><span className="route-line" /><span className="route-stop restaurant-stop"><span>01</span></span><span className="route-stop customer-stop"><span>02</span></span><span className="route-map-label restaurant-map-label">PICK UP</span><span className="route-map-label customer-map-label">DROP OFF</span><span className="route-road road-one" /><span className="route-road road-two" /></div><div className="route-distance"><Navigation size={14} /><strong>{distance}</strong><small>to customer</small></div></div><div className="current-delivery-details"><div className="delivery-order-meta"><span>ORDER #{order.orderNumber || order.id}</span><span><Clock3 size={13} /> 18 min</span></div><div className="delivery-stop-row"><span className="stop-icon pickup"><MapPin size={16} /></span><span><small>RESTAURANT</small><strong>{restaurantName}</strong><span>{order.restaurantAddress || 'Indiranagar, Bengaluru'}</span></span><span className="stop-number">01</span></div><div className="stop-connector" /><div className="delivery-stop-row"><span className="stop-icon dropoff"><MapPin size={16} /></span><span><small>CUSTOMER</small><strong>{customerName}</strong><span>{order.addressText || order.address || '12 Lake View Road, Indiranagar'}</span></span><span className="stop-number">02</span></div><div className="delivery-items-line"><PackageCheck size={14} /><span>{order.itemsText || '2 × Biryani · 1 × Coke'}</span></div><div className="current-delivery-actions"><a className="delivery-call-button" href={order.customerPhone ? `tel:${order.customerPhone}` : 'tel:+919811122334'} aria-label={`Call ${customerName}`}><Phone size={15} /></a><button className="delivery-primary-action" type="button" onClick={handleMainAction}>{assignmentStatus === 'ACCEPTED' ? 'Confirm pickup' : 'Mark delivered'} <ArrowRight size={15} /></button></div></div></article> : <div className="delivery-no-current"><span className="no-current-icon"><PackageCheck size={22} /></span><strong>No delivery in progress</strong><p>Pick up an order from the available list when you're ready.</p><Link to="/delivery/orders">See available orders <ArrowRight size={14} /></Link></div>}
      </section>
      <section className="delivery-next-section"><div className="delivery-section-heading"><div><span className="delivery-eyebrow">UP NEXT</span><h2>Nearby orders</h2></div><Link to="/delivery/orders">View all <ArrowRight size={14} /></Link></div><div className="nearby-order-list">{nearbyOrders.slice(0, 2).map((nearby) => <article className="nearby-order-row" key={nearby.id}><span className="nearby-order-icon"><PackageCheck size={17} /></span><span className="nearby-order-main"><strong>{nearby.restaurantName}</strong><small>{nearby.customer} · {nearby.distance || '2.1 km'}</small></span><span className="nearby-order-earning">{formatCurrency(nearby.earning || 115)}<small>delivery</small></span><div className="nearby-request-actions"><button className="nearby-decline" type="button" aria-label={`Pass order ${nearby.orderNumber}`} onClick={() => declineDelivery(nearby).catch((error) => setApiNotice(error.message))}><X size={14} /></button><button type="button" aria-label={`Accept order ${nearby.orderNumber}`} onClick={() => acceptDelivery(nearby).catch((error) => setApiNotice(error.message))}><ArrowRight size={16} /></button></div></article>)}{nearbyOrders.length === 0 && <p className="no-nearby-orders"><Clock3 size={15} /> {profile.isOnline ? "You're all caught up. New ready orders will appear here." : 'Go online to receive nearby delivery requests.'}</p>}</div></section>
      <div className="delivery-dashboard-footnote"><Star size={13} /><span>Your verified profile is visible to nearby restaurants while you’re online.</span></div>
    </div>
  )
}
