'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/db/supabase-client'
import { analytics } from '@/lib/analytics'
import Link from 'next/link'

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    businessName: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [formStarted, setFormStarted] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Track page view on mount
  useEffect(() => {
    analytics.trackSignupPageView()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Track when user starts filling form (only once)
    if (!formStarted) {
      analytics.trackSignupFormStart()
      setFormStarted(true)
    }

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (step === 1) {
      // Validate step 1
      if (!formData.businessName || !formData.email) {
        setError('Please fill in all fields')
        analytics.trackSignupFormError('Missing fields in step 1')
        return
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address')
        analytics.trackSignupFormError('Invalid email format')
        return
      }

      setStep(2)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      analytics.trackSignupFormError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      analytics.trackSignupFormError('Password too short')
      return
    }

    setLoading(true)
    analytics.trackSignupFormSubmit()

    try {
      // Call our signup API endpoint
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business_name: formData.businessName,
          full_name: formData.fullName || formData.businessName, // Use business name if full name not provided
          email: formData.email,
          phone: formData.phone || '', // Make phone optional
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign up')
      }

      // Track successful signup
      analytics.trackSignUpComplete('email')

      // If signup successful and session returned, sign in on client side
      if (data.success && data.session) {
        // Sign in with the client-side Supabase to set cookies
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })

        if (signInError) {
          throw new Error('Account created but sign-in failed. Please log in.')
        }
      }

      // Redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to sign up')
      analytics.trackSignupFormError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4 py-8">
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-8 items-start">
        {/* LEFT SIDE: Social Proof & Benefits */}
        <div className="hidden md:block bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Join SA Tradespeople Using JobKaart
          </h2>

          {/* Benefits List */}
          <div className="space-y-4 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 mt-0.5">
                ✓
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Never Lose a Quote Again</h3>
                <p className="text-sm text-gray-600">Auto-reminders help you follow up at the right time</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 mt-0.5">
                ✓
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Professional Quotes in 2 Minutes</h3>
                <p className="text-sm text-gray-600">Send branded PDF quotes via WhatsApp</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 mt-0.5">
                ✓
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Track Who Owes You Money</h3>
                <p className="text-sm text-gray-600">Know exactly who owes what at a glance</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 mt-0.5">
                ✓
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">14-Day Free Trial</h3>
                <p className="text-sm text-gray-600">No credit card needed. Cancel anytime.</p>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">Why tradespeople trust JobKaart:</p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>🔒 <span className="font-medium">Bank-level security</span> - Your data is encrypted and safe</p>
              <p>☁️ <span className="font-medium">Cloud backup</span> - Never lose your data (even if your bakkie is stolen)</p>
              <p>🇿🇦 <span className="font-medium">Built for SA</span> - WhatsApp integration, PayFast payments, Rands</p>
              <p>📱 <span className="font-medium">Works on phone</span> - Manage jobs from anywhere</p>
            </div>
          </div>

          {/* ROI Reminder */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-900 mb-1">Quick Math:</p>
            <p className="text-xs text-gray-700">
              If JobKaart helps you recover just <span className="font-bold">ONE</span> forgotten R4,000 quote, you've paid for <span className="font-bold">13 months</span> of subscription.
            </p>
          </div>
        </div>

        {/* RIGHT SIDE: Signup Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo / Brand */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-blue-600">JobKaart</h1>
            <p className="text-gray-600 mt-2">Start your 14-day free trial</p>
            <div className="flex justify-center items-center gap-2 mt-3">
              <div className="flex gap-1">
                <div className={`w-8 h-1 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                <div className={`w-8 h-1 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              </div>
              <span className="text-xs text-gray-500">Step {step} of 2</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="businessName"
                  name="businessName"
                  type="text"
                  value={formData.businessName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Johan's Plumbing"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="johan@johansplumbing.co.za"
                />
                <p className="mt-1 text-xs text-gray-500">We'll use this to send you quote notifications</p>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mt-6"
              >
                Continue →
              </button>

              <p className="text-center text-xs text-gray-500 mt-4">
                🔒 Your information is secure and encrypted
              </p>
            </form>
          )}

          {/* STEP 2: Security */}
          {step === 2 && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Full Name (Optional)
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Johan van der Merwe"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="082 123 4567"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  autoFocus
                />
                <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Creating account...' : 'Start Free Trial'}
                </button>
              </div>
            </form>
          )}

          {/* Divider */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
              Sign in
            </Link>
          </div>

          {/* Terms */}
          <p className="mt-6 text-xs text-center text-gray-500">
            By signing up, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
          </p>

          {/* Mobile: Quick benefits */}
          <div className="md:hidden mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-2">What you get:</p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>✓ 14-day free trial (no card needed)</li>
              <li>✓ Professional quotes in 2 minutes</li>
              <li>✓ WhatsApp integration</li>
              <li>✓ Track who owes you money</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
