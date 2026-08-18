import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import InstallPrompt from './InstallPrompt'

describe('InstallPrompt Component', () => {
  let originalUserAgent;

  beforeEach(() => {
    originalUserAgent = window.navigator.userAgent;
    vi.useFakeTimers()
  })

  afterEach(() => {
    Object.defineProperty(window.navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true
    })
    vi.useRealTimers()
  })

  it('renders correctly for iOS after timeout', () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'iphone',
      configurable: true
    })

    render(<InstallPrompt />)

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByText(/Instalar App PetOne/i)).toBeInTheDocument()
  })
})
