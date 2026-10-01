import { ArrowDownRight, ArrowRight, ArrowUpRight, CircleDollarSign, Clock3, ShoppingBag, Star, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { dashboardOrders, popularItems, weeklyEarnings } from '../services/dashboardData'
import { formatCurrency } from '../utils/currency'
import { useRestaurantDashboard } from '../hooks/useRestaurantDashboard'

const metrics = [
  { label: "Today's orders", value: '18', delta: '+12.5%', icon: ShoppingBag, tone: 'tomato' },
  { label: 'Gross sales', value: '₹8,420', delta: '+8.2%', icon: CircleDollarSign, tone: 'herb' },
  { label: 'Average order', value: '₹468', delta: '+3.4%', icon: TrendingUp, tone: 'sun' },
  { label: 'Restaurant rating', value: '4.8', delta: 'Top 10%', icon: Star, tone: 'ink' },
]

export default function DashboardOverviewPage() {
  const { profile, isOpen } = useRestaurantDashboard()
  const maxEarning = Math.max(...weeklyEarnings.map((entry) => entry.value))

  return (
    <div className="dashboard-page page-enter">
      <div className="dashboard-page-heading"><div><span className="eyebrow">YOUR THURSDAY, AT A GLANCE</span><h1>Good afternoon, <em>{profile.name?.split(' ')[0]}.</em></h1><p>Here's what's cooking at your restaurant today.</p></div><Link className="dashboard-outline-button" to="/dashboard/orders">View order queue <ArrowRight size={15} /></Link></div>
      {!isOpen && <div className="paused-banner"><Clock3 size={17} /><span><strong>Your restaurant is paused.</strong> New orders won't come through until you reopen.</span></div>}
      <section className="metric-grid" aria-label="Today's performance">
        {metrics.map(({ label, value, delta, icon: Icon, tone }) => <article className="metric-card" key={label}><div className={`metric-icon metric-${tone}`}><Icon size={18} /></div><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong><span className="metric-delta"><ArrowUpRight size={13} /> {delta} <small>vs last week</small></span></article>)}
      </section>
      <div className="dashboard-overview-grid">
        <section className="dashboard-panel earnings-chart-panel"><div className="panel-heading"><div><span className="eyebrow">SALES PERFORMANCE</span><h2>This week</h2></div><button className="period-select" type="button">Last 7 days <ArrowDownRight size={13} /></button></div><div className="chart-total"><strong>₹53,470</strong><span><ArrowUpRight size={14} /> 11.8%</span><small>gross sales this week</small></div><div className="bar-chart" role="img" aria-label="Weekly sales chart">{weeklyEarnings.map((entry, index) => <div className="chart-column" key={entry.day}><span className="chart-bar-value">{formatCurrency(entry.value)}</span><div className={`chart-bar ${index === 5 ? 'chart-bar-highlight' : ''}`} style={{ height: `${Math.max((entry.value / maxEarning) * 100, 8)}%` }} /><small>{entry.day}</small></div>)}</div></section>
        <section className="dashboard-panel popular-panel"><div className="panel-heading"><div><span className="eyebrow">WHAT'S A HIT</span><h2>Popular dishes</h2></div><Link className="panel-link" to="/dashboard/menu">Full menu <ArrowRight size={13} /></Link></div><div className="popular-list">{popularItems.map((item, index) => <div className="popular-row" key={item.name}><span className="popular-rank">0{index + 1}</span><span className="popular-name"><strong>{item.name}</strong><small>{item.sold} sold this week</small></span><strong className="popular-value">{formatCurrency(item.value)}</strong></div>)}</div></section>
      </div>
      <section className="dashboard-panel recent-orders-panel"><div className="panel-heading"><div><span className="eyebrow">THE LATEST FROM YOUR KITCHEN</span><h2>Recent orders</h2></div><Link className="panel-link" to="/dashboard/orders">See all orders <ArrowRight size={13} /></Link></div><div className="dashboard-table-wrap"><table className="dashboard-table"><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>ITEMS</th><th>TIME</th><th>STATUS</th><th>TOTAL</th></tr></thead><tbody>{dashboardOrders.slice(0, 4).map((order) => <tr key={order.id}><td className="order-code">{order.id}</td><td>{order.customer}</td><td className="order-table-items">{order.items}</td><td>{order.time}</td><td><span className={`dashboard-status status-${order.status.toLowerCase().replaceAll(' ', '-')}`}>{order.status}</span></td><td className="table-total">{formatCurrency(order.total)}</td></tr>)}</tbody></table></div></section>
    </div>
  )
}
