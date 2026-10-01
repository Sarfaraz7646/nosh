import { ArrowDownToLine, ArrowUpRight, CalendarDays, PackageCheck, Wallet } from 'lucide-react'
import { useState } from 'react'
import { useDeliveryPartner } from '../hooks/useDeliveryPartner'
import { demoDeliveryEarnings } from '../services/deliveryDemo'
import { formatCurrency } from '../utils/currency'

export default function DeliveryEarningsPage() {
  const { earnings } = useDeliveryPartner()
  const [downloaded, setDownloaded] = useState(false)
  const daily = earnings.daily?.length ? earnings.daily : demoDeliveryEarnings.daily
  const maxAmount = Math.max(...daily.map((day) => day.amount), 1)
  const weeklyTotal = daily.reduce((sum, day) => sum + day.amount, 0)
  const bestDay = [...daily].sort((a, b) => b.amount - a.amount)[0]

  function downloadStatement() {
    const lines = ['Date,Deliveries,Earnings', ...daily.map((day) => `${day._id},${day.deliveries},${day.amount}`)]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'nosh-delivery-earnings.csv'
    anchor.click()
    URL.revokeObjectURL(url)
    setDownloaded(true)
  }

  return (
    <div className="delivery-page page-enter">
      <div className="delivery-page-heading"><div><span className="delivery-eyebrow">EVERY DROP ADDS UP</span><h1>Earnings<span className="delivery-title-dot">.</span></h1><p>Your completed deliveries, all in one place.</p></div><button className="delivery-outline-button" type="button" onClick={downloadStatement}><ArrowDownToLine size={14} /> {downloaded ? 'Statement downloaded' : 'Download statement'}</button></div>
      <section className="delivery-earnings-hero"><span className="delivery-earnings-icon"><Wallet size={20} /></span><span className="delivery-eyebrow light">LIFETIME EARNINGS</span><strong>{formatCurrency(earnings.lifetime || demoDeliveryEarnings.lifetime)}</strong><small>Keep going. You're doing great work.</small><div className="delivery-earnings-wave"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></section>
      <section className="delivery-earnings-metrics"><article><span className="delivery-small-icon green"><PackageCheck size={16} /></span><small>Today's deliveries</small><strong>{earnings.today?.deliveries ?? demoDeliveryEarnings.today.deliveries}</strong></article><article><span className="delivery-small-icon gold"><Wallet size={16} /></span><small>Today's earnings</small><strong>{formatCurrency(earnings.today?.amount ?? demoDeliveryEarnings.today.amount)}</strong></article><article><span className="delivery-small-icon coral"><ArrowUpRight size={16} /></span><small>Best day this week</small><strong>{formatCurrency(bestDay?.amount || 0)}</strong></article></section>
      <section className="delivery-panel earnings-chart-panel"><div className="delivery-section-heading"><div><span className="delivery-eyebrow">LAST SEVEN DAYS</span><h2>This week's earnings</h2></div><span className="earnings-total-week"><CalendarDays size={14} /> {formatCurrency(weeklyTotal)}</span></div><div className="delivery-bar-chart" role="img" aria-label="Daily delivery earnings for the last seven days">{daily.map((day) => { const date = new Date(`${day._id}T12:00:00`); return <div className="delivery-bar-column" key={day._id}><span>{formatCurrency(day.amount)}</span><div style={{ height: `${Math.max((day.amount / maxAmount) * 100, 8)}%` }} /><small>{date.toLocaleDateString('en-IN', { weekday: 'short' })}</small></div> })}</div></section>
      <section className="delivery-panel payout-panel"><div className="delivery-section-heading"><div><span className="delivery-eyebrow">PAYMENT HISTORY</span><h2>Recent payouts</h2></div><span className="payout-account">Weekly settlement</span></div>{(earnings.recent || []).length ? earnings.recent.map((entry) => <div className="payout-row" key={entry._id}><span className="payout-check"><PackageCheck size={15} /></span><span><strong>{entry.orderId?.restaurantId?.name || 'Delivery payout'}</strong><small>{new Date(entry.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · #{entry.orderId?._id?.slice(-6)}</small></span><strong>{formatCurrency(entry.earning)}</strong></div>) : <div className="payout-empty">Payout entries appear here after completed deliveries.</div>}</section>
    </div>
  )
}
