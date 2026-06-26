'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Upload, MapPin, DollarSign, FileText, Building2 } from 'lucide-react'

export default function AddTurfPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([''])
  const [form, setForm] = useState({
    name: '', description: '', city: '', address: '',
    price_per_hour: '', sport_type: ''
  })

  const handleChange = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError('')

    const validImages = imageUrls.filter(u => u.trim() !== '')
    const { error } = await (supabase.from('turfs') as any).insert({
      owner_id: user.id,
      name: form.name,
      description: form.description,
      location: { city: form.city, address: form.address, sport_type: form.sport_type },
      price_per_hour: parseFloat(form.price_per_hour),
      images: validImages,
      is_verified: false,
    })

    if (error) { setError(error.message); setLoading(false); return }
    router.push('/owner/turfs')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-foreground">Add New Turf</h1>
        <p className="text-muted-foreground mt-1">Fill in the details below to list your turf on TurfX Ultra.</p>
      </div>

      <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card className="glass-dark border-white/10">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Turf Name *</Label>
              <Input id="name" value={form.name} onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g. Green Arena Football Turf" className="bg-white/5 border-white/10" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea id="description" value={form.description} onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe your turf, facilities, amenities..."
                className="w-full min-h-[100px] bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sport_type">Sport Type</Label>
              <Select onValueChange={(v: string | null) => handleChange('sport_type', v || '')}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select sport type" />
                </SelectTrigger>
                <SelectContent className="glass-dark border-white/10">
                  {['Football', 'Cricket', 'Badminton', 'Basketball', 'Tennis', 'Multi-sport'].map(s => (
                    <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="glass-dark border-white/10">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Location</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input id="city" value={form.city} onChange={(e) => handleChange('city', e.target.value)}
                placeholder="e.g. Mumbai" className="bg-white/5 border-white/10" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Full Address</Label>
              <Input id="address" value={form.address} onChange={(e) => handleChange('address', e.target.value)}
                placeholder="e.g. 123 Sports Colony, Andheri West" className="bg-white/5 border-white/10" />
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card className="glass-dark border-white/10">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" /> Pricing</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="price">Price Per Hour (₹) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                <Input id="price" type="number" value={form.price_per_hour} onChange={(e) => handleChange('price_per_hour', e.target.value)}
                  placeholder="500" className="pl-8 bg-white/5 border-white/10" required min="1" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card className="glass-dark border-white/10">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Upload className="w-4 h-4 text-primary" /> Images (URLs)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">Add image URLs for your turf. (Supabase Storage upload can be added later.)</p>
            {imageUrls.map((url, i) => (
              <div key={i} className="flex gap-2">
                <Input value={url} onChange={(e) => {
                  const updated = [...imageUrls]; updated[i] = e.target.value; setImageUrls(updated)
                }} placeholder={`Image URL ${i + 1}`} className="bg-white/5 border-white/10 flex-1" />
                {i > 0 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setImageUrls(imageUrls.filter((_, j) => j !== i))}
                    className="text-destructive hover:bg-destructive/10">✕</Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setImageUrls([...imageUrls, ''])}
              className="border-white/10 text-muted-foreground hover:text-foreground">
              + Add Another Image
            </Button>
          </CardContent>
        </Card>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-xl">
            {error}
          </motion.p>
        )}

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1 border-white/10 hover:bg-white/5">
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="flex-1 bg-primary hover:bg-primary/90 font-bold h-11">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Listing Turf...</> : 'List My Turf'}
          </Button>
        </div>
      </motion.form>
    </div>
  )
}
