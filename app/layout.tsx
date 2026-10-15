import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sage — Intelligent Nutrition & Macro Architecture',
  description: 'Precision nutrition, macro tracking, and real-time food intelligence for high-performance athletes. Powered by Groq AI and crafted with Apple design principles.',
  keywords: ['Sage', 'nutrition', 'calorie tracker', 'macro tracker', 'gym nutrition', 'fitness intelligence', 'high performance'],
  authors: [{ name: 'Sage' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Sage',
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
