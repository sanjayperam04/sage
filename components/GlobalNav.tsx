'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Activity, Plus, BookOpen, Calendar, User, LogOut } from 'lucide-react'
import styles from './GlobalNav.module.css'

export default function GlobalNav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isToday = pathname.startsWith('/dashboard')
  const isLog = pathname.startsWith('/log')
  const isHistory = pathname.startsWith('/history')
  const isFoods = pathname.startsWith('/foods')
  const isProfile = pathname.startsWith('/profile')

  return (
    <>
      {/* Top Navbar */}
      <header className={styles.nav} role="banner">
        <div className={styles.inner}>
          {/* Logo Mark */}
          <Link href="/dashboard" className={styles.logo} id="nav-logo" aria-label="Sage Home">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <path d="M16 4C16 4 25 9.5 25 18C25 22.97 20.97 27 16 27C11.03 27 7 22.97 7 18C7 9.5 16 4 16 4Z" fill="#FFFFFF" />
              <path d="M16 9V23M16 15L20.5 11.5M16 18L11.5 14.5" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Sage</span>
          </Link>

          {/* Desktop Centered Pill */}
          <ul className={styles.desktopNavPill} role="navigation">
            <li>
              <Link href="/dashboard" id="nav-today" className={`${styles.desktopLink} ${isToday ? styles.desktopLinkActive : ''}`}>
                <Activity size={15} strokeWidth={2} />
                <span>Today</span>
              </Link>
            </li>
            <li>
              <Link href="/log" id="nav-log" className={`${styles.desktopLink} ${isLog ? styles.desktopLinkActive : ''}`}>
                <Plus size={15} strokeWidth={2.2} />
                <span>Log Meal</span>
              </Link>
            </li>
            <li>
              <Link href="/history" id="nav-history" className={`${styles.desktopLink} ${isHistory ? styles.desktopLinkActive : ''}`}>
                <Calendar size={15} strokeWidth={2} />
                <span>History</span>
              </Link>
            </li>
            <li>
              <Link href="/foods" id="nav-foods" className={`${styles.desktopLink} ${isFoods ? styles.desktopLinkActive : ''}`}>
                <BookOpen size={15} strokeWidth={2} />
                <span>Foods</span>
              </Link>
            </li>
            <li>
              <Link href="/profile" id="nav-profile" className={`${styles.desktopLink} ${isProfile ? styles.desktopLinkActive : ''}`}>
                <User size={15} strokeWidth={2} />
                <span>Profile</span>
              </Link>
            </li>
          </ul>

          {/* Right Action */}
          <div className={styles.actions}>
            <Link href="/log" id="nav-quick-add" className={styles.logQuickBtn}>
              <Plus size={15} strokeWidth={2.4} />
              <span>Log Meal</span>
            </Link>
            <button
              id="nav-signout"
              onClick={handleSignOut}
              className={styles.signOutBtn}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={16} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </header>

      {/* iOS Native Mobile Bottom Tab Bar */}
      <nav className={styles.mobileTabBar} role="navigation" aria-label="Mobile Navigation">
        <ul className={styles.mobileTabList}>
          <li className={styles.mobileTabItem}>
            <Link href="/dashboard" id="mobile-tab-today" className={`${styles.mobileTabLink} ${isToday ? styles.mobileTabLinkActive : ''}`}>
              <div className={styles.mobileTabIconWrapper}>
                <Activity size={20} strokeWidth={isToday ? 2.4 : 1.8} />
              </div>
              <span className={styles.mobileTabLabel}>Today</span>
            </Link>
          </li>

          <li className={styles.mobileTabItem}>
            <Link href="/foods" id="mobile-tab-foods" className={`${styles.mobileTabLink} ${isFoods ? styles.mobileTabLinkActive : ''}`}>
              <div className={styles.mobileTabIconWrapper}>
                <BookOpen size={20} strokeWidth={isFoods ? 2.4 : 1.8} />
              </div>
              <span className={styles.mobileTabLabel}>Foods</span>
            </Link>
          </li>

          {/* Elevated Center Log Tab */}
          <li className={styles.mobileTabItem}>
            <Link href="/log" id="mobile-tab-log" className={styles.centerLogBtn} aria-label="Log Food">
              <div className={styles.centerLogIconCircle}>
                <Plus size={22} strokeWidth={2.8} />
              </div>
              <span className={styles.mobileTabLabel} style={{ color: isLog ? 'var(--primary)' : 'var(--ink-muted-48)' }}>Log</span>
            </Link>
          </li>

          <li className={styles.mobileTabItem}>
            <Link href="/history" id="mobile-tab-history" className={`${styles.mobileTabLink} ${isHistory ? styles.mobileTabLinkActive : ''}`}>
              <div className={styles.mobileTabIconWrapper}>
                <Calendar size={20} strokeWidth={isHistory ? 2.4 : 1.8} />
              </div>
              <span className={styles.mobileTabLabel}>History</span>
            </Link>
          </li>

          <li className={styles.mobileTabItem}>
            <Link href="/profile" id="mobile-tab-profile" className={`${styles.mobileTabLink} ${isProfile ? styles.mobileTabLinkActive : ''}`}>
              <div className={styles.mobileTabIconWrapper}>
                <User size={20} strokeWidth={isProfile ? 2.4 : 1.8} />
              </div>
              <span className={styles.mobileTabLabel}>Profile</span>
            </Link>
          </li>
        </ul>
      </nav>
    </>
  )
}
