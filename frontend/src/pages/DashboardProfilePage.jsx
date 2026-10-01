import { useState } from 'react'
import { ArrowRight, Image, MapPin, Save, Store } from 'lucide-react'
import { useRestaurantDashboard } from '../hooks/useRestaurantDashboard'

export default function DashboardProfilePage() {
  const { profile, updateProfile, syncProfile } = useRestaurantDashboard()
  const [form, setForm] = useState({ name: profile.name || '', description: profile.description || '', cuisine: profile.cuisine || '', image: profile.image || '', addressLine1: profile.addressLine1 || '', city: profile.city || '', state: profile.state || '', postalCode: profile.postalCode || '', locationLongitude: profile.locationLongitude || '', locationLatitude: profile.locationLatitude || '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    updateProfile(form)
    await syncProfile(form)
    setSaving(false)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="dashboard-page page-enter">
      <div className="dashboard-page-heading"><div><span className="eyebrow">YOUR FIRST IMPRESSION</span><h1>Restaurant profile<span className="title-dot">.</span></h1><p>Keep the details fresh. Good discovery starts here.</p></div><span className="profile-status"><Store size={15} /> {profile.isApproved ? 'Approved' : 'Partner profile'}</span></div>
      <div className="restaurant-profile-grid"><section className="dashboard-panel profile-editor-panel"><div className="dashboard-panel-title"><span className="eyebrow">THE DETAILS</span><h2>About your restaurant</h2></div><form className="restaurant-profile-form" onSubmit={handleSubmit}><label>Restaurant name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength={150} /></label><label>Short description<textarea rows="4" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} maxLength={2000} /></label><label>Cuisine types<input value={form.cuisine} onChange={(event) => setForm({ ...form, cuisine: event.target.value })} placeholder="North Indian, Comfort food" /></label><label>Cover image URL<input type="url" value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} placeholder="https://..." /></label>{!profile._id && <div className="onboarding-address"><span className="eyebrow">RESTAURANT ADDRESS</span><label>Street address<input value={form.addressLine1} onChange={(event) => setForm({ ...form, addressLine1: event.target.value })} required /></label><div className="profile-address-grid"><label>City<input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} required /></label><label>State<input value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} required /></label><label>PIN code<input value={form.postalCode} onChange={(event) => setForm({ ...form, postalCode: event.target.value })} required pattern="[0-9]{6}" /></label></div></div>}<div className="onboarding-address"><span className="eyebrow">PICKUP LOCATION</span><p className="location-help">Used to route delivery requests to the closest available partner. Coordinates are longitude and latitude.</p><div className="location-coordinate-grid"><label>Latitude<input type="number" inputMode="decimal" min="-90" max="90" step="any" value={form.locationLatitude} onChange={(event) => setForm({ ...form, locationLatitude: event.target.value })} required /></label><label>Longitude<input type="number" inputMode="decimal" min="-180" max="180" step="any" value={form.locationLongitude} onChange={(event) => setForm({ ...form, locationLongitude: event.target.value })} required /></label></div></div><button className="dashboard-primary-button" type="submit" disabled={saving}>{saved ? <Save size={15} /> : <ArrowRight size={15} />}{saving ? 'Saving…' : saved ? 'Saved' : profile._id ? 'Save profile' : 'Create restaurant profile'}</button></form></section><aside className="dashboard-panel profile-preview-panel"><div className="dashboard-panel-title"><span className="eyebrow">CUSTOMER VIEW</span><h2>How it looks</h2></div><div className="profile-preview-image"><img src={form.image} alt={`${form.name} cover`} /><span><Image size={14} /> Cover image</span></div><div className="profile-preview-copy"><span className="eyebrow">{form.cuisine || 'CUISINE'}</span><h3>{form.name || 'Restaurant name'}</h3><p>{form.description || 'Your description will appear here.'}</p><div className="preview-address"><MapPin size={14} /><span>{profile.address || [form.addressLine1, form.city].filter(Boolean).join(', ') || 'Add an address'}</span></div></div><div className="profile-preview-foot">New restaurant profiles require admin approval before customer listing.</div></aside></div>
    </div>
  )
}
