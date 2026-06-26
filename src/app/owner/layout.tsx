'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Plus, CalendarDays, TrendingUp, LogOut, ChevronRight, Menu, Building2 } from 'lucide-react'

const navItems = [
  { href: '/owner', icon: LayoutDashboard, label: 'Overview' },
  { href: '/owner/turfs', icon: Building2, label: 'My Turfs' },
  { href: '/owner/add-turf', icon: Plus, label: 'Add Turf' },
  { href: '/owner/bookings', icon: CalendarDays, label: 'Bookings' },
  { href: '/owner/earnings', icon: TrendingUp, label: 'Earnings' },
]

export default function OwnerLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => { await signOut(); router.push('/') }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center"><span className="text-base">⚽</span></div>
          <div>
            <span className="font-bold text-foreground">TurfX Ultra</span>
            <p className="text-xs text-emerald-400 font-medium">Owner Portal</p>
          </div>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
              <motion.div whileHover={{ x: 4 }} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}>
                <item.icon className="w-4 h-4" />
                {item.label}
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </motion.div>
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-9 h-9 ring-2 ring-primary/30">
            <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'O'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{profile?.full_name || 'Owner'}</p>
            <p className="text-xs text-emerald-400">Turf Owner</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleSignOut}
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10">
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden lg:block w-64 glass-dark border-r border-white/10 fixed h-full z-40"><SidebarContent /></aside>
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-64 glass-dark border-r border-white/10 z-50 lg:hidden">
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="glass-dark border-b border-white/10 px-4 md:px-6 py-4 flex items-center gap-4 sticky top-0 z-30">
          <button className="lg:hidden text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-foreground flex-1">
            {navItems.find(n => n.href === pathname)?.label || 'Owner Portal'}
          </h2>
          <Link href="/owner/add-turf">
            <Button size="sm" className="bg-primary hover:bg-primary/90 gap-1">
              <Plus className="w-4 h-4" /> Add Turf
            </Button>
          </Link>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
