import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/nav/Navbar'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Denver Live Music',
  description: 'Every live music event in Denver, all in one place. Browse shows at Red Rocks, Mission Ballroom, Bluebird Theater, and more.',
  keywords: 'Denver live music, Denver concerts, Denver shows, Red Rocks, Mission Ballroom',
  openGraph: {
    title: 'Denver Live Music',
    description: 'Every live music event in Denver, all in one place.',
    type: 'website',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en">
      <body className="min-h-screen bg-surface-900 text-white">
        <Navbar user={user} />
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
        <footer className="border-t border-white/5 py-8 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white/40 text-sm">
            <p>Denver Live Music &mdash; Your guide to live music in the Mile High City</p>
            <p className="mt-1">Events sourced from Ticketmaster &amp; Bandsintown</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
