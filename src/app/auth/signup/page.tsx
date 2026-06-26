'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Mail, Lock, User, Building2, Loader2, CheckCircle2 } from 'lucide-react'

type Role = 'user' | 'owner'

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<Role>('user')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [requiresConfirmation, setRequiresConfirmation] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 1) { setStep(2); return }

    setLoading(true)
    setError('')

    const { error, profile: newProfile } = await signUp(email, password, fullName, role)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    if (!newProfile) {
      setRequiresConfirmation(true)
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } else {
      setTimeout(() => {
        if (role === 'owner') router.push('/owner')
        else router.push('/dashboard')
      }, 2000)
    }
  }

  const roles = [
    {
      id: 'user' as Role,
      icon: User,
      title: 'I am a Player',
      description: 'Browse and book sports turfs near you.',
    },
    {
      id: 'owner' as Role,
      icon: Building2,
      title: 'I own a Turf',
      description: 'List your turf and start earning today.',
    },
  ]

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-2xl">⚽</span>
            </div>
            <span className="text-2xl font-bold gradient-text">TurfX Ultra</span>
          </Link>
          <p className="text-muted-foreground mt-2">Create your account to get started.</p>
        </div>

        <div className="glass-dark rounded-2xl p-8 shadow-2xl border border-white/10">
          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-6">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step >= s ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-muted-foreground'
                }`}>
                  {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                <div className={`text-xs font-medium ${step >= s ? 'text-primary' : 'text-muted-foreground'}`}>
                  {s === 1 ? 'Choose Role' : 'Your Details'}
                </div>
                {s < 2 && <div className={`flex-1 h-px ${step > 1 ? 'bg-primary' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Account Created!
                </h3>
                <p className="text-muted-foreground mt-2">
                  {requiresConfirmation
                    ? 'Redirecting you to Sign In...'
                    : 'Redirecting you to your dashboard...'}
                </p>
              </motion.div>
            ) : step === 1 ? (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="text-2xl font-bold text-foreground mb-2">How will you use TurfX Ultra?</h1>
                <p className="text-muted-foreground text-sm mb-6">Choose your account type to get started.</p>
                <div className="space-y-3 mb-6">
                  {roles.map((r) => (
                    <motion.button
                      key={r.id}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setRole(r.id)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                        role === r.id
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-white/10 bg-white/5 text-muted-foreground hover:border-white/20'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        role === r.id ? 'bg-primary text-primary-foreground' : 'bg-white/10'
                      }`}>
                        <r.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{r.title}</p>
                        <p className="text-xs text-muted-foreground">{r.description}</p>
                      </div>
                      {role === r.id && <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />}
                    </motion.button>
                  ))}
                </div>
                <Button onClick={() => setStep(2)} className="w-full h-11 bg-primary hover:bg-primary/90 font-semibold">
                  Continue
                </Button>
              </motion.div>
            ) : (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <h1 className="text-2xl font-bold text-foreground mb-1">Your Details</h1>
                <p className="text-muted-foreground text-sm mb-4">Fill in your information to create your account.</p>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="fullName" type="text" placeholder="John Doe" value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 focus:border-primary" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="you@example.com" value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 focus:border-primary" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters"
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-white/5 border-white/10 focus:border-primary" required minLength={8} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                    {error}
                  </motion.p>
                )}

                <div className="flex gap-3 pt-1">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}
                    className="flex-1 h-11 border-white/10 hover:bg-white/5">
                    Back
                  </Button>
                  <Button type="submit" className="flex-1 h-11 bg-primary hover:bg-primary/90 font-semibold" disabled={loading}>
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : 'Create Account'}
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {!success && (
            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
