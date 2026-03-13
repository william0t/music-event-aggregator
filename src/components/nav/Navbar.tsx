'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Music } from 'lucide-react'
import AuthButton from '@/components/auth/AuthButton'
import type { User } from '@supabase/supabase-js'

interface NavbarProps {
  user: User | null
}

export default function Navbar({ user }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-surface-950/90 backdrop-blur border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg hover:text-brand-500 transition-colors">
            <Music className="w-5 h-5 text-brand-500" />
            Denver Live Music
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/events" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
              Events
            </Link>
            <Link href="/venues" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
              Venues
            </Link>
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center">
            <AuthButton user={user} />
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white/70 hover:text-white p-1"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-surface-950 border-t border-white/5 px-4 py-4 space-y-4">
          <Link
            href="/events"
            className="block text-white/70 hover:text-white text-sm font-medium transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            Events
          </Link>
          <Link
            href="/venues"
            className="block text-white/70 hover:text-white text-sm font-medium transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            Venues
          </Link>
          <div className="pt-2 border-t border-white/10">
            <AuthButton user={user} />
          </div>
        </div>
      )}
    </nav>
  )
}
