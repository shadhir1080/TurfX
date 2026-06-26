'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Lock, Mail, Loader2, ShieldCheck, AlertCircle } from 'lucide-react'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signIn, signOut } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error: signInError, profile: loggedInProfile } = await signIn(email, password)

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      if (loggedInProfile && loggedInProfile.is_active === false) {
        setError('This administrator account has been deactivated. Please contact master support.')
        await signOut()
        setLoading(false)
        return
      }

      const role = loggedInProfile?.role
      if (role !== 'admin') {
        setError('Access Denied: This account is not registered as a Master Admin.')
        // Perform clean logout so they don't remain logged in with an unauthorized state
        await signOut()
        setLoading(false)
        return
      }

      // Success - redirect to Master Admin console
      router.push('/admin')
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Neon Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px]" />
      </div>

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-60" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Portal Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="w-6 h-6 text-foreground" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              TurfX <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">Ultra</span>
            </span>
          </Link>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-purple-400 uppercase tracking-widest font-black">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            Master Admin Console
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative">
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          <h1 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            Administrator Sign In
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                Admin Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@turfx.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-slate-950/50 border-white/10 text-white placeholder-slate-600 focus:border-primary focus:ring-1 focus:ring-primary h-11 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                  Password
                </Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-slate-950/50 border-white/10 text-white placeholder-slate-600 focus:border-primary focus:ring-1 focus:ring-primary h-11 rounded-xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-start gap-2.5 text-sm text-red-400 bg-red-950/40 border border-red-900/30 px-3.5 py-3 rounded-xl"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white font-bold h-11 rounded-xl shadow-lg shadow-primary/10 mt-2 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="w-4.5 h-4.5 animate-spin" /> Authenticating...</>
              ) : (
                'Secure Login'
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
