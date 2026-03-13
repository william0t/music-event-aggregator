'use client'

import { useState } from 'react'
import { Plus, X, Bell, BellOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import type { Venue, UserPreferences } from '@/types'

interface AccountClientProps {
  userId: string
  prefs: UserPreferences
  venues: Venue[]
}

export default function AccountClient({ userId, prefs, venues }: AccountClientProps) {
  const supabase = createClient()

  const [followedVenueIds, setFollowedVenueIds] = useState<string[]>(
    prefs?.followed_venue_ids ?? []
  )
  const [followedArtists, setFollowedArtists] = useState<string[]>(
    prefs?.followed_artists ?? []
  )
  const [newArtist, setNewArtist] = useState('')
  const [newsletterEnabled, setNewsletterEnabled] = useState(
    prefs?.newsletter_enabled ?? false
  )
  const [newsletterDay, setNewsletterDay] = useState(
    prefs?.newsletter_day ?? 'Monday'
  )
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  async function updatePrefs(updates: Partial<UserPreferences>) {
    const { error } = await supabase
      .from('user_preferences')
      .update(updates)
      .eq('user_id', userId)

    return error
  }

  async function toggleVenue(venueId: string) {
    const next = followedVenueIds.includes(venueId)
      ? followedVenueIds.filter(id => id !== venueId)
      : [...followedVenueIds, venueId]

    setFollowedVenueIds(next)
    await updatePrefs({ followed_venue_ids: next })
  }

  async function addArtist(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = newArtist.trim()
    if (!trimmed || followedArtists.includes(trimmed)) return

    const next = [...followedArtists, trimmed]
    setFollowedArtists(next)
    setNewArtist('')
    await updatePrefs({ followed_artists: next })
  }

  async function removeArtist(artist: string) {
    const next = followedArtists.filter(a => a !== artist)
    setFollowedArtists(next)
    await updatePrefs({ followed_artists: next })
  }

  async function saveNewsletterPrefs() {
    setSaving(true)
    setSaveMessage('')
    const error = await updatePrefs({
      newsletter_enabled: newsletterEnabled,
      newsletter_day: newsletterDay,
    })
    setSaving(false)
    setSaveMessage(error ? 'Failed to save. Try again.' : 'Saved!')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  return (
    <div className="space-y-10">
      {/* ─── Followed Venues ─────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-bold text-white mb-1">My Followed Venues</h2>
        <p className="text-white/50 text-sm mb-6">
          Toggle venues to follow. Your followed venues will be highlighted and used for newsletter.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {venues.map(venue => {
            const isFollowed = followedVenueIds.includes(venue.id)
            return (
              <button
                key={venue.id}
                onClick={() => toggleVenue(venue.id)}
                className={`
                  flex items-start justify-between p-4 rounded-xl border text-left transition-all
                  ${isFollowed
                    ? 'border-brand-500 bg-brand-500/10'
                    : 'border-white/10 bg-surface-800 hover:border-white/20'
                  }
                `}
              >
                <div>
                  <p className={`text-sm font-semibold ${isFollowed ? 'text-brand-500' : 'text-white'}`}>
                    {venue.name}
                  </p>
                  {venue.neighborhood && (
                    <p className="text-xs text-white/40 mt-0.5">{venue.neighborhood}</p>
                  )}
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors ${
                  isFollowed ? 'bg-brand-500 border-brand-500' : 'border-white/30'
                }`}>
                  {isFollowed && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* ─── Followed Artists ────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-bold text-white mb-1">My Followed Artists</h2>
        <p className="text-white/50 text-sm mb-6">
          Follow artists by name to get notified when they come to Denver.
        </p>

        {/* Add artist */}
        <form onSubmit={addArtist} className="flex gap-2 mb-4">
          <Input
            placeholder="Artist name..."
            value={newArtist}
            onChange={e => setNewArtist(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="primary" size="md" disabled={!newArtist.trim()}>
            <Plus className="w-4 h-4" />
            Follow
          </Button>
        </form>

        {/* Artist list */}
        {followedArtists.length === 0 ? (
          <p className="text-white/30 text-sm italic">You&apos;re not following any artists yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {followedArtists.map(artist => (
              <div
                key={artist}
                className="flex items-center gap-2 bg-surface-800 border border-white/10 rounded-full px-3 py-1.5"
              >
                <span className="text-sm text-white">{artist}</span>
                <button
                  onClick={() => removeArtist(artist)}
                  className="text-white/40 hover:text-red-400 transition-colors"
                  aria-label={`Unfollow ${artist}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── Newsletter ──────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-bold text-white mb-1">Weekly Newsletter</h2>
        <p className="text-white/50 text-sm mb-6">
          Get a weekly digest of upcoming shows at your followed venues.
        </p>

        <div className="bg-surface-800 border border-white/10 rounded-xl p-6 space-y-5">
          {/* Enable toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Enable weekly newsletter</p>
              <p className="text-white/40 text-sm mt-0.5">Receive a weekly email with upcoming shows</p>
            </div>
            <button
              onClick={() => setNewsletterEnabled(!newsletterEnabled)}
              className={`
                relative w-12 h-6 rounded-full transition-colors
                ${newsletterEnabled ? 'bg-brand-500' : 'bg-white/20'}
              `}
              aria-label="Toggle newsletter"
            >
              <span className={`
                absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                ${newsletterEnabled ? 'translate-x-7' : 'translate-x-1'}
              `} />
            </button>
          </div>

          {/* Day select */}
          {newsletterEnabled && (
            <div className="flex items-center gap-4">
              <label className="text-sm text-white/70 shrink-0">Send on</label>
              <select
                value={newsletterDay}
                onChange={e => setNewsletterDay(e.target.value)}
                className="bg-surface-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {days.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
          )}

          {/* Coming soon notice */}
          <div className="flex items-start gap-3 bg-brand-500/10 border border-brand-500/20 rounded-lg p-3">
            {newsletterEnabled ? (
              <Bell className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
            ) : (
              <BellOff className="w-4 h-4 text-white/40 shrink-0 mt-0.5" />
            )}
            <p className="text-sm text-white/60">
              <strong className="text-brand-500">Coming soon:</strong> Newsletter delivery is being set up.
              Save your preferences now and you&apos;ll be included in the first send!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={saveNewsletterPrefs} disabled={saving}>
              {saving ? 'Saving...' : 'Save preferences'}
            </Button>
            {saveMessage && (
              <span className={`text-sm ${saveMessage.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>
                {saveMessage}
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
