import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'JobKaart - Stop Losing Jobs. Get Paid Faster.',
  description: 'Simple job management for South African tradespeople. Track quotes, jobs, and invoices. Never lose another job to forgotten follow-ups.',
  keywords: 'job management, quotes, invoicing, tradespeople, plumber, electrician, South Africa',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'JobKaart',
  },
  openGraph: {
    title: 'JobKaart - Stop Losing Jobs. Get Paid Faster.',
    description: 'Simple job management for South African tradespeople. R299/month. 14-day free trial.',
    type: 'website',
    locale: 'en_ZA',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0284c7',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}