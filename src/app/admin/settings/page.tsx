'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Percent, ShieldCheck, Mail, ShieldAlert, Loader2 } from 'lucide-react'

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [globalRate, setGlobalRate] = useState('10')
  const [adminContact, setAdminContact] = useState('support@turfx.com')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const { data, error } = await (supabase.from('system_settings') as any)
        .select('*')
        .eq('id', 1)
        .single()

      if (error) {
        console.error('Error fetching settings:', error.message)
      } else if (data) {
        setGlobalRate(data.default_commission_rate?.toString() || '10')
      }
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      // Update global commission rate
      const { error } = await (supabase.from('system_settings') as any)
        .update({ default_commission_rate: parseFloat(globalRate) })
        .eq('id', 1)

      if (error) {
        setErrorMsg(error.message)
      } else {
        setSuccessMsg('Settings updated successfully.')
        fetchSettings()
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-foreground">System Settings</h1>
        <p className="text-muted-foreground mt-1">Configure global variables, defaults, and platform rules.</p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2.5 text-sm text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 px-4 py-3 rounded-xl">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2.5 text-sm text-red-400 bg-red-950/40 border border-red-900/30 px-4 py-3 rounded-xl">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="shimmer h-48 max-w-xl rounded-xl" />
          <div className="shimmer h-48 max-w-xl rounded-xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <form onSubmit={handleSave}>
              <Card className="glass-dark border-white/10 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 font-bold text-foreground">
                    <Settings className="w-5 h-5 text-primary" /> Core Configuration
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-xs">
                    Define default financial variables and rates.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="commission-rate" className="text-slate-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5" /> Default Commission Rate
                    </Label>
                    <div className="relative">
                      <Input
                        id="commission-rate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={globalRate}
                        onChange={(e) => setGlobalRate(e.target.value)}
                        className="bg-white/5 border-white/10 rounded-xl pr-8 text-white h-11"
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">%</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      This percentage is calculated from the booking subtotal as the platform fee.
                    </p>
                  </div>

                  <div className="space-y-2 border-t border-white/5 pt-4">
                    <Label htmlFor="admin-support" className="text-slate-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> Platform Support Email
                    </Label>
                    <Input
                      id="admin-support"
                      type="email"
                      value={adminContact}
                      onChange={(e) => setAdminContact(e.target.value)}
                      className="bg-white/5 border-white/10 rounded-xl text-white h-11"
                      required
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Publicly displayed email for payment disputes or business listings.
                    </p>
                  </div>

                  <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 font-bold rounded-xl mt-2 w-full sm:w-auto px-6">
                    {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Configuration'}
                  </Button>
                </CardContent>
              </Card>
            </form>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="glass-dark border-white/10 shadow-xl">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 font-bold text-foreground">
                  <ShieldAlert className="w-5 h-5 text-yellow-400" /> Platform Integrity Info
                </CardTitle>
                <CardDescription className="text-muted-foreground text-xs">
                  Overview of database connections and API security models.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  Platform system settings are persisted in the <code className="text-white bg-white/5 px-1.5 py-0.5 rounded">public.system_settings</code> table.
                </p>
                <p>
                  Changes take effect immediately across all booking workflows. When overrides do not exist on individual turfs, the default commission percentage is charged automatically.
                </p>
                <p className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 p-3 rounded-xl text-xs flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Database Lock:</strong> Row ID #1 holds the system-wide settings row. Do not manually remove this database record to prevent system calculation failures.
                  </span>
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  )
}
