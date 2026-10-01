import { ArrowRight, Clock3, PackageCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCustomer } from '../hooks/useCustomer'
import { formatCurrency } from '../utils/currency'

export default function OrdersPage() {
  const { orders } = useCustomer()

  return (
    <div className="orders-page page-enter">
      <div className="page-title-row"><div><span className="eyebrow">ALL THE GOOD MEALS</span><h1>Your orders<span className="title-dot">.</span></h1></div><span className="orders-total">{orders.length} {orders.length === 1 ? 'order' : 'orders'}</span></div>
      {orders.length ? <div className="orders-list">{orders.map((order) => <article className="order-card" key={order.id}><div className="order-card-top"><div className="order-status"><span className="status-dot" /> {order.status}</div><span className="order-date"><Clock3 size={14} /> {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div><div className="order-card-main"><div className="order-card-icon"><PackageCheck size={21} /></div><div className="order-card-info"><h2>{order.restaurantName}</h2><p>{order.items.map((item) => `${item.quantity} × ${item.name}`).join(', ')}</p><span>{order.id}</span></div><div className="order-card-total"><strong>{formatCurrency(order.totalAmount)}</strong><small>{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</small></div></div><Link className="order-card-link" to={`/order/${order.id}`}>View order <ArrowRight size={15} /></Link></article>)}</div> : <section className="empty-state"><span className="eyebrow">THE FIRST OF MANY</span><h2>Your order story starts here.</h2><p>Pick a kitchen, find a favourite, and we'll take it from there.</p><Link className="button button-primary" to="/restaurants">Browse restaurants <ArrowRight size={16} /></Link></section>}
    </div>
  )
}
