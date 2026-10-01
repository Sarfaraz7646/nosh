import { useState } from 'react'
import { ArrowRight, Check, FileText, ShieldCheck, UserRound } from 'lucide-react'
import { useCustomer } from '../hooks/useCustomer'
import { useDeliveryPartner } from '../hooks/useDeliveryPartner'

export default function DeliveryProfilePage() {
  const { user } = useCustomer()
  const delivery = useDeliveryPartner()
  const { profile, saveProfile, apiNotice, setApiNotice } = delivery
  const formKey = profile._id || `${profile.vehicleType}:${profile.vehicleNumber}:${profile.licenseDocument}`

  return <DeliveryProfileEditor key={formKey} user={user} profile={profile} saveProfile={saveProfile} apiNotice={apiNotice} setApiNotice={setApiNotice} />
}

function DeliveryProfileEditor({ user, profile, saveProfile, apiNotice, setApiNotice }) {
  const [form, setForm] = useState({ vehicleType: profile.vehicleType || 'Motorcycle', vehicleNumber: profile.vehicleNumber || '', licenseDocument: profile.licenseDocument || '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const verificationStatus = profile.verificationStatus || (profile.isVerified ? 'APPROVED' : 'PENDING')
  const verificationLabel = verificationStatus === 'APPROVED' ? 'Verified partner' : verificationStatus === 'REJECTED' ? 'Changes requested' : 'Verification pending'

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setSaved(false)
    try {
      await saveProfile(form)
      setSaved(true)
    } catch (error) {
      setApiNotice(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="delivery-page page-enter">
      <div className="delivery-page-heading"><div><span className="delivery-eyebrow">YOUR DETAILS, KEPT CURRENT</span><h1>My profile<span className="delivery-title-dot">.</span></h1><p>Keep your ride and verification details up to date.</p></div><span className={`delivery-verification-pill ${verificationStatus === 'APPROVED' ? 'verified' : verificationStatus === 'REJECTED' ? 'rejected' : ''}`}>{verificationStatus === 'APPROVED' ? <Check size={13} /> : <ShieldCheck size={13} />}{verificationLabel}</span></div>
      {verificationStatus === 'REJECTED' && profile.rejectionReason && <p className="delivery-rejection-note"><strong>Changes requested:</strong> {profile.rejectionReason} Update the details and submit again for review.</p>}
      <div className="delivery-profile-layout"><section className="delivery-panel delivery-profile-card"><div className="delivery-profile-person"><span><UserRound size={24} /></span><div><strong>{profile.userId?.name || user?.name || 'Delivery partner'}</strong><small>{profile.userId?.email || user?.email || ''}</small></div></div><div className="delivery-profile-rule" /><div className="delivery-profile-row"><span>Partner rating</span><strong>★ {Number(profile.rating || 0).toFixed(1)}</strong></div><div className="delivery-profile-row"><span>Lifetime earnings</span><strong>₹{Number(profile.earnings || 0).toLocaleString('en-IN')}</strong></div><div className="delivery-profile-row"><span>Partner status</span><strong>{verificationLabel}</strong></div></section><section className="delivery-panel delivery-profile-form-panel"><span className="delivery-eyebrow">VEHICLE & DOCUMENTS</span><h2>Partner details</h2><form className="delivery-profile-form" onSubmit={handleSubmit}><label>Vehicle type<select value={form.vehicleType} onChange={(event) => setForm({ ...form, vehicleType: event.target.value })}><option>Motorcycle</option><option>Scooter</option><option>Bicycle</option><option>Electric scooter</option></select></label><label>Vehicle registration<input value={form.vehicleNumber} onChange={(event) => setForm({ ...form, vehicleNumber: event.target.value.toUpperCase() })} placeholder="KA 03 MN 4821" required maxLength={30} /></label><label>Driving licence document URL<input type="url" value={form.licenseDocument} onChange={(event) => setForm({ ...form, licenseDocument: event.target.value })} placeholder="https://…" required maxLength={500} /></label><div className="license-note"><FileText size={15} /><span>Use a secure document link. Verification is completed by the partner team.</span></div><button className="delivery-primary-action" type="submit" disabled={saving}>{saving ? 'Saving…' : saved ? 'Saved' : 'Submit details for review'} {saved ? <Check size={15} /> : <ArrowRight size={15} />}</button></form>{apiNotice && <p className="delivery-form-notice" role="status">{apiNotice}</p>}</section></div>
    </div>
  )
}
