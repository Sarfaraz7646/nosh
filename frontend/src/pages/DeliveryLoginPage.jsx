import { useState } from 'react'
import { ArrowRight, LockKeyhole } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import AuthFrame from '../components/AuthFrame'
import { useCustomer } from '../hooks/useCustomer'

export default function DeliveryLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { signIn, signOut } = useCustomer()
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setErrorMessage('')
    try {
      const user = await signIn({ email, password, role: 'DELIVERY_PARTNER' })
      if (user.role !== 'DELIVERY_PARTNER') {
        signOut()
        throw new Error('Use a delivery partner account to sign in here.')
      }
      navigate('/delivery/dashboard', { replace: true })
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthFrame eyebrow="YOUR NEXT STOP STARTS HERE" quote="A city feels smaller when you know every good turn." byline="Nosh Delivery · Bengaluru">
      <span className="eyebrow">DELIVERY PARTNER</span>
      <h1>Ready when you are.</h1>
      <p className="auth-subtitle">Sign in to get on the road.</p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="delivery-email">Email address</label>
        <input id="delivery-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <div className="label-row"><label htmlFor="delivery-password">Password</label></div>
        <div className="password-field"><input id="delivery-password" type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} /><LockKeyhole size={17} /></div>
        {errorMessage && <p className="auth-error" role="alert">{errorMessage}</p>}
        <button className="button button-primary auth-submit" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'} <ArrowRight size={17} /></button>
      </form>
      <p className="auth-switch">New delivery partner? <Link to="/delivery/register">Create an account</Link></p>
      <p className="auth-switch delivery-customer-link"><Link to="/login">Customer sign in</Link></p>
    </AuthFrame>
  )
}
