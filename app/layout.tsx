import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NutriTrack — Personal Calorie & Macro Tracker',
  description: 'Track calories, macros, water, and weight. Powered by Groq AI for instant food analysis. Your personal nutrition companion for gym-goers.',
  keywords: ['calorie tracker', 'macro tracker', 'nutrition', 'gym', 'health', 'diet'],
  authors: [{ name: 'NutriTrack' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NutriTrack',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
