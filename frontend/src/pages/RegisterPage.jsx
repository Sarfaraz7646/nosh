import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthFrame from '../components/AuthFrame'
import { useCustomer } from '../hooks/useCustomer'

export default function RegisterPage() {
  const location = useLocation()
  const initialRole = new URLSearchParams(location.search).get('role') || (location.pathname.startsWith('/delivery/') ? 'DELIVERY_PARTNER' : 'CUSTOMER')
  const [form, setForm] = useState({ name: '', email: '', password: '', role: initialRole })
  const [errorMessage, setErrorMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { signIn } = useCustomer()
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setErrorMessage('')
    try {
      const user = await signIn(form)
      navigate(user.role === 'RESTAURANT' ? '/dashboard/profile' : user.role === 'DELIVERY_PARTNER' ? '/delivery/profile' : '/', { replace: true })
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  return (
    <AuthFrame eyebrow="Good things start here" quote="A new favourite is only a few taps away." byline="Fresh finds, familiar comforts · Bengaluru">
      <span className="eyebrow">JOIN THE TABLE</span>
      <h1>Make yourself at home.</h1>
      <p className="auth-subtitle">Create your account. Dinner can wait a minute.</p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <fieldset className="account-type-field"><legend>I'm joining as</legend><label><input type="radio" name="role" value="CUSTOMER" checked={form.role === 'CUSTOMER'} onChange={updateField} /> Customer</label><label><input type="radio" name="role" value="RESTAURANT" checked={form.role === 'RESTAURANT'} onChange={updateField} /> Restaurant partner</label><label><input type="radio" name="role" value="DELIVERY_PARTNER" checked={form.role === 'DELIVERY_PARTNER'} onChange={updateField} /> Delivery partner</label></fieldset>
        <label htmlFor="register-name">Your name</label>
        <input id="register-name" name="name" autoComplete="name" placeholder="How should we call you?" value={form.name} onChange={updateField} required />
        <label htmlFor="register-email">Email address</label>
        <input id="register-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={updateField} required />
        <label htmlFor="register-password">Create a password</label>
        <input id="register-password" name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" value={form.password} onChange={updateField} required minLength={8} />
        {errorMessage && <p className="auth-error" role="alert">{errorMessage}</p>}
        <button className="button button-primary auth-submit" type="submit" disabled={submitting}>{submitting ? 'Creating account…' : 'Create account'} <ArrowRight size={17} /></button>
      </form>
      <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
    </AuthFrame>
  )
}
