import { useState } from 'react'
import { ArrowRight, LogOut, Save, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCustomer } from '../hooks/useCustomer'
import RestaurantCard from '../components/RestaurantCard'

export default function ProfilePage() {
  const { user, updateProfile, signOut, favorites, restaurants } = useCustomer()
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' })
  const [saved, setSaved] = useState(false)
  const navigate = useNavigate()

  function handleSubmit(event) {
    event.preventDefault()
    updateProfile(form)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  function handleSignOut() {
    signOut()
    navigate('/login', { replace: true })
  }

  const savedRestaurants = restaurants.filter((restaurant) => favorites.includes(restaurant.id))

  return (
    <div className="profile-page page-enter">
      <div className="page-title-row"><div><span className="eyebrow">YOUR LITTLE CORNER</span><h1>Your profile<span className="title-dot">.</span></h1></div><button className="button button-outline signout-button" type="button" onClick={handleSignOut}><LogOut size={15} /> Sign out</button></div>
      <div className="profile-layout"><aside className="profile-aside"><div className="profile-avatar"><UserRound size={27} /></div><span className="eyebrow">MEMBER SINCE TODAY</span><h2>{user?.name}</h2><p>{user?.email}</p><div className="profile-aside-line" /><span className="profile-aside-note">Good taste looks good on you.</span></aside><section className="profile-main"><span className="eyebrow">THE BASICS</span><h2>Account details</h2><form className="profile-form" onSubmit={handleSubmit}><label>Full name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label><label>Email address<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label><label>Phone number<input type="tel" placeholder="Add a number for easier delivery" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label><button className="button button-primary" type="submit">{saved ? 'Saved' : 'Save changes'} {saved ? <Save size={15} /> : <ArrowRight size={15} />}</button></form></section></div>
      {savedRestaurants.length > 0 && <section className="profile-favourites"><div className="section-heading"><div><span className="eyebrow">YOUR SHORTLIST</span><h2>Saved kitchens.</h2></div></div><div className="restaurant-grid">{savedRestaurants.map((restaurant) => <RestaurantCard restaurant={restaurant} key={restaurant.id} />)}</div></section>}
    </div>
  )
}
