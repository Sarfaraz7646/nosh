import { ArrowLeft, Check, Clock3, MapPin, Navigation, PackageCheck, ShieldCheck, UtensilsCrossed } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useCustomer } from '../hooks/useCustomer'
import FreeDeliveryMap from '../components/FreeDeliveryMap'
import { formatCurrency } from '../utils/currency'
import { DELIVERY_FEE, TAX_RATE } from '../utils/cartPricing'

const steps = [
  { title: 'Order confirmed', detail: 'The kitchen has your order.', icon: Check },
  { title: 'Being made with care', detail: 'Freshly prepared, just for you.', icon: UtensilsCrossed },
  { title: 'On its way', detail: 'A little trip to your doorstep.', icon: PackageCheck },
]

export default function OrderDetailsPage() {
  const { id } = useParams()
  const { orders } = useCustomer()
  const order = orders.find((entry) => entry.id === id)
  const itemSubtotal = order ? order.subtotal ?? order.items.reduce((sum, item) => sum + item.price * item.quantity, 0) : 0
  const deliveryFee = order ? order.deliveryFee ?? DELIVERY_FEE : 0
  const tax = order ? order.tax ?? Math.floor(itemSubtotal * TAX_RATE) : 0

  if (!order) return <section className="empty-state"><span className="eyebrow">ORDER NOT FOUND</span><h1>We couldn't find that one.</h1><Link className="button button-primary" to="/orders">See all orders</Link></section>

  return (
    <div className="order-detail-page page-enter">
      <Link className="back-link" to="/orders"><ArrowLeft size={16} /> All orders</Link>
      <div className="page-title-row"><div><span className="eyebrow">ORDER {order.id}</span><h1>It's happening<span className="title-dot">.</span></h1><p className="order-placed-date">Placed {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p></div><span className="live-status"><span className="status-dot" /> {order.status}</span></div>
      {order.paymentStatus === 'PAID' && <div className="payment-verified"><ShieldCheck size={16} /><span>Payment verified by Razorpay</span></div>}
      {order.deliveryPartnerName && <div className="delivery-partner-assigned"><PackageCheck size={15} /><span><strong>{order.deliveryPartnerName}</strong> accepted your delivery.</span></div>}
      {order.deliveryLocation && <div className="live-driver-location"><Navigation size={15} /><span>{order.deliveryLocation.distanceKm === null ? 'Your driver location was updated.' : `Your driver is ${order.deliveryLocation.distanceKm} km away.`}{Number.isFinite(order.deliveryLocation.latitude) && Number.isFinite(order.deliveryLocation.longitude) && <small> · {order.deliveryLocation.latitude.toFixed(4)}, {order.deliveryLocation.longitude.toFixed(4)}</small>}</span></div>}
      <div className="order-detail-grid"><section className="order-progress-panel"><FreeDeliveryMap order={order} /><div className="progress-list">{steps.map((step, index) => { const StepIcon = step.icon; return <div className={`progress-step ${index === 0 ? 'completed' : ''}`} key={step.title}><span className="progress-step-icon"><StepIcon size={16} /></span><span><strong>{step.title}</strong><small>{step.detail}</small></span><span className="progress-step-time">{index === 0 ? 'Just now' : index === 1 ? 'Up next' : 'Soon'}</span></div> })}</div></section>
        <aside className="order-summary-panel"><span className="eyebrow">FROM THIS KITCHEN</span><h2>{order.restaurantName}</h2><div className="order-detail-items">{order.items.map((item) => <div className="bill-line" key={item.id}><span>{item.quantity} × {item.name}</span><strong>{formatCurrency(item.price * item.quantity)}</strong></div>)}</div><div className="bill-line"><span>Subtotal</span><strong>{formatCurrency(itemSubtotal)}</strong></div><div className="bill-line"><span>Delivery</span><strong>{formatCurrency(deliveryFee)}</strong></div><div className="bill-line"><span>Tax (5%)</span><strong>{formatCurrency(tax)}</strong></div><div className="bill-total"><span>Paid by {order.paymentMethod}</span><strong>{formatCurrency(order.totalAmount)}</strong></div><div className="order-address"><MapPin size={16} /><span><strong>{order.address.name}</strong><small>{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}, {order.address.city} {order.address.pincode}</small></span></div><Link className="quiet-link" to={`/restaurant/${order.restaurantId}`}>Order again <ArrowLeft size={14} /></Link></aside></div>
    </div>
  )
}
