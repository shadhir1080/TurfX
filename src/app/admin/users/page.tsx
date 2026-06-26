'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, Shield, Plus, Edit2, Trash2, UserX, UserCheck, 
  Mail, Key, User, Loader2, AlertTriangle, ShieldCheck 
} from 'lucide-react'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Dialog states
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  // Form states
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formFullName, setFormFullName] = useState('')
  const [formRole, setFormRole] = useState<'user' | 'owner' | 'admin'>('user')
  const [formIsActive, setFormIsActive] = useState<boolean>(true)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/admin/users')
      const result = await res.json()
      if (result.success) {
        setUsers(result.data || [])
      } else {
        setErrorMsg(result.error || 'Failed to load users')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred fetching users')
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formEmail,
          password: formPassword,
          fullName: formFullName,
          role: formRole
        })
      })
      const result = await res.json()
      if (result.success) {
        setAddOpen(false)
        resetForm()
        fetchUsers()
      } else {
        setErrorMsg(result.error || 'Failed to add user')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred adding user')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setActionLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          email: formEmail,
          password: formPassword || undefined, // Send password only if updated
          fullName: formFullName,
          role: formRole,
          isActive: formIsActive
        })
      })
      const result = await res.json()
      if (result.success) {
        setEditOpen(false)
        setSelectedUser(null)
        resetForm()
        fetchUsers()
      } else {
        setErrorMsg(result.error || 'Failed to update user')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred updating user')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return
    setActionLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch(`/api/admin/users?id=${selectedUser.id}`, {
        method: 'DELETE'
      })
      const result = await res.json()
      if (result.success) {
        setDeleteOpen(false)
        setSelectedUser(null)
        fetchUsers()
      } else {
        setErrorMsg(result.error || 'Failed to delete user')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred deleting user')
    } finally {
      setActionLoading(false)
    }
  }

  const toggleUserStatus = async (user: any) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          isActive: !user.is_active
        })
      })
      const result = await res.json()
      if (result.success) {
        fetchUsers()
      } else {
        alert(result.error || 'Failed to update user status')
      }
    } catch (err: any) {
      alert('An error occurred updating user status: ' + err.message)
    }
  }

  const resetForm = () => {
    setFormEmail('')
    setFormPassword('')
    setFormFullName('')
    setFormRole('user')
    setFormIsActive(true)
  }

  const openEdit = (user: any) => {
    setSelectedUser(user)
    setFormEmail(user.email || '')
    setFormPassword('')
    setFormFullName(user.full_name || '')
    setFormRole(user.role || 'user')
    setFormIsActive(user.is_active !== false)
    setEditOpen(true)
  }

  const openDelete = (user: any) => {
    setSelectedUser(user)
    setDeleteOpen(true)
  }

  const filtered = users.filter(u =>
    !search || 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const roleColors: Record<string, string> = {
    admin: 'bg-red-500/10 text-red-400 border-red-500/20',
    owner: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    user: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage all platform accounts, roles, and authorization status.</p>
        </div>
        <Button onClick={() => { resetForm(); setAddOpen(true) }} className="bg-primary hover:bg-primary/90 rounded-xl gap-2 font-bold shrink-0 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Add New User
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
        <Input placeholder="Search name or email..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white/5 border-white/10 rounded-xl h-11" />
      </div>

      <Card className="glass-dark border-white/10 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 font-bold text-foreground">
            <Shield className="w-5 h-5 text-primary" /> Registered Accounts ({filtered.length})
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
                    {['User Details', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="text-left py-3.5 px-2 text-xs font-bold uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user, i) => (
                    <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-sm">
                            {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <span className="font-semibold text-foreground block">{user.full_name || 'Unknown'}</span>
                            <span className="text-[10px] text-muted-foreground font-mono block">{user.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">{user.email || '—'}</td>
                      <td className="py-3 px-2">
                        <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 ${roleColors[user.role]}`}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        {user.is_active !== false ? (
                          <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-red-500/10 text-red-400 border-red-500/20">Deactivated</Badge>
                        )}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">{new Date(user.created_at).toLocaleDateString('en-IN')}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(user)}
                            className="text-xs h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg">
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>

                          <Button size="sm" variant="ghost" onClick={() => toggleUserStatus(user)}
                            className={`text-xs h-8 px-2 rounded-lg ${
                              user.is_active !== false 
                                ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10' 
                                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                            }`}>
                            {user.is_active !== false ? (
                              <><UserX className="w-3.5 h-3.5 mr-1" /> Deactivate</>
                            ) : (
                              <><UserCheck className="w-3.5 h-3.5 mr-1" /> Activate</>
                            )}
                          </Button>

                          {user.role !== 'admin' && (
                            <Button size="sm" variant="ghost" onClick={() => openDelete(user)}
                              className="text-xs h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">No accounts found.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="glass-dark border-white/10 max-w-md text-foreground rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Plus className="w-5 h-5 text-primary" /> Create User Account
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="add-name" className="text-xs">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="add-name" value={formFullName} onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="John Doe" className="pl-10 bg-white/5 border-white/10 rounded-xl" required />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="add-email" className="text-xs">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="add-email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="john@example.com" className="pl-10 bg-white/5 border-white/10 rounded-xl" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-password" className="text-xs">Initial Password</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="add-password" type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="••••••••" className="pl-10 bg-white/5 border-white/10 rounded-xl" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Account Role</Label>
              <Select value={formRole} onValueChange={(val: any) => setFormRole(val)}>
                <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white rounded-xl">
                  <SelectItem value="user">Player / User</SelectItem>
                  <SelectItem value="owner">Turf Owner</SelectItem>
                  <SelectItem value="admin">System Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} className="flex-1 border-white/10 rounded-xl">Cancel</Button>
              <Button type="submit" disabled={actionLoading} className="flex-1 bg-primary hover:bg-primary/90 font-bold rounded-xl">
                {actionLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : 'Create User'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="glass-dark border-white/10 max-w-md text-foreground rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Edit2 className="w-5 h-5 text-primary" /> Modify User Account
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name" className="text-xs">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="edit-name" value={formFullName} onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="John Doe" className="pl-10 bg-white/5 border-white/10 rounded-xl" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-email" className="text-xs">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="edit-email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 rounded-xl" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-password" className="text-xs">Password (Leave blank to keep same)</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="edit-password" type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="New password (optional)" className="pl-10 bg-white/5 border-white/10 rounded-xl" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Account Role</Label>
              <Select value={formRole} onValueChange={(val: any) => setFormRole(val)}>
                <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white rounded-xl">
                  <SelectItem value="user">Player / User</SelectItem>
                  <SelectItem value="owner">Turf Owner</SelectItem>
                  <SelectItem value="admin">System Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Account Status</Label>
              <Select value={formIsActive ? 'true' : 'false'} onValueChange={(val: any) => setFormIsActive(val === 'true')}>
                <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white rounded-xl">
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Deactivated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-2">
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
              <Trash2 className="w-5 h-5" /> Delete User Account
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to delete <span className="text-white font-semibold">{selectedUser?.full_name}</span>? 
              <br /><br />
              <strong className="text-red-400">WARNING:</strong> This action will cascade-delete their profile, bookings, payments, and listed turfs. This action is irreversible.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDeleteOpen(false)} className="flex-1 border-white/10 rounded-xl">Cancel</Button>
              <Button onClick={handleDeleteUser} disabled={actionLoading} className="flex-1 bg-destructive hover:bg-destructive/90 text-white font-bold rounded-xl">
                {actionLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</> : 'Delete User'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
