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
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
              <defs>
                <linearGradient id="sageGradLg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#30D158" />
                  <stop offset="1" stopColor="#107C41" />
                </linearGradient>
              </defs>
              <circle cx="16" cy="16" r="16" fill="url(#sageGradLg)" />
              <path d="M16 6.5C16 6.5 24 11 24 18.5C24 22.642 20.642 26 16.5 26C12.358 26 9 22.642 9 18.5C9 11 16 6.5 16 6.5Z" fill="white" fillOpacity="0.95" />
              <path d="M16 10.5V22.5M16 16.5L19.5 13M16 19L12.5 15.5" stroke="#107C41" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className={styles.brandName}>Sage</h1>
          <p className={styles.brandTagline}>Intelligent Nutrition & Macro Architecture</p>
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
