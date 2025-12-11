import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes
 * Used by shadcn/ui components
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency for South African Rand
 * Using deterministic formatting to avoid hydration mismatches
 */
export function formatCurrency(amount: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'R0.00'
  return `R${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

/**
 * Format phone number for South African format
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '')

  // Format as: 082 123 4567
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
  }

  return phone
}

/**
 * Format phone number for WhatsApp with country code
 * Converts SA phone numbers to international format (27...)
 */
export function formatPhoneForWhatsApp(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '')

  // If already starts with 27, use as is
  if (cleaned.startsWith('27')) {
    return cleaned
  }

  // If starts with 0, replace with 27
  if (cleaned.startsWith('0')) {
    return `27${cleaned.slice(1)}`
  }

  // Otherwise assume it's missing country code, add 27
  return `27${cleaned}`
}

/**
 * Generate a unique public link ID
 */
export function generatePublicLink(prefix: string = ''): string {
  const randomString = Math.random().toString(36).substring(2, 15)
  const timestamp = Date.now().toString(36)
  return `${prefix}${timestamp}${randomString}`
}

/**
 * Calculate VAT (15% in South Africa)
 */
export function calculateVAT(amount: number, vatRegistered: boolean = false): {
  subtotal: number
  vat: number
  total: number
} {
  if (!vatRegistered) {
    return {
      subtotal: amount,
      vat: 0,
      total: amount,
    }
  }

  const vat = amount * 0.15
  return {
    subtotal: amount,
    vat: vat,
    total: amount + vat,
  }
}

/**
 * Format date for display
 * Using deterministic formatting to avoid hydration mismatches
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

/**
 * Get relative time (e.g., "2 days ago")
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`
  return `${Math.floor(diffInSeconds / 31536000)} years ago`
}
