import { useState } from 'react'
import { ArrowDownToLine, ArrowUpRight, CalendarDays, CircleDollarSign, CreditCard, Wallet } from 'lucide-react'
import { popularItems, weeklyEarnings } from '../services/dashboardData'
import { formatCurrency } from '../utils/currency'

const transactions = [
  { id: 'SET-1028', date: '01 Oct 2026', detail: 'Weekly settlement', amount: 28140, status: 'Paid' },
  { id: 'SET-1021', date: '24 Sep 2026', detail: 'Weekly settlement', amount: 34220, status: 'Paid' },
  { id: 'SET-1014', date: '17 Sep 2026', detail: 'Weekly settlement', amount: 31760, status: 'Paid' },
]

export default function DashboardEarningsPage() {
  const [requested, setRequested] = useState(false)
  const max = Math.max(...weeklyEarnings.map((entry) => entry.value))

  return (
    <div className="dashboard-page page-enter">
      <div className="dashboard-page-heading"><div><span className="eyebrow">THE NUMBERS, NICE AND CLEAR</span><h1>Earnings<span className="title-dot">.</span></h1><p>Track your sales, settlements, and what your kitchen is serving up.</p></div><button className="dashboard-outline-button" type="button" onClick={() => setRequested(true)}><ArrowDownToLine size={15} /> {requested ? 'Statement ready' : 'Download statement'}</button></div>
      <section className="earnings-summary-grid"><article className="earnings-balance-card"><span className="eyebrow light-eyebrow">AVAILABLE BALANCE</span><strong>₹28,140<span>.00</span></strong><p>Next settlement · Friday, 02 October</p><div className="balance-card-bottom"><span><Wallet size={15} /> Bank account ending in 4821</span><span className="balance-wave"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></span></div></article><article className="earnings-small-card"><div className="metric-icon metric-herb"><CircleDollarSign size={18} /></div><span>This week</span><strong>₹53,470</strong><small><ArrowUpRight size={13} /> 11.8% from last week</small></article><article className="earnings-small-card"><div className="metric-icon metric-sun"><CreditCard size={18} /></div><span>Settled this month</span><strong>₹1,24,860</strong><small>4 successful settlements</small></article></section>
      <div className="dashboard-overview-grid earnings-detail-grid"><section className="dashboard-panel earnings-chart-panel"><div className="panel-heading"><div><span className="eyebrow">GROSS SALES</span><h2>Daily earnings</h2></div><button className="period-select" type="button"><CalendarDays size={13} /> This week</button></div><div className="chart-total"><strong>₹53,470</strong><span><ArrowUpRight size={14} /> 11.8%</span><small>before commission and adjustments</small></div><div className="bar-chart earnings-chart" role="img" aria-label="Earnings by day this week">{weeklyEarnings.map((entry, index) => <div className="chart-column" key={entry.day}><span className="chart-bar-value">{formatCurrency(entry.value)}</span><div className={`chart-bar ${index === 5 ? 'chart-bar-highlight' : ''}`} style={{ height: `${Math.max((entry.value / max) * 100, 8)}%` }} /><small>{entry.day}</small></div>)}</div></section><section className="dashboard-panel earnings-top-items"><div className="panel-heading"><div><span className="eyebrow">THIS WEEK</span><h2>Top earners</h2></div></div>{popularItems.map((item, index) => <div className="popular-row" key={item.name}><span className="popular-rank">0{index + 1}</span><span className="popular-name"><strong>{item.name}</strong><small>{item.sold} sold</small></span><strong className="popular-value">{formatCurrency(item.value)}</strong></div>)}</section></div>
      <section className="dashboard-panel settlement-panel"><div className="panel-heading"><div><span className="eyebrow">MONEY ON THE MOVE</span><h2>Recent settlements</h2></div><span className="settlement-account"><Wallet size={14} /> HDFC ···· 4821</span></div><div className="settlement-list">{transactions.map((transaction) => <div className="settlement-row" key={transaction.id}><span className="settlement-symbol"><CreditCard size={16} /></span><span className="settlement-main"><strong>{transaction.detail}</strong><small>{transaction.date} · {transaction.id}</small></span><span className="settlement-paid">{transaction.status}</span><strong>{formatCurrency(transaction.amount)}</strong></div>)}</div></section>
    </div>
  )
}
