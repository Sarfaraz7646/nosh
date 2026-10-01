import { useEffect, useState } from 'react'
import { ArrowLeft, Check, ExternalLink, FileText, RefreshCw, ShieldCheck, UserRound, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { adminApi } from '../services/adminApi'
import './AdminDeliveryReview.css'

const filters = ['PENDING', 'APPROVED', 'REJECTED', 'ALL']

export default function AdminDeliveryReviewPage() {
  const [status, setStatus] = useState('PENDING')
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [rejectingId, setRejectingId] = useState('')
  const [reason, setReason] = useState('')
  const [notice, setNotice] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  async function loadApplications() {
    setLoading(true)
    setErrorMessage('')
    try {
      setPartners(await adminApi.listDeliveryPartners(status))
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    adminApi.listDeliveryPartners(status)
      .then((result) => { if (active) setPartners(result) })
      .catch((error) => { if (active) setErrorMessage(error.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [status])

  async function review(partner, decision) {
    setBusyId(partner._id)
    setNotice('')
    setErrorMessage('')
    try {
      if (decision === 'APPROVED') await adminApi.approveDeliveryPartner(partner._id)
      else await adminApi.rejectDeliveryPartner(partner._id, reason)
      setNotice(`${partner.userId?.name || 'Partner'} ${decision === 'APPROVED' ? 'approved' : 'rejected'}.`)
      setRejectingId('')
      setReason('')
      await loadApplications()
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setBusyId('')
    }
  }

  return (
    <main className="admin-review-page">
      <header className="admin-review-topbar"><Link className="admin-review-brand" to="/"><span>n</span>nosh <small>ADMIN</small></Link><Link className="admin-review-back" to="/delivery/dashboard"><ArrowLeft size={14} /> Back to delivery workspace</Link></header>
      <div className="admin-review-content">
        <div className="admin-review-heading"><div><span className="admin-review-eyebrow"><ShieldCheck size={13} /> PARTNER OPERATIONS</span><h1>Delivery partner review<span>.</span></h1><p>Review vehicle and licence details before enabling delivery access.</p></div><button className="admin-review-refresh" type="button" onClick={loadApplications} disabled={loading}><RefreshCw size={14} /> Refresh queue</button></div>
        <div className="admin-review-summary"><span className="admin-review-summary-icon"><UserRound size={17} /></span><span><strong>{status === 'PENDING' ? 'Applications awaiting review' : `${status === 'ALL' ? 'All' : status.toLowerCase()} applications`}</strong><small>Partners can only go online after approval.</small></span><b>{partners.length}</b></div>
        <nav className="admin-review-tabs" aria-label="Filter partner applications">{filters.map((filter) => <button type="button" className={status === filter ? 'active' : ''} key={filter} onClick={() => { setLoading(true); setErrorMessage(''); setStatus(filter) }}>{filter === 'ALL' ? 'All' : `${filter.charAt(0)}${filter.slice(1).toLowerCase()}`}</button>)}</nav>
        {notice && <p className="admin-review-notice" role="status">{notice}</p>}
        {errorMessage && <p className="admin-review-error" role="alert">{errorMessage}</p>}
        {loading ? <div className="admin-review-empty">Loading applications…</div> : partners.length === 0 ? <div className="admin-review-empty"><span><Check size={20} /></span><strong>No applications in this queue.</strong><small>New partner submissions will appear here.</small></div> : <section className="admin-application-list">{partners.map((partner) => <article className="admin-application" key={partner._id}><div className="admin-application-head"><span className="admin-applicant-icon"><UserRound size={18} /></span><div><h2>{partner.userId?.name || 'Delivery partner'}</h2><p>{partner.userId?.email} {partner.userId?.phone ? `· ${partner.userId.phone}` : ''}</p></div><span className={`admin-review-status status-${partner.verificationStatus?.toLowerCase()}`}>{partner.verificationStatus || 'PENDING'}</span></div><div className="admin-application-details"><div><small>VEHICLE</small><strong>{partner.vehicleType}</strong></div><div><small>REGISTRATION</small><strong>{partner.vehicleNumber}</strong></div><div><small>SUBMITTED</small><strong>{new Date(partner.updatedAt || partner.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></div></div><a className="admin-document-link" href={partner.licenseDocument} target="_blank" rel="noreferrer"><FileText size={15} /> Open driving licence <ExternalLink size={12} /></a>{partner.verificationStatus === 'REJECTED' && partner.rejectionReason && <p className="admin-rejection-reason"><strong>Previous review note:</strong> {partner.rejectionReason}</p>}{partner.verificationStatus === 'PENDING' && <div className="admin-review-actions">{rejectingId === partner._id ? <form className="admin-reject-form" onSubmit={(event) => { event.preventDefault(); review(partner, 'REJECTED') }}><label>Reason for rejection<textarea value={reason} onChange={(event) => setReason(event.target.value)} required maxLength={1000} placeholder="Tell the partner what needs to be corrected." /></label><button type="button" className="admin-button quiet" onClick={() => { setRejectingId(''); setReason('') }}>Cancel</button><button className="admin-button reject" type="submit" disabled={busyId === partner._id || !reason.trim()}><X size={14} /> Reject</button></form> : <><button className="admin-button approve" type="button" disabled={busyId === partner._id} onClick={() => review(partner, 'APPROVED')}><Check size={14} /> {busyId === partner._id ? 'Reviewing…' : 'Approve partner'}</button><button className="admin-button reject" type="button" disabled={busyId === partner._id} onClick={() => setRejectingId(partner._id)}><X size={14} /> Reject</button></>}</div>}</article>)}</section>}
      </div>
    </main>
  )
}
