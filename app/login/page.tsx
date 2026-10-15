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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: displayName || email.split('@')[0] },
        },
      })
      if (error) {
        setError(error.message)
      } else if (data.session) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setMessage('Account created! Please sign in.')
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
      <div className={styles.ambientGlow} />

      <div className={styles.container}>
        {/* Brand Header */}
        <div className={styles.brand}>
          <div className={styles.logoMark}>
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
              <path d="M16 4C16 4 25 9.5 25 18C25 22.97 20.97 27 16 27C11.03 27 7 22.97 7 18C7 9.5 16 4 16 4Z" fill="#FFFFFF" />
              <path d="M16 9V23M16 15L20.5 11.5M16 18L11.5 14.5" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className={styles.brandName}>Sage</h1>
          <p className={styles.brandTagline}>Precision Athletic Nutrition</p>
        </div>

        {/* Minimal Auth Card */}
        <div className={styles.card}>
          <div className={styles.segmentedControl}>
            <button
              type="button"
              id="auth-tab-signin"
              onClick={() => { setIsSignUp(false); setError(null); setMessage(null) }}
              className={`${styles.segmentBtn} ${!isSignUp ? styles.segmentActive : ''}`}
            >
              Sign In
            </button>
            <button
              type="button"
              id="auth-tab-signup"
              onClick={() => { setIsSignUp(true); setError(null); setMessage(null) }}
              className={`${styles.segmentBtn} ${isSignUp ? styles.segmentActive : ''}`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className={styles.errorBanner} role="alert">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className={styles.successBanner} role="status">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            {isSignUp && (
              <div className={styles.field}>
                <label htmlFor="display-name" className="label">Name</label>
                <input
                  id="display-name"
                  type="text"
                  className="input-rect"
                  placeholder="Your name"
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
                placeholder="athlete@sage.fit"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                inputMode="email"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                className="input-rect"
                placeholder={isSignUp ? '8+ characters' : '••••••••'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              className={`btn-primary ${styles.submitBtn}`}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : isSignUp ? 'Begin Journey' : 'Enter Sage'}
            </button>
          </form>
        </div>

        <p className={styles.footerNote}>
          Encrypted & Private · Athlete Sovereign Data
        </p>
      </div>
    </div>
  )
}
