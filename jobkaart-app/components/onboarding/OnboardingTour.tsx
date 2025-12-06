'use client'

import { useEffect, useState } from 'react'
import { driver, type DriveStep, type Driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import './onboarding-tour.css'

// Global reference to restart tour (for help menu)
declare global {
  interface Window {
    restartOnboardingTour?: () => void
  }
}

export function OnboardingTour() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Check if user has seen tour before
    const hasSeenTour = localStorage.getItem('jobkaart_onboarding_complete')

    // Auto-start for new users (can be disabled for testing)
    if (!hasSeenTour) {
      // Delay tour start to ensure DOM is ready
      const timer = setTimeout(() => {
        startTour()
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [mounted])

  const startTour = () => {
    // Check if we're on dashboard page
    const isDashboard = window.location.pathname === '/dashboard'

    if (!isDashboard) {
      // If not on dashboard, redirect there first
      window.location.href = '/dashboard'
      return
    }

    const isMobile = window.innerWidth < 768

    const steps: DriveStep[] = [
      // Step 1: Welcome
      {
        popover: {
          title: 'Welcome to JobKaart! 👋',
          description: `
            <div class="tour-content">
              <p>Let's get you set up in 2 minutes!</p>
              <p>We'll walk through creating your first quote and tracking jobs.</p>
              <p class="tour-highlight">This is your last time using a messy notebook in the bakkie! 📋</p>
            </div>
          `,
          side: 'bottom',
          align: 'center',
        },
      },

      // Step 2: Dashboard Overview
      {
        element: '.grid.grid-cols-1.gap-6',
        popover: {
          title: 'Your Command Center 🎯',
          description: isMobile
            ? `
              <div class="tour-content">
                <p>These numbers tell you everything:</p>
                <ul class="tour-list">
                  <li><strong>Customers Owe You</strong> - Chase payments</li>
                  <li><strong>Revenue This Month</strong> - Track earnings</li>
                  <li><strong>Jobs & Quotes</strong> - Your pipeline</li>
                </ul>
              </div>
            `
            : `
              <div class="tour-content">
                <p><strong>"Customers Owe You"</strong> — The most important number!</p>
                <p>This shows how much money you need to collect.</p>
                <p>Track revenue, jobs, and quotes at a glance.</p>
              </div>
            `,
          side: isMobile ? 'bottom' : 'top',
          align: 'center',
        },
      },

      // Step 3: Navigation - Customers
      {
        element: isMobile ? 'button[aria-expanded]' : 'a[href="/customers"]',
        popover: {
          title: 'Add Your Customers 👥',
          description: `
            <div class="tour-content">
              <p>Start by adding <strong>Tannie Maria</strong> or your next customer.</p>
              <p>Store numbers, addresses, and see their full history.</p>
              <p class="tour-tip">💡 No more searching through WhatsApp for that number!</p>
            </div>
          `,
          side: isMobile ? 'bottom' : 'bottom',
          align: 'start',
        },
      },

      // Step 4: Navigation - Quotes
      {
        element: isMobile ? 'button[aria-expanded]' : 'a[href="/quotes"]',
        popover: {
          title: 'Professional Quotes 📄',
          description: `
            <div class="tour-content">
              <p>Build quotes in under 2 minutes.</p>
              <p>Send via WhatsApp as <strong>professional PDFs</strong>.</p>
              <p class="tour-highlight">Know when customers VIEW your quotes!</p>
              <p class="tour-tip">💡 No more paper quotes going through the wash</p>
            </div>
          `,
          side: isMobile ? 'bottom' : 'bottom',
          align: 'start',
        },
      },

      // Step 5: Navigation - Jobs
      {
        element: isMobile ? 'button[aria-expanded]' : 'a[href="/jobs"]',
        popover: {
          title: 'Track Every Job 🔧',
          description: `
            <div class="tour-content">
              <p>Never forget to invoice again!</p>
              <p><strong>6 Simple Statuses:</strong></p>
              <ul class="tour-list">
                <li>Quoted → Scheduled → In Progress</li>
                <li>Complete → Invoiced → Paid ✓</li>
              </ul>
              <p class="tour-tip">💡 We'll remind you when jobs are ready to bill</p>
            </div>
          `,
          side: isMobile ? 'bottom' : 'bottom',
          align: 'start',
        },
      },

      // Step 6: Navigation - Invoices
      {
        element: isMobile ? 'button[aria-expanded]' : 'a[href="/invoices"]',
        popover: {
          title: 'Get Paid Faster 💰',
          description: `
            <div class="tour-content">
              <p>Create invoices from jobs with one click.</p>
              <p>Send via WhatsApp, track payment status.</p>
              <p class="tour-highlight">See which invoices are OVERDUE at a glance</p>
              <p class="tour-tip">💡 Progress billing for big jobs (deposit, progress, balance)</p>
            </div>
          `,
          side: isMobile ? 'bottom' : 'bottom',
          align: 'start',
        },
      },

      // Step 7: Settings
      {
        element: isMobile ? 'button[aria-expanded]' : 'a[href="/settings"]',
        popover: {
          title: 'Your Business Details ⚙️',
          description: `
            <div class="tour-content">
              <p>Add your business name, logo, and banking details.</p>
              <p>This info appears on all quotes and invoices.</p>
              <p class="tour-tip">💡 Set it once, look professional every time</p>
            </div>
          `,
          side: isMobile ? 'bottom' : 'bottom',
          align: 'start',
        },
      },

      // Step 8: Final - Get Started!
      {
        popover: {
          title: "You're All Set! 🎉",
          description: `
            <div class="tour-content">
              <p><strong>Ready to land your first job?</strong></p>
              <p>Start by adding a customer, then create a quote.</p>
              <div class="tour-actions">
                <p class="tour-highlight">Stuck? Need help?</p>
                <p>Click <strong>Settings → Help</strong> to replay this tour anytime.</p>
                <p>Or WhatsApp us — we're here to help!</p>
              </div>
              <p class="tour-final">Now go make some money! 💪</p>
            </div>
          `,
        },
      },
    ]

    const driverObj: Driver = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      allowClose: true,

      // Custom styling
      popoverClass: 'jobkaart-tour-popover',
      progressText: 'Step {{current}} of {{total}}',

      // Custom button text
      nextBtnText: isMobile ? 'Next →' : 'Next Step →',
      prevBtnText: isMobile ? '← Back' : '← Previous',
      doneBtnText: "Let's Go! 🚀",

      // Smooth scrolling
      smoothScroll: true,

      // Steps
      steps,

      // Event callbacks
      onDestroyed: () => {
        // Mark tour as complete
        localStorage.setItem('jobkaart_onboarding_complete', 'true')
        console.log('✅ Onboarding tour completed!')

        // Optional: Track analytics
        // analytics.track('onboarding_tour_completed')
      },

      onHighlightStarted: (element) => {
        console.log('Highlighting:', element)
      },
    })

    driverObj.drive()
  }

  // Expose restart function globally
  useEffect(() => {
    if (mounted) {
      window.restartOnboardingTour = () => {
        // Clear completion flag
        localStorage.removeItem('jobkaart_onboarding_complete')
        // Restart tour
        startTour()
      }
    }

    return () => {
      delete window.restartOnboardingTour
    }
  }, [mounted])

  // No visual component, just side effects
  return null
}
