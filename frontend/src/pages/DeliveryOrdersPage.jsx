import { useMemo, useState } from 'react'
import { ArrowRight, Check, Clock3, MapPin, PackageCheck, X } from 'lucide-react'
import { useDeliveryPartner } from '../hooks/useDeliveryPartner'
import { formatCurrency } from '../utils/currency'

const tabs = ['Available', 'In progress', 'Completed']

export default function DeliveryOrdersPage() {
  const { orders, dashboard, profile, acceptDelivery, declineDelivery, markPickedUp, markDelivered, setApiNotice, refresh, busy } = useDeliveryPartner()
  const [activeTab, setActiveTab] = useState('Available')
  const currentOrderId = dashboard.activeDelivery?.order?.id

  const filteredOrders = useMemo(() => orders.filter((order) => {
    if (activeTab === 'Available') return profile.isOnline && order.deliveryStatus === 'OFFERED'
    if (activeTab === 'In progress') return ['ACCEPTED', 'PICKED_UP'].includes(order.deliveryStatus) && order.id !== currentOrderId
    return order.deliveryStatus === 'DELIVERED'
  }), [activeTab, currentOrderId, orders, profile.isOnline])

  async function handleAction(order) {
    try {
      if (order.deliveryStatus === 'OFFERED') await acceptDelivery(order)
      else if (order.deliveryStatus === 'ACCEPTED') await markPickedUp(order)
      else await markDelivered(order)
    } catch (error) {
      setApiNotice(error.message)
    }
  }

  return (
    <div className="delivery-page page-enter">
      <div className="delivery-page-heading"><div><span className="delivery-eyebrow">YOUR ROUTE, YOUR RHYTHM</span><h1>Deliveries<span className="delivery-title-dot">.</span></h1><p>Ready orders nearby, plus the ones already on your route.</p></div><button className="delivery-outline-button" type="button" onClick={() => refresh()} disabled={busy}><Clock3 size={14} /> {busy ? 'Refreshing…' : 'Refresh'}</button></div>
      <div className="delivery-order-tabs">{tabs.map((tab) => <button type="button" className={activeTab === tab ? 'selected' : ''} key={tab} onClick={() => setActiveTab(tab)}>{tab}<span>{tab === 'Available' ? orders.filter((order) => order.deliveryStatus === 'OFFERED').length : tab === 'In progress' ? orders.filter((order) => ['ACCEPTED', 'PICKED_UP'].includes(order.deliveryStatus)).length : orders.filter((order) => order.deliveryStatus === 'DELIVERED').length}</span></button>)}</div>
      <section className="delivery-orders-list">{filteredOrders.map((order) => <article className="delivery-order-card" key={order.id}><div className="delivery-order-card-head"><span className="delivery-order-id">ORDER #{order.orderNumber || order.id}</span><span className={`delivery-order-status ${['PICKED_UP', 'OFFERED'].includes(order.deliveryStatus) ? 'picked-up' : ''}`}><i />{order.deliveryStatus === 'OFFERED' ? 'New delivery request' : order.deliveryStatus === 'PICKED_UP' ? 'On the way' : order.deliveryStatus === 'ACCEPTED' ? 'Partner assigned' : order.deliveryStatus === 'DELIVERED' ? 'Delivered' : 'Ready for pickup'}</span></div><div className="delivery-order-card-body"><span className="delivery-order-restaurant-icon"><PackageCheck size={19} /></span><div className="delivery-order-summary"><strong>{order.restaurantName}</strong><small>{order.customer || 'Customer'} · {order.addressText || 'Customer address'}</small><span><MapPin size={12} /> {order.distance || '2.3 km'} · {order.itemsText}</span></div><div className="delivery-order-payout"><strong>{formatCurrency(order.earning || 115)}</strong><small>estimated earning</small></div></div><div className="delivery-order-card-foot"><span><Clock3 size={13} /> {order.deliveryStatus === 'OFFERED' ? `Respond by ${new Date(order.offerExpiresAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}` : order.placed || 'Ready now'}</span>{order.deliveryStatus === 'DELIVERED' ? <span className="delivery-complete-mark"><Check size={15} /> Completed</span> : order.deliveryStatus === 'OFFERED' ? <div className="offer-actions"><button className="delivery-primary-action compact" type="button" onClick={() => handleAction(order)}>Accept <ArrowRight size={14} /></button><button className="delivery-decline-action" type="button" onClick={() => declineDelivery(order).catch((error) => setApiNotice(error.message))}><X size={14} /> Reject</button></div> : <button className="delivery-primary-action compact" type="button" onClick={() => handleAction(order)}>{order.deliveryStatus === 'PICKED_UP' ? 'Mark delivered' : 'Confirm pickup'} <ArrowRight size={14} /></button>}</div></article>)}{filteredOrders.length === 0 && <div className="delivery-empty-orders"><span><PackageCheck size={22} /></span><strong>{activeTab === 'Available' ? 'No requests waiting for you.' : `No ${activeTab.toLowerCase()} deliveries.`}</strong><small>{activeTab === 'Available' ? 'Stay online and we’ll send you the nearest ready pickup.' : 'Your route will appear here when a delivery is assigned.'}</small></div>}</section>
    </div>
  )
}
