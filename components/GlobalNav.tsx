'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './GlobalNav.module.css'

const navLinks = [
  { href: '/dashboard', label: 'Today', id: 'nav-today' },
  { href: '/log',       label: 'Log Meal', id: 'nav-log' },
  { href: '/history',   label: 'History', id: 'nav-history' },
  { href: '/foods',     label: 'Foods', id: 'nav-foods' },
  { href: '/profile',   label: 'Profile', id: 'nav-profile' },
]

export default function GlobalNav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className={styles.nav} role="navigation" aria-label="Global navigation">
      <div className={styles.inner}>
        {/* Logo */}
        <Link href="/dashboard" className={styles.logo} id="nav-logo">
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="#0066cc"/>
            <path d="M16 8C11.582 8 8 11.582 8 16C8 20.418 11.582 24 16 24C20.418 24 24 20.418 24 16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="20" cy="10" r="2.5" fill="white"/>
            <path d="M12 16H20M16 12V20" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span>NutriTrack</span>
        </Link>

        {/* Center links */}
        <ul className={styles.links} role="list">
          {navLinks.map(link => (
            <li key={link.href}>
              <Link
                href={link.href}
                id={link.id}
                className={`${styles.link} ${pathname.startsWith(link.href) ? styles.linkActive : ''}`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right actions */}
        <div className={styles.actions}>
          <Link href="/log" id="nav-add-meal" className="btn-primary" style={{ fontSize: '12px', padding: '8px 16px' }}>
            + Add Meal
          </Link>
          <button
            id="nav-signout"
            onClick={handleSignOut}
            className={styles.signOut}
            aria-label="Sign out"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <ul className={styles.mobileNav} role="list">
        {navLinks.map(link => (
          <li key={link.href}>
            <Link
              href={link.href}
              id={`mobile-${link.id}`}
              className={`${styles.mobileLink} ${pathname.startsWith(link.href) ? styles.mobileLinkActive : ''}`}
            >
              {getMobileIcon(link.href)}
              <span>{link.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function getMobileIcon(href: string) {
  const icons: Record<string, React.ReactNode> = {
    '/dashboard': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    '/log':       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
    '/history':   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>,
    '/foods':     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
    '/profile':   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  }
  return icons[href] || null
}
