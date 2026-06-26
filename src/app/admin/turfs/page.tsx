'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, ShieldCheck, Plus, Edit2, Trash2, ShieldX, BadgeCheck, CheckCircle2,
  MapPin, Clock, DollarSign, Loader2, AlertTriangle, Building2, Eye, Award
} from 'lucide-react'

export default function AdminTurfsPage() {
  const [turfs, setTurfs] = useState<any[]>([])
  const [owners, setOwners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Dialogs
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  // Form States
  const [selectedTurf, setSelectedTurf] = useState<any>(null)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formOwnerId, setFormOwnerId] = useState('')
  const [formPricePerHour, setFormPricePerHour] = useState('')
  const [formTimings, setFormTimings] = useState('6 AM - 11 PM')
  const [formSports, setFormSports] = useState('Football')
  const [formAmenities, setFormAmenities] = useState('Floodlights, Parking, Changing Room')
  const [formCity, setFormCity] = useState('Coimbatore')
  const [formAddress, setFormAddress] = useState('')
  const [formArea, setFormArea] = useState('')
  const [formLat, setFormLat] = useState('11.0168')
  const [formLng, setFormLng] = useState('76.9558')
  const [formIsVerified, setFormIsVerified] = useState(false)
  const [formIsPremium, setFormIsPremium] = useState(false)
  const [formIs24Hours, setFormIs24Hours] = useState(false)
  const [formIsActive, setFormIsActive] = useState(true)
  const [formImageUrl, setFormImageUrl] = useState('')

  useEffect(() => {
    fetchTurfs()
    fetchOwners()
  }, [])

  const fetchTurfs = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/admin/turfs')
      const result = await res.json()
      if (result.success) {
        setTurfs(result.data || [])
      } else {
        setErrorMsg(result.error || 'Failed to load turfs')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred fetching turfs')
    } finally {
      setLoading(false)
    }
  }

  const fetchOwners = async () => {
    try {
      const res = await fetch('/api/admin/users')
      const result = await res.json()
      if (result.success) {
        const allProfiles = result.data || []
        setOwners(allProfiles.filter((p: any) => p.role === 'owner'))
      }
    } catch (err) {
      console.error('Error fetching owners list:', err)
    }
  }

  const handleAddTurf = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)
    setErrorMsg('')
    try {
      const sportsArray = formSports.split(',').map(s => s.trim()).filter(Boolean)
      const amenitiesArray = formAmenities.split(',').map(a => a.trim()).filter(Boolean)
      const imagesArray = formImageUrl 
        ? [formImageUrl.trim()] 
        : ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80']

      const res = await fetch('/api/admin/turfs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          ownerId: formOwnerId || null,
          pricePerHour: parseFloat(formPricePerHour),
          sports: sportsArray,
          timings: formTimings,
          amenities: amenitiesArray,
          images: imagesArray,
          isVerified: formIsVerified,
          isPremium: formIsPremium,
          is24Hours: formIs24Hours,
          location: { city: formCity, address: formAddress, area: formArea },
          coordinates: { lat: parseFloat(formLat), lng: parseFloat(formLng) }
        })
      })
      const result = await res.json()
      if (result.success) {
        setAddOpen(false)
        resetForm()
        fetchTurfs()
      } else {
        setErrorMsg(result.error || 'Failed to add turf')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred adding turf')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditTurf = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTurf) return
    setActionLoading(true)
    setErrorMsg('')
    try {
      const sportsArray = formSports.split(',').map(s => s.trim()).filter(Boolean)
      const amenitiesArray = formAmenities.split(',').map(a => a.trim()).filter(Boolean)
      const imagesArray = formImageUrl 
        ? [formImageUrl.trim()] 
        : (selectedTurf.images || ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80'])

      const res = await fetch('/api/admin/turfs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTurf.id,
          name: formName,
          description: formDescription,
          ownerId: formOwnerId || null,
          pricePerHour: parseFloat(formPricePerHour),
          sports: sportsArray,
          timings: formTimings,
          amenities: amenitiesArray,
          images: imagesArray,
          isVerified: formIsVerified,
          isPremium: formIsPremium,
          is24Hours: formIs24Hours,
          isActive: formIsActive,
          location: { city: formCity, address: formAddress, area: formArea },
          coordinates: { lat: parseFloat(formLat), lng: parseFloat(formLng) }
        })
      })
      const result = await res.json()
      if (result.success) {
        setEditOpen(false)
        setSelectedTurf(null)
        resetForm()
        fetchTurfs()
      } else {
        setErrorMsg(result.error || 'Failed to update turf')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred updating turf')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteTurf = async () => {
    if (!selectedTurf) return
    setActionLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch(`/api/admin/turfs?id=${selectedTurf.id}`, {
        method: 'DELETE'
      })
      const result = await res.json()
      if (result.success) {
        setDeleteOpen(false)
        setSelectedTurf(null)
        fetchTurfs()
      } else {
        setErrorMsg(result.error || 'Failed to delete turf')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred deleting turf')
    } finally {
      setActionLoading(false)
    }
  }

  const toggleTurfVerification = async (turf: any) => {
    try {
      const res = await fetch('/api/admin/turfs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...turf,
          isVerified: !turf.is_verified,
          isActive: turf.is_active,
          pricePerHour: turf.price_per_hour,
          ownerId: turf.owner_id
        })
      })
      const result = await res.json()
      if (result.success) {
        fetchTurfs()
      } else {
        alert(result.error || 'Failed to update verification status')
      }
    } catch (err: any) {
      alert('An error occurred: ' + err.message)
    }
  }

  const toggleTurfActive = async (turf: any) => {
    try {
      const res = await fetch('/api/admin/turfs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...turf,
          isVerified: turf.is_verified,
          isActive: !turf.is_active,
          pricePerHour: turf.price_per_hour,
          ownerId: turf.owner_id
        })
      })
      const result = await res.json()
      if (result.success) {
        fetchTurfs()
      } else {
        alert(result.error || 'Failed to update active status')
      }
    } catch (err: any) {
      alert('An error occurred: ' + err.message)
    }
  }

  const resetForm = () => {
    setFormName('')
    setFormDescription('')
    setFormOwnerId('')
    setFormPricePerHour('')
    setFormTimings('6 AM - 11 PM')
    setFormSports('Football')
    setFormAmenities('Floodlights, Parking, Changing Room')
    setFormCity('Coimbatore')
    setFormAddress('')
    setFormArea('')
    setFormLat('11.0168')
    setFormLng('76.9558')
    setFormIsVerified(false)
    setFormIsPremium(false)
    setFormIs24Hours(false)
    setFormIsActive(true)
    setFormImageUrl('')
  }

  const openEdit = (turf: any) => {
    setSelectedTurf(turf)
    setFormName(turf.name || '')
    setFormDescription(turf.description || '')
    setFormOwnerId(turf.owner_id || '')
    setFormPricePerHour(turf.price_per_hour?.toString() || '')
    setFormTimings(turf.timings || '6 AM - 11 PM')
    setFormSports(Array.isArray(turf.sports) ? turf.sports.join(', ') : 'Football')
    setFormAmenities(Array.isArray(turf.amenities) ? turf.amenities.join(', ') : '')
    setFormCity(turf.location?.city || 'Coimbatore')
    setFormAddress(turf.location?.address || '')
    setFormArea(turf.location?.area || '')
    setFormLat(turf.coordinates?.lat?.toString() || '11.0168')
    setFormLng(turf.coordinates?.lng?.toString() || '76.9558')
    setFormIsVerified(turf.is_verified === true)
    setFormIsPremium(turf.is_premium === true)
    setFormIs24Hours(turf.is_24hours === true)
    setFormIsActive(turf.is_active !== false)
    setFormImageUrl(Array.isArray(turf.images) && turf.images.length > 0 ? turf.images[0] : '')
    setEditOpen(true)
  }

  const openDelete = (turf: any) => {
    setSelectedTurf(turf)
    setDeleteOpen(true)
  }

  const filtered = turfs.filter(t =>
    !search || 
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.owner_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Sports Turfs</h1>
          <p className="text-muted-foreground mt-1">Add, verify, update, and manage all listed sports venues across the platform.</p>
        </div>
        <Button onClick={() => { resetForm(); setAddOpen(true) }} className="bg-primary hover:bg-primary/90 rounded-xl gap-2 font-bold shrink-0 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Add New Turf
        </Button>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2.5 text-sm text-red-400 bg-red-950/40 border border-red-900/30 px-4 py-3 rounded-xl">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search turf name or owner..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white/5 border-white/10 rounded-xl h-11" />
      </div>

      <Card className="glass-dark border-white/10 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 font-bold text-foreground">
            <Award className="w-5 h-5 text-primary" /> Listed Turfs ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="shimmer h-14 rounded-xl" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-muted-foreground">
                    {['Venue Details', 'Owner', 'Price/Hour', 'Verification', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left py-3.5 px-2 text-xs font-bold uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((turf, i) => (
                    <motion.tr key={turf.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-10 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                            {turf.images && turf.images.length > 0 ? (
                              <img src={turf.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-lg">🏟️</span>
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-foreground block">{turf.name}</span>
                            <span className="text-[10px] text-muted-foreground block flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-primary shrink-0" />
                              {turf.location?.area || turf.location?.city || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" />
                          {turf.owner_name || 'System Admin / Platform'}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-black text-white">₹{parseFloat(turf.price_per_hour).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-2">
                        <Button size="sm" variant="ghost" onClick={() => toggleTurfVerification(turf)}
                          className={`text-xs h-7 px-2 rounded-lg ${
                            turf.is_verified 
                              ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10' 
                              : 'text-muted-foreground hover:text-foreground hover:bg-white/10'
                          }`}>
                          {turf.is_verified ? (
                            <><BadgeCheck className="w-3.5 h-3.5 mr-1" /> Verified</>
                          ) : (
                            <><ShieldX className="w-3.5 h-3.5 mr-1" /> Unverified</>
                          )}
                        </Button>
                      </td>
                      <td className="py-3 px-2">
                        {turf.is_active !== false ? (
                          <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider bg-red-500/10 text-red-400 border-red-500/20">Inactive</Badge>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(turf)}
                            className="text-xs h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg">
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>

                          <Button size="sm" variant="ghost" onClick={() => toggleTurfActive(turf)}
                            className={`text-xs h-8 px-2 rounded-lg ${
                              turf.is_active !== false 
                                ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10' 
                                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                            }`}>
                            {turf.is_active !== false ? 'Deactivate' : 'Activate'}
                          </Button>

                          <Button size="sm" variant="ghost" onClick={() => openDelete(turf)}
                            className="text-xs h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">No turfs found.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="glass-dark border-white/10 max-w-lg text-foreground max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Plus className="w-5 h-5 text-primary" /> Add New Sports Turf
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTurf} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Turf Name</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)}
                  placeholder="Kickoff Arena" className="bg-white/5 border-white/10 rounded-xl" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Price Per Hour (₹)</Label>
                <Input type="number" value={formPricePerHour} onChange={(e) => setFormPricePerHour(e.target.value)}
                  placeholder="1200" className="bg-white/5 border-white/10 rounded-xl" required />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Details about the artificial grass, dimensions..."
                className="w-full min-h-[70px] p-2 bg-white/5 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Owner (Partner Account)</Label>
                <Select value={formOwnerId} onValueChange={(val) => setFormOwnerId(val || '')}>
                  <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
                    <SelectValue placeholder="Select Owner" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white rounded-xl">
                    <SelectItem value="">System / Platform Admin</SelectItem>
                    {owners.map(o => (
                      <SelectItem key={o.id} value={o.id}>{o.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Timings</Label>
                <Input value={formTimings} onChange={(e) => setFormTimings(e.target.value)}
                  placeholder="5 AM - 11 PM or 24 Hours" className="bg-white/5 border-white/10 rounded-xl" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Sports Available (comma-separated)</Label>
                <Input value={formSports} onChange={(e) => setFormSports(e.target.value)}
                  placeholder="Football, Cricket" className="bg-white/5 border-white/10 rounded-xl" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Amenities (comma-separated)</Label>
                <Input value={formAmenities} onChange={(e) => setFormAmenities(e.target.value)}
                  placeholder="Floodlights, Parking" className="bg-white/5 border-white/10 rounded-xl" required />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Area / Neighborhood</Label>
                <Input value={formArea} onChange={(e) => setFormArea(e.target.value)}
                  placeholder="Kuniyamuthur" className="bg-white/5 border-white/10 rounded-xl" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">City</Label>
                <Input value={formCity} onChange={(e) => setFormCity(e.target.value)}
                  placeholder="Coimbatore" className="bg-white/5 border-white/10 rounded-xl" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Full Address</Label>
                <Input value={formAddress} onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Main Road address..." className="bg-white/5 border-white/10 rounded-xl" required />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Latitude</Label>
                <Input value={formLat} onChange={(e) => setFormLat(e.target.value)}
                  placeholder="11.0168" className="bg-white/5 border-white/10 rounded-xl" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Longitude</Label>
                <Input value={formLng} onChange={(e) => setFormLng(e.target.value)}
                  placeholder="76.9558" className="bg-white/5 border-white/10 rounded-xl" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Image URL</Label>
                <Input value={formImageUrl} onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="Unsplash / Web link" className="bg-white/5 border-white/10 rounded-xl" />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="add-verified" checked={formIsVerified} onChange={(e) => setFormIsVerified(e.target.checked)} className="rounded accent-primary" />
                <Label htmlFor="add-verified" className="cursor-pointer text-xs">Verify Turf</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="add-premium" checked={formIsPremium} onChange={(e) => setFormIsPremium(e.target.checked)} className="rounded accent-primary" />
                <Label htmlFor="add-premium" className="cursor-pointer text-xs">Premium Badge</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="add-24hours" checked={formIs24Hours} onChange={(e) => setFormIs24Hours(e.target.checked)} className="rounded accent-primary" />
                <Label htmlFor="add-24hours" className="cursor-pointer text-xs">24 Hours Open</Label>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-white/10">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} className="flex-1 border-white/10 rounded-xl">Cancel</Button>
              <Button type="submit" disabled={actionLoading} className="flex-1 bg-primary hover:bg-primary/90 font-bold rounded-xl">
                {actionLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</> : 'Add Turf'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="glass-dark border-white/10 max-w-lg text-foreground max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Edit2 className="w-5 h-5 text-primary" /> Edit Sports Turf
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditTurf} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Turf Name</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Price Per Hour (₹)</Label>
                <Input type="number" value={formPricePerHour} onChange={(e) => setFormPricePerHour(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl" required />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)}
                className="w-full min-h-[70px] p-2 bg-white/5 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Owner (Partner Account)</Label>
                <Select value={formOwnerId} onValueChange={(val) => setFormOwnerId(val || '')}>
                  <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
                    <SelectValue placeholder="Select Owner" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white rounded-xl">
                    <SelectItem value="">System / Platform Admin</SelectItem>
                    {owners.map(o => (
                      <SelectItem key={o.id} value={o.id}>{o.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Timings</Label>
                <Input value={formTimings} onChange={(e) => setFormTimings(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Sports Available (comma-separated)</Label>
                <Input value={formSports} onChange={(e) => setFormSports(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Amenities (comma-separated)</Label>
                <Input value={formAmenities} onChange={(e) => setFormAmenities(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl" required />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Area / Neighborhood</Label>
                <Input value={formArea} onChange={(e) => setFormArea(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">City</Label>
                <Input value={formCity} onChange={(e) => setFormCity(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Full Address</Label>
                <Input value={formAddress} onChange={(e) => setFormAddress(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl" required />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Latitude</Label>
                <Input value={formLat} onChange={(e) => setFormLat(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Longitude</Label>
                <Input value={formLng} onChange={(e) => setFormLng(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Image URL Override</Label>
                <Input value={formImageUrl} onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="Keep blank to use current" className="bg-white/5 border-white/10 rounded-xl" />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="edit-verified" checked={formIsVerified} onChange={(e) => setFormIsVerified(e.target.checked)} className="rounded accent-primary" />
                <Label htmlFor="edit-verified" className="cursor-pointer text-xs">Verify Turf</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="edit-premium" checked={formIsPremium} onChange={(e) => setFormIsPremium(e.target.checked)} className="rounded accent-primary" />
                <Label htmlFor="edit-premium" className="cursor-pointer text-xs">Premium Badge</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="edit-24hours" checked={formIs24Hours} onChange={(e) => setFormIs24Hours(e.target.checked)} className="rounded accent-primary" />
                <Label htmlFor="edit-24hours" className="cursor-pointer text-xs">24 Hours Open</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="edit-active" checked={formIsActive} onChange={(e) => setFormIsActive(e.target.checked)} className="rounded accent-primary" />
                <Label htmlFor="edit-active" className="cursor-pointer text-xs text-yellow-400 font-semibold">Active Listing</Label>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-white/10">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="flex-1 border-white/10 rounded-xl">Cancel</Button>
              <Button type="submit" disabled={actionLoading} className="flex-1 bg-primary hover:bg-primary/90 font-bold rounded-xl">
                {actionLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="glass-dark border-white/10 max-w-sm text-foreground rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-destructive">
              <Trash2 className="w-5 h-5" /> Delete Sports Turf
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to delete turf <span className="text-white font-semibold">{selectedTurf?.name}</span>? 
              <br /><br />
              <strong className="text-red-400">WARNING:</strong> This action will cascade-delete all bookings and transactions associated with this turf. This action is irreversible.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDeleteOpen(false)} className="flex-1 border-white/10 rounded-xl">Cancel</Button>
              <Button onClick={handleDeleteTurf} disabled={actionLoading} className="flex-1 bg-destructive hover:bg-destructive/90 text-white font-bold rounded-xl">
                {actionLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</> : 'Delete Turf'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
