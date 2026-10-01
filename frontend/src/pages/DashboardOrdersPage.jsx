import { useEffect, useState } from 'react'
import { ArrowRight, Check, Clock3, Filter, Search, X } from 'lucide-react'
import { dashboardOrders } from '../services/dashboardData'
import { connectOrderSocket } from '../services/orderSocket'
import { customerApi } from '../services/customerApi'
import { orderApi } from '../services/orderApi'
import { useRestaurantDashboard } from '../hooks/useRestaurantDashboard'
import { formatCurrency } from '../utils/currency'

const filters = ['All orders', 'New', 'Accepted', 'Preparing', 'Ready for pickup', 'Out for delivery', 'Delivered']

function toDashboardOrder(order) {
  const mapped = customerApi.mapOrder(order)
  const status = mapped.status === 'Placed' ? 'New' : mapped.status === 'Confirmed' ? 'Accepted' : mapped.status
  return {
    ...mapped,
    status,
    total: mapped.total ?? mapped.totalAmount,
    itemsText: Array.isArray(mapped.items)
      ? mapped.items.map((item) => `${item.quantity} × ${item.name}`).join(', ')
      : mapped.items,
  }
}

export default function DashboardOrdersPage() {
  const [orders, setOrders] = useState(dashboardOrders)
  const [activeFilter, setActiveFilter] = useState('All orders')
  const [query, setQuery] = useState('')
  const { profile, setApiNotice } = useRestaurantDashboard()

  useEffect(() => {
    const token = localStorage.getItem('nosh-token') || localStorage.getItem('restaurant-token')
    if (!profile._id || !token) return undefined
    let active = true
    const upsertOrder = (order) => {
      const next = toDashboardOrder(order)
      setOrders((current) => [next, ...current.filter((entry) => entry.id !== next.id)])
    }

    orderApi.listRestaurant()
      .then((result) => { if (active) setOrders(result.map(toDashboardOrder)) })
      .catch((error) => { if (active) setApiNotice(error.message) })

    const socket = connectOrderSocket()
    socket?.on('order:new', (order) => {
      if (active) {
        upsertOrder(order)
        setApiNotice(`New order #${order.orderNumber || order._id.slice(-6)} received.`)
      }
    })
    socket?.on('order:updated', upsertOrder)
    socket?.on('delivery:dispatch', (dispatch) => {
      const nearby = dispatch.nearbyPartners
        .map((partner) => `${partner.name} ${partner.distanceKm.toFixed(1)} km`)
        .join(' · ')
      setApiNotice(`Order #${String(dispatch.orderId).slice(-6)} offered to ${dispatch.offeredTo} first (${dispatch.distanceKm.toFixed(1)} km). Nearby: ${nearby}`)
    })
    socket?.on('delivery:dispatch-unavailable', (dispatch) => {
      setApiNotice(`Order #${String(dispatch.orderId).slice(-6)} is waiting for a nearby online delivery partner: ${dispatch.reason}`)
    })
    socket?.on('delivery:accepted', (event) => {
      setApiNotice(`${event.partnerName} accepted order #${event.orderNumber}.`)
    })
    socket?.on('delivery:location', (event) => {
      setApiNotice(`Partner location updated for order #${String(event.orderId).slice(-6)}${event.distanceKm === null ? '.' : `: ${event.distanceKm} km from customer.`}`)
    })
    socket?.on('notification:new', (notification) => {
      setApiNotice(`${notification.title}: ${notification.message}`)
    })

    return () => {
      active = false
      socket?.disconnect()
    }
  }, [profile._id, setApiNotice])

  const visibleOrders = orders.filter((order) => {
    const matchesFilter = activeFilter === 'All orders' || (activeFilter === 'New' ? order.status === 'New' : order.status === activeFilter)
    const matchesSearch = `${order.orderNumber || order.id} ${order.customer} ${order.itemsText || order.items}`.toLowerCase().includes(query.toLowerCase())
    return matchesFilter && matchesSearch
  })

  async function advanceOrder(order) {
    const nextStatus = { Accepted: ['PREPARING', 'Preparing'], Preparing: ['READY_FOR_PICKUP', 'Ready for pickup'] }
    if (order._id && nextStatus[order.status]) {
      try {
        const updated = await orderApi.setStatus(order._id, nextStatus[order.status][0])
        const next = toDashboardOrder(updated)
        setOrders((current) => current.map((entry) => entry.id === order.id ? next : entry))
        setApiNotice(`Order #${order.orderNumber} moved to ${next.status.toLowerCase()}.`)
      } catch (error) {
        setApiNotice(error.message)
      }
      return
    }
    const nextDemoStatus = { Accepted: 'Preparing', Preparing: 'Ready for pickup' }
    setOrders((current) => current.map((entry) => entry.id === order.id && nextDemoStatus[entry.status]
      ? { ...entry, status: nextDemoStatus[entry.status] }
      : entry))
  }

  async function decideOrder(order, decision) {
    if (order._id) {
      try {
        const updated = decision === 'accept'
          ? await orderApi.accept(order._id)
          : await orderApi.reject(order._id)
        const next = toDashboardOrder(updated)
        setOrders((current) => current.map((entry) => entry.id === order.id ? next : entry))
        setApiNotice(`Order #${order.orderNumber} ${decision === 'accept' ? 'accepted' : 'rejected'}.`)
      } catch (error) {
        setApiNotice(error.message)
      }
      return
    }
    setOrders((current) => current.map((entry) => entry.id === order.id
      ? { ...entry, status: decision === 'accept' ? 'Accepted' : 'Rejected' }
      : entry))
  }

  return (
    <div className="dashboard-page page-enter">
      <div className="dashboard-page-heading"><div><span className="eyebrow">THE KITCHEN QUEUE</span><h1>Orders<span className="title-dot">.</span></h1><p>Keep every plate moving, one order at a time.</p></div><div className="orders-live"><span className="status-dot" /> Live queue <strong>{orders.filter((order) => !['Delivered', 'Rejected'].includes(order.status)).length}</strong></div></div>
      <div className="order-toolbar"><div className="dashboard-tabs">{filters.map((filter) => <button type="button" className={activeFilter === filter ? 'selected' : ''} key={filter} onClick={() => setActiveFilter(filter)}>{filter}{filter === 'New' && <b>1</b>}</button>)}</div><label className="dashboard-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search order or customer" /></label></div>
      <section className="dashboard-panel orders-queue-panel"><div className="queue-panel-heading"><span><Filter size={14} /> Showing {visibleOrders.length} orders</span><span>Today · 11:00 am – 2:00 pm</span></div><div className="dashboard-table-wrap"><table className="dashboard-table orders-table"><thead><tr><th>ORDER DETAILS</th><th>CUSTOMER</th><th>PLACED</th><th>STATUS</th><th>AMOUNT</th><th>ACTION</th></tr></thead><tbody>{visibleOrders.map((order) => <tr key={order.id}><td><strong className="order-code">#{order.orderNumber || order.id}</strong><small className="orders-item-detail">{order.itemsText || order.items}</small></td><td>{order.customer || 'Customer'}</td><td>{order.time}</td><td><span className={`dashboard-status status-${order.status.toLowerCase().replaceAll(' ', '-')}`}>{order.status}</span></td><td className="table-total">{formatCurrency(order.total)}</td><td>{order.status === 'New' ? <div className="order-decision-actions"><button className="accept-order" type="button" onClick={() => decideOrder(order, 'accept')} aria-label={`Accept order ${order.orderNumber || order.id}`}><Check size={14} /> Accept</button><button className="reject-order" type="button" onClick={() => decideOrder(order, 'reject')} aria-label={`Reject order ${order.orderNumber || order.id}`}><X size={14} /> Reject</button></div> : ['Accepted', 'Preparing'].includes(order.status) ? <button className="advance-order" type="button" onClick={() => advanceOrder(order)}>{order.status === 'Accepted' ? 'Start preparing' : 'Ready for pickup'} <ArrowRight size={13} /></button> : order.status === 'Delivered' ? <span className="completed-mark"><Check size={15} /></span> : <span aria-label="No action available">—</span>}</td></tr>)}</tbody></table></div>{visibleOrders.length === 0 && <div className="table-empty"><Clock3 size={21} /><span>No orders match those filters.</span></div>}</section>
    </div>
  )
}
