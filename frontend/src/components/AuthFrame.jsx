import { Link } from 'react-router-dom'

export default function AuthFrame({ children, eyebrow, quote, byline }) {
  return (
    <main className="auth-page">
      <section className="auth-visual">
        <Link className="wordmark auth-wordmark" to="/login"><span className="wordmark-mark">n</span>nosh<span className="wordmark-period">.</span></Link>
        <div className="auth-visual-copy">
          <span className="eyebrow light-eyebrow">{eyebrow}</span>
          <p>“{quote}”</p>
          <span className="auth-byline">{byline}</span>
        </div>
        <span className="auth-image-credit">A table worth coming home to</span>
      </section>
      <section className="auth-form-side">
        <div className="auth-form-wrap">{children}</div>
        <span className="auth-legal">By continuing, you agree to our Terms of Service and Privacy Policy.</span>
      </section>
    </main>
  )
}
