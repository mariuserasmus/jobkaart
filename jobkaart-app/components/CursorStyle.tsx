'use client'

import { useEffect } from 'react'

interface CursorStyleProps {
  cursorStyle: string
}

export default function CursorStyle({ cursorStyle }: CursorStyleProps) {
  useEffect(() => {
    if (cursorStyle === 'default' || !cursorStyle) {
      // Remove custom cursor
      document.documentElement.style.removeProperty('--custom-cursor')
      return
    }

    // Set custom cursor for clickable elements
    const cursorUrl = `/cursors/${cursorStyle}.svg`
    document.documentElement.style.setProperty('--custom-cursor', `url('${cursorUrl}') 12 12, pointer`)

    // Apply cursor to all interactive elements
    const style = document.createElement('style')
    style.id = 'custom-cursor-style'
    style.textContent = `
      /* Custom cursor for interactive elements */
      a, button, [role="button"], .cursor-pointer,
      input[type="button"], input[type="submit"], input[type="reset"],
      select, [onclick], label[for],
      [tabindex]:not([tabindex="-1"]) {
        cursor: var(--custom-cursor) !important;
      }

      /* Keep default cursor for text inputs and text areas */
      input[type="text"], input[type="email"], input[type="password"],
      input[type="search"], input[type="tel"], input[type="url"],
      input[type="number"], textarea {
        cursor: text !important;
      }

      /* Keep default cursor for disabled elements */
      [disabled], [aria-disabled="true"] {
        cursor: not-allowed !important;
      }
    `

    document.head.appendChild(style)

    return () => {
      // Cleanup
      const existingStyle = document.getElementById('custom-cursor-style')
      if (existingStyle) {
        existingStyle.remove()
      }
      document.documentElement.style.removeProperty('--custom-cursor')
    }
  }, [cursorStyle])

  return null // This component doesn't render anything
}
