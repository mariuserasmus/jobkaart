'use client'

import { useState } from 'react'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import ROI from '@/components/ROI'
import WaitingList from '@/components/WaitingList'
import Footer from '@/components/Footer'

export default function Home() {
  // Structured data for SEO (JSON-LD)
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'JobKaart',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, iOS, Android',
    description: 'Job management software for South African plumbers, electricians and tradespeople. Track quotes, jobs and invoices.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'ZAR',
      priceValidUntil: '2026-12-31',
      availability: 'https://schema.org/InStock',
    },
    author: {
      '@type': 'Organization',
      name: 'JobKaart',
      url: 'https://jobkaart.co.za',
    },
    url: 'https://jobkaart.co.za',
    audience: {
      '@type': 'Audience',
      audienceType: 'Tradespeople, Plumbers, Electricians, Handymen',
      geographicArea: {
        '@type': 'Country',
        name: 'South Africa',
      },
    },
  }

  const faqData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How much does JobKaart cost?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'JobKaart is FREE forever with 5 quotes, jobs, and invoices per month. Upgrade to paid plans starting at R299/month for unlimited usage. No credit card required to start.',
        },
      },
      {
        '@type': 'Question',
        name: 'What features does JobKaart include?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'JobKaart includes customer management, professional quote creation, job tracking, invoicing, WhatsApp integration, and payment tracking. Everything SA tradies need to run their business.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does JobKaart work on mobile?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! JobKaart is a Progressive Web App (PWA) that works perfectly on mobile. Add it to your home screen for a native app experience on Android and iPhone.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I use JobKaart offline?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'JobKaart works offline for viewing previously loaded data. You can view customers, quotes, and jobs even without internet connection.',
        },
      },
    ],
  }

  return (
    <>
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />

      <main className="min-h-screen">
        <Hero />
        <Features />
        <ROI />
        <WaitingList />
        <Footer />
      </main>
    </>
  )
}