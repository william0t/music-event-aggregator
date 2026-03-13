import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AccountClient from './AccountClient'
import type { Venue, UserPreferences } from '@/types'

export const metadata = {
  title: 'My Account — Denver Live Music',
}

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Get or create user preferences
  let { data: prefs } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!prefs) {
    const { data: newPrefs } = await supabase
      .from('user_preferences')
      .insert({
        user_id: user.id,
        followed_venue_ids: [],
        followed_artists: [],
      })
      .select()
      .single()
    prefs = newPrefs
  }

  // Get all venues
  const { data: venues } = await supabase
    .from('venues')
    .select('*')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">My Account</h1>
        <p className="text-white/50 mt-1">{user.email}</p>
      </div>

      <AccountClient
        userId={user.id}
        prefs={prefs as UserPreferences}
        venues={(venues ?? []) as Venue[]}
      />
    </div>
  )
}
