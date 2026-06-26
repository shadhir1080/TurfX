'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { User, Mail, Shield, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export default function PlayerProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
    }
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { error: updateError } = await (supabase.from('profiles') as any)
        .update({ full_name: fullName })
        .eq('id', user.id)

      if (updateError) throw updateError

      await refreshProfile()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-foreground">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your identity and account details on TurfX Ultra.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="glass-dark border-white/10">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-primary">
              <User className="w-4 h-4" /> Personal Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email (Read-Only) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  className="bg-white/5 border-white/10 text-muted-foreground cursor-not-allowed"
                  disabled
                />
                <p className="text-[10px] text-muted-foreground">Your account email is verified and cannot be changed.</p>
              </div>

              {/* Role (Read-Only) */}
              <div className="space-y-2">
                <Label className="text-muted-foreground flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Platform Role
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={profile?.role === 'user' ? 'Player / Sports Enthusiast' : profile?.role || 'User'}
                    className="bg-white/5 border-white/10 text-muted-foreground cursor-not-allowed capitalize"
                    disabled
                  />
                  <Badge className="bg-primary/20 text-primary border-primary/20 capitalize font-semibold">
                    {profile?.role || 'user'}
                  </Badge>
                </div>
              </div>

              {/* Full Name (Editable) */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-muted-foreground">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-white/5 border-white/10 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 font-bold h-11 transition-all"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving Changes...</>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
