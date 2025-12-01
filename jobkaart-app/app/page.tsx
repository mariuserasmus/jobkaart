'use client'

import { useState } from 'react'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import ROI from '@/components/ROI'
import WaitingList from '@/components/WaitingList'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <ROI />
      <WaitingList />
      <Footer />
    </main>
  )
}