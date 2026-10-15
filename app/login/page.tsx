'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import styles from './login.module.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: displayName || email.split('@')[0] },
        },
      })
      if (error) {
        setError(error.message)
      } else {
        setMessage('Account created! Check your email to confirm, then sign in.')
        setIsSignUp(false)
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    }
    setLoading(false)
  }

  return (
    <div className={styles.page}>
      {/* Background gradient blobs */}
      <div className={styles.blob1} />
      <div className={styles.blob2} />

      <div className={styles.container}>
        {/* Logo / Brand */}
        <div className={styles.brand}>
          <div className={styles.logoMark}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="16" fill="#0066cc"/>
              <path d="M16 8C11.582 8 8 11.582 8 16C8 20.418 11.582 24 16 24C20.418 24 24 20.418 24 16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="20" cy="10" r="2.5" fill="white"/>
              <path d="M12 16H20M16 12V20" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className={styles.brandName}>NutriTrack</h1>
          <p className={styles.brandTagline}>Your personal nutrition companion</p>
        </div>

        {/* Auth card */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className={styles.cardSubtitle}>
            {isSignUp
              ? 'Start tracking your nutrition journey today'
              : 'Sign in to your account to continue'
            }
          </p>

          {error && (
            <div className={styles.errorBanner} role="alert">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          {message && (
            <div className={styles.successBanner} role="status">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            {isSignUp && (
              <div className={styles.field}>
                <label htmlFor="display-name" className="label">Your Name</label>
                <input
                  id="display-name"
                  type="text"
                  className="input-rect"
                  placeholder="e.g. Sanja"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            )}

            <div className={styles.field}>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                className="input-rect"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                className="input-rect"
                placeholder={isSignUp ? 'At least 8 characters' : '••••••••'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={isSignUp ? 8 : 1}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '8px', height: '48px', fontSize: '17px' }}
            >
              {loading ? (
                <span className={styles.loadingDots}>
                  <span />
                  <span />
                  <span />
                </span>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          <p className={styles.switchMode}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              id="auth-toggle-btn"
              onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null) }}
              className={styles.switchBtn}
            >
              {isSignUp ? 'Sign In' : 'Create one'}
            </button>
          </p>
        </div>

        {/* Features preview */}
        <div className={styles.features}>
          {[
            { icon: '🥗', label: 'Calorie & Macro Tracking' },
            { icon: '💧', label: 'Water Intake' },
            { icon: '🤖', label: 'Groq AI Food Analysis' },
            { icon: '📊', label: 'Weekly Insights' },
          ].map((f, i) => (
            <div key={f.label} className={styles.featureChip} style={{ animationDelay: `${i * 60}ms` }}>
              <span>{f.icon}</span>
              <span className="t-caption">{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
