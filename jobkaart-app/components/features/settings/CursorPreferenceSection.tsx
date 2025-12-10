'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface CursorPreferenceSectionProps {
  initialCursor: string
  userId: string
}

const cursorOptions = [
  { value: 'default', label: 'Default Pointer', icon: '👆' },
  { value: 'spanner', label: 'Spanner', icon: '🔧', description: 'Perfect for plumbers & mechanics' },
  { value: 'hammer', label: 'Hammer', icon: '🔨', description: 'Great for builders & carpenters' },
  { value: 'brush', label: 'Paint Brush', icon: '🖌️', description: 'Ideal for painters & decorators' },
  { value: 'screwdriver', label: 'Screwdriver', icon: '🪛', description: 'For electricians & installers' },
  { value: 'drill', label: 'Drill', icon: '⚒️', description: 'Construction & handymen' },
]

export default function CursorPreferenceSection({ initialCursor, userId }: CursorPreferenceSectionProps) {
  const [selectedCursor, setSelectedCursor] = useState(initialCursor || 'default')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/cursor-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cursorStyle: selectedCursor }),
      })

      if (!response.ok) throw new Error('Failed to save cursor preference')

      setMessage({ type: 'success', text: 'Cursor preference saved! Refresh the page to see changes.' })

      // Reload page after 1 second to apply new cursor
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Error saving cursor preference:', error)
      setMessage({ type: 'error', text: 'Failed to save cursor preference. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Cursor Style</h2>
        <p className="text-sm text-gray-600">
          Choose a cursor that matches your trade. Your custom cursor will appear when hovering over clickable items.
        </p>
      </div>

      {/* Cursor Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cursorOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setSelectedCursor(option.value)}
            className={`
              relative p-4 rounded-lg border-2 transition-all text-left
              ${
                selectedCursor === option.value
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow'
              }
            `}
          >
            {/* Selected Badge */}
            {selectedCursor === option.value && (
              <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                ✓
              </div>
            )}

            {/* Icon */}
            <div className="text-4xl mb-2">{option.icon}</div>

            {/* Label */}
            <h3 className="font-semibold text-gray-900 mb-1">{option.label}</h3>

            {/* Description */}
            {option.description && (
              <p className="text-xs text-gray-600">{option.description}</p>
            )}

            {/* Preview hint */}
            {option.value !== 'default' && (
              <p className="text-xs text-blue-600 mt-2 italic">
                Hover over this card to preview
              </p>
            )}
          </button>
        ))}
      </div>

      {/* Preview Section */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Test Your Cursor</h3>
        <p className="text-sm text-gray-600 mb-4">
          Hover over the button below to see how your selected cursor looks:
        </p>
        <Button
          type="button"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Hover over me to preview your cursor!
        </Button>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <Button
          onClick={handleSave}
          disabled={saving || selectedCursor === initialCursor}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {saving ? 'Saving...' : 'Save Cursor Preference'}
        </Button>

        {selectedCursor !== initialCursor && (
          <span className="text-sm text-amber-600">
            Unsaved changes
          </span>
        )}
      </div>

      {/* Success/Error Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Pro Tip</h4>
        <p className="text-sm text-blue-800">
          Your custom cursor shows your professional style! It only appears on clickable elements
          (buttons, links, cards) - your normal cursor stays the same for everything else.
        </p>
      </div>
    </div>
  )
}
