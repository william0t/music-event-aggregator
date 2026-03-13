'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import type { User } from '@supabase/supabase-js'

interface AuthButtonProps {
  user: User | null
}

export default function AuthButton({ user }: AuthButtonProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.refresh()
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <a href="/account" className="text-sm text-white/70 hover:text-white transition-colors">
          {user.email?.split('@')[0]}
        </a>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    )
  }

  return (
    <a href="/auth/login">
      <Button variant="primary" size="sm">
        Sign in
      </Button>
    </a>
  )
}
