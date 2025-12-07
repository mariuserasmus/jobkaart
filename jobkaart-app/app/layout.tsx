import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { PWAInstaller } from '@/components/layout/PWAInstaller'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'JobKaart - Job Management Software for SA Plumbers & Electricians | R299/month',
  description: 'Stop losing R8,000-12,000/month in forgotten jobs. JobKaart helps SA plumbers, electricians & tradies track quotes, jobs & invoices. 14-day free trial. From R299/month.',
  keywords: 'job management software south africa, plumber invoicing app, electrician quote software, tradie app sa, invoice software for tradies, quote tracking south africa, plumbing business software, electrician business software, handyman job tracking, sa tradie software',
  manifest: '/manifest.json',
  authors: [{ name: 'JobKaart' }],
  creator: 'JobKaart',
  publisher: 'JobKaart',
  alternates: {
    canonical: 'https://jobkaart.co.za',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'JobKaart',
  },
  openGraph: {
    title: 'JobKaart - Job Management Software for SA Plumbers & Electricians',
    description: 'Stop losing R8,000-12,000/month in forgotten jobs. Track quotes, jobs & invoices. 14-day free trial. From R299/month.',
    type: 'website',
    locale: 'en_ZA',
    url: 'https://jobkaart.co.za',
    siteName: 'JobKaart',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JobKaart - Job Management Software for SA Tradies',
    description: 'Stop losing jobs. Get paid faster. R299/month for SA plumbers, electricians & tradies.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#2563eb',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PWAInstaller />
        {children}
      </body>
    </html>
  )
}