'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Search, DollarSign, BadgeCheck, Percent } from 'lucide-react'

export default function AdminCommissionsPage() {
  const [settings, setSettings] = useState<any>(null)
  const [turfs, setTurfs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editRate, setEditRate] = useState('')
  const [globalRate, setGlobalRate] = useState('')
  const [selectedTurf, setSelectedTurf] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [settingsRes, turfsRes] = await Promise.all([
      (supabase.from('system_settings') as any).select('*').single(),
      supabase.from('turfs').select('*, owner:profiles(full_name)').order('created_at', { ascending: false })
    ])
    const settingsData = settingsRes.data
    setSettings(settingsData)
    setGlobalRate(settingsData?.default_commission_rate?.toString() || '10')
    setTurfs(turfsRes.data || [])
    setLoading(false)
  }

  const saveGlobalRate = async () => {
    setSaving(true)
    await (supabase.from('system_settings') as any).update({ default_commission_rate: parseFloat(globalRate) }).eq('id', 1)
    setSaving(false)
    fetchData()
  }

  const saveTurfRate = async () => {
    if (!selectedTurf) return
    setSaving(true)
    const rate = editRate === '' ? null : parseFloat(editRate)
    await (supabase.from('turfs') as any).update({ custom_commission_rate: rate }).eq('id', selectedTurf.id)
    setSaving(false)
    setSelectedTurf(null)
    fetchData()
  }

  const filtered = turfs.filter(t =>
    !search || t.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-foreground">Commission Settings</h1>
        <p className="text-muted-foreground mt-1">Set global or per-turf commission rates.</p>
      </div>

      {/* Global Rate Card */}
      <Card className="glass-dark border-white/10 max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Percent className="w-4 h-4 text-primary" /> Default Commission Rate
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">This rate applies to all turfs unless overridden individually.</p>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Input type="number" value={globalRate} onChange={(e) => setGlobalRate(e.target.value)}
                className="pr-8 bg-white/5 border-white/10" min="0" max="100" step="0.5" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
            </div>
            <Button onClick={saveGlobalRate} disabled={saving} className="bg-primary hover:bg-primary/90">
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
          {settings && (
            <p className="text-xs text-muted-foreground">Current: <span className="text-primary font-semibold">{settings.default_commission_rate}%</span></p>
          )}
        </CardContent>
      </Card>

      {/* Per-turf overrides */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search turfs..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white/5 border-white/10" />
      </div>

      <Card className="glass-dark border-white/10">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" /> Per-Turf Commission Override
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {['Turf', 'Owner', 'Custom Rate', 'Effective Rate', 'Action'].map(h => (
                    <th key={h} className="text-left py-3 px-2 text-xs text-muted-foreground font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}><td colSpan={5} className="py-2 px-2"><div className="shimmer h-10 rounded" /></td></tr>
                  ))
                ) : filtered.map((turf, i) => (
                  <motion.tr key={turf.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="py-3 px-2 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        {turf.is_verified && <BadgeCheck className="w-4 h-4 text-primary" />}
                        {turf.name}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-muted-foreground">{turf.owner?.full_name || '—'}</td>
                    <td className="py-3 px-2">
                      {turf.custom_commission_rate != null ? (
                        <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/20">
                          {turf.custom_commission_rate}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-primary font-semibold">
                      {turf.custom_commission_rate ?? settings?.default_commission_rate ?? 10}%
                    </td>
                    <td className="py-3 px-2">
                      <Button size="sm" variant="ghost" onClick={() => { setSelectedTurf(turf); setEditRate(turf.custom_commission_rate?.toString() || '') }}
                        className="text-xs h-7 text-primary hover:text-primary/80 hover:bg-primary/10">
                        Edit Rate
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!selectedTurf} onOpenChange={() => setSelectedTurf(null)}>
        <DialogContent className="glass-dark border-white/10 max-w-sm">
          <DialogHeader>
            <DialogTitle>Override Commission Rate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">Setting a custom rate for <span className="text-foreground font-medium">{selectedTurf?.name}</span>. Leave empty to use the global default.</p>
            <div className="space-y-2">
              <Label>Custom Rate (%)</Label>
              <div className="relative">
                <Input type="number" value={editRate} onChange={(e) => setEditRate(e.target.value)}
                  placeholder={`Default: ${settings?.default_commission_rate}%`}
                  className="pr-8 bg-white/5 border-white/10" min="0" max="100" step="0.5" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setSelectedTurf(null)} className="flex-1 border-white/10">Cancel</Button>
              <Button onClick={saveTurfRate} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90">
                {saving ? 'Saving...' : 'Save Rate'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
