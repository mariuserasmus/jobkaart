/**
 * Google Analytics 4 Event Tracking Utilities
 *
 * Usage:
 * import { trackEvent } from '@/lib/analytics'
 * trackEvent('button_click', { button_name: 'Sign Up' })
 */

// Extend Window interface to include gtag
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void
    dataLayer?: any[]
  }
}

/**
 * Track a custom event in Google Analytics
 */
export function trackEvent(
  eventName: string,
  eventParams?: Record<string, any>
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams)
  }
}

/**
 * Pre-defined event tracking functions for common actions
 */

export const analytics = {
  // Button clicks
  trackSignUpClick: () => {
    trackEvent('sign_up_click', {
      button_location: 'hero',
      event_category: 'engagement',
    })
  },

  trackLoginClick: () => {
    trackEvent('login_click', {
      button_location: 'hero',
      event_category: 'engagement',
    })
  },

  trackWaitingListClick: () => {
    trackEvent('waiting_list_click', {
      button_location: 'cta',
      event_category: 'engagement',
    })
  },

  // Form submissions
  trackWaitingListSubmit: (success: boolean) => {
    trackEvent('waiting_list_submit', {
      success: success,
      event_category: 'conversion',
    })
  },

  trackContactFormSubmit: (success: boolean) => {
    trackEvent('contact_form_submit', {
      success: success,
      event_category: 'conversion',
    })
  },

  // Navigation
  trackSectionView: (sectionName: string) => {
    trackEvent('section_view', {
      section_name: sectionName,
      event_category: 'engagement',
    })
  },

  // Scroll tracking
  trackScrollDepth: (percentage: number) => {
    trackEvent('scroll_depth', {
      percentage: percentage,
      event_category: 'engagement',
    })
  },

  // User authentication
  trackSignUpComplete: (method: string = 'email') => {
    trackEvent('sign_up', {
      method: method,
      event_category: 'conversion',
    })
  },

  trackLogin: (method: string = 'email') => {
    trackEvent('login', {
      method: method,
      event_category: 'conversion',
    })
  },

  // Signup page specific tracking
  trackSignupPageView: () => {
    trackEvent('signup_page_view', {
      event_category: 'engagement',
    })
  },

  trackSignupFormStart: () => {
    trackEvent('signup_form_start', {
      event_category: 'engagement',
    })
  },

  trackSignupFormError: (errorMessage: string) => {
    trackEvent('signup_form_error', {
      error_message: errorMessage,
      event_category: 'error',
    })
  },

  trackSignupFormSubmit: () => {
    trackEvent('signup_form_submit', {
      event_category: 'conversion',
    })
  },

  // Subscription/Pricing
  trackPricingView: (plan: string) => {
    trackEvent('pricing_view', {
      plan_name: plan,
      event_category: 'engagement',
    })
  },

  trackTrialStart: (plan: string) => {
    trackEvent('trial_start', {
      plan_name: plan,
      event_category: 'conversion',
    })
  },
}
