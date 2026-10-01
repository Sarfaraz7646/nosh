import { useState } from 'react'
import { ArrowRight, LockKeyhole } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthFrame from '../components/AuthFrame'
import { useCustomer } from '../hooks/useCustomer'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { signIn } = useCustomer()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setErrorMessage('')
    try {
      const user = await signIn({ email, password })
      navigate(user.role === 'ADMIN' ? '/admin/delivery-partners' : user.role === 'RESTAURANT' ? '/dashboard' : user.role === 'DELIVERY_PARTNER' ? '/delivery/dashboard' : location.state?.from || '/', { replace: true })
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthFrame eyebrow="A little something, delivered" quote="The best meals are the ones you didn't have to make." byline="Your table is waiting · Bengaluru">
      <span className="eyebrow">WELCOME BACK</span>
      <h1>Come on in.</h1>
      <p className="auth-subtitle">Sign in to pick up where the good part starts.</p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="login-email">Email address</label>
        <input id="login-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <div className="label-row"><label htmlFor="login-password">Password</label><button type="button" className="text-button" onClick={() => window.alert('Password reset is not connected yet.')}>Forgot password?</button></div>
        <div className="password-field"><input id="login-password" type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} /><LockKeyhole size={17} /></div>
        {errorMessage && <p className="auth-error" role="alert">{errorMessage}</p>}
        <button className="button button-primary auth-submit" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'} <ArrowRight size={17} /></button>
      </form>
      <p className="auth-switch">New around here? <Link to="/register">Create an account</Link></p>
    </AuthFrame>
  )
}
