'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string, role: 'user' | 'owner') => Promise<{ error: any; profile: Profile | null }>
  signIn: (email: string, password: string) => Promise<{ error: any; profile: Profile | null }>
  signOut: (redirectPath?: string) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const syncSessionCookie = (token: string | null) => {
  if (token) {
    document.cookie = `sb-access-token=${token}; path=/; max-age=86400; SameSite=Lax`
  } else {
    document.cookie = `sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        syncSessionCookie(session.access_token)
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    }).catch(() => {
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        syncSessionCookie(session.access_token)
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
        syncSessionCookie(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      const prof = data as Profile | null
      if (prof) {
        if (prof.is_active === false) {
          setProfile(null)
          setLoading(false)
          await signOut('/auth/login?error=deactivated')
          return
        }
        setProfile(prof)
      }
    } catch {
      // ignore – profile may not exist yet
    }
    setLoading(false)
  }

  const signUp = async (email: string, password: string, fullName: string, role: 'user' | 'owner') => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role } }
      })

      if (error) return { error, profile: null }

      // If email confirmation disabled, session is returned immediately
      if (data.user && data.session) {
        syncSessionCookie(data.session.access_token)
        // Wait briefly for trigger to create the profile row
        await new Promise(r => setTimeout(r, 800))
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
        setProfile(prof)
        return { error: null, profile: prof }
      }

      // Email confirmation required – no session yet, but no error either
      return { error: null, profile: null }
    } catch (e: any) {
      return { error: e, profile: null }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) return { error, profile: null }

      if (data.user && data.session) {
        syncSessionCookie(data.session.access_token)
        // Fetch profile from DB
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
        setUser(data.user)
        setSession(data.session)
        setProfile(prof)
        return { error: null, profile: prof }
      }

      return { error: null, profile: null }
    } catch (e: any) {
      return { error: e, profile: null }
    }
  }

  const signOut = async (redirectPath: string = '/') => {
    syncSessionCookie(null)
    setUser(null)
    setProfile(null)
    setSession(null)
    try {
      await supabase.auth.signOut()
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      try {
        // Manually delete any local storage keys related to supabase auth
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i)
          if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
            localStorage.removeItem(key)
          }
        }
        // Clear all cookies
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        sessionStorage.clear()
      } catch (e) {
        console.error('Error clearing storage:', e)
      }
      window.location.href = redirectPath
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
