'use client'

import { useState } from 'react'

export default function WaitingList() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    trade: '',
    otherTrade: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const trades = [
    'Plumber',
    'Electrician',
    'Handyman',
    'Painter',
    'Pool Service',
    'Pest Control',
    'Tiler',
    'Carpenter',
    'HVAC/Aircon',
    'Other'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Web3Forms API endpoint
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          access_key: process.env.NEXT_PUBLIC_WEB3FORMS_KEY || 'YOUR_WEB3FORMS_KEY_HERE',
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          trade: formData.trade === 'Other' ? formData.otherTrade : formData.trade,
          message: formData.message,
          subject: 'New JobKaart Contact Inquiry',
          from_name: 'JobKaart Contact Form'
        })
      })

      const data = await response.json()

      if (data.success) {
        setSubmitted(true)
        // Reset form after 3 seconds
        setTimeout(() => {
          setSubmitted(false)
          setFormData({ name: '', email: '', phone: '', trade: '', otherTrade: '', message: '' })
        }, 3000)
      } else {
        console.error('Form submission failed:', data)
        alert('Something went wrong. Please try again.')
      }
    } catch (error) {
      console.error('Form submission error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <section id="contact" className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 lg:p-12">
          {/* Header */}
          <div className="text-center mb-10">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Questions Before You Join?
            </h2>
            <p className="text-xl text-gray-600">
              We're here to help! Ask us anything about JobKaart and we'll get back to you within 24 hours.
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-lg text-green-600 font-semibold">
                ✨ 14-Day Free Trial • No credit card needed
              </p>
              <p className="text-lg text-blue-600 font-semibold">
                💬 Get answers before you commit
              </p>
            </div>
          </div>

          {/* Form */}
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Johan van der Merwe"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="johan@example.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  WhatsApp Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="082 123 4567"
                />
              </div>

              {/* Trade */}
              <div>
                <label htmlFor="trade" className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Trade *
                </label>
                <select
                  id="trade"
                  name="trade"
                  required
                  value={formData.trade}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="">Select your trade...</option>
                  {trades.map((trade) => (
                    <option key={trade} value={trade}>
                      {trade}
                    </option>
                  ))}
                </select>
              </div>

              {/* Other Trade (conditional) */}
              {formData.trade === 'Other' && (
                <div>
                  <label htmlFor="otherTrade" className="block text-sm font-semibold text-gray-700 mb-2">
                    Please specify your trade *
                  </label>
                  <input
                    type="text"
                    id="otherTrade"
                    name="otherTrade"
                    required
                    value={formData.otherTrade}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="e.g., Locksmith, Roofer"
                  />
                </div>
              )}

              {/* Message / Question */}
              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Question or Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="e.g., How does the quote tracking work? Can I manage multiple teams? Do you integrate with Xero?"
                />
                <p className="mt-1 text-xs text-gray-500">Optional - but helps us give you specific answers!</p>
              </div>

              {/* Privacy Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs text-gray-700 leading-relaxed">
                  🔒 <span className="font-semibold">Your privacy matters.</span> We'll only use your information to answer your questions and send you helpful info about JobKaart. We never share or sell your data. POPIA compliant.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold text-xl px-8 py-4 rounded-lg shadow-lg transform transition hover:scale-105 disabled:hover:scale-100"
              >
                {isSubmitting ? 'Sending...' : 'Send My Question'}
              </button>

              <p className="text-center text-sm text-gray-500">
                We'll get back to you within 24 hours via email or WhatsApp.
              </p>
            </form>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-3xl font-bold text-green-600 mb-2">
                Message Received!
              </h3>
              <p className="text-xl text-gray-700">
                We'll get back to you within 24 hours via email or WhatsApp.
              </p>
              <p className="text-lg text-blue-600 font-semibold mt-4">
                💬 Thanks for reaching out!
              </p>
            </div>
          )}

          {/* Social Proof */}
          <div className="mt-10 pt-8 border-t border-gray-200">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-1">R299</div>
                <div className="text-sm text-gray-600">per month</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-1">1,238%</div>
                <div className="text-sm text-gray-600">ROI on first recovered quote</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-1">10 min</div>
                <div className="text-sm text-gray-600">setup time</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}