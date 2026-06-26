'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, CalendarDays, User, LogOut, ChevronRight } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/bookings', icon: CalendarDays, label: 'My Bookings' },
  { href: '/dashboard/profile', icon: User, label: 'Profile' },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const handleSignOut = async () => { await signOut(); router.push('/') }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <div className="glass-dark rounded-2xl border border-white/10 p-4 sticky top-24">
              <div className="flex items-center gap-3 p-3 mb-4 border-b border-white/10 pb-5">
                <Avatar className="w-11 h-11 ring-2 ring-primary/30">
                  <AvatarFallback className="bg-primary/20 text-primary font-bold">
                    {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{profile?.full_name || 'Player'}</p>
                  <p className="text-xs text-muted-foreground">Sports Enthusiast</p>
                </div>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link key={item.href} href={item.href}>
                      <motion.div whileHover={{ x: 4 }} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                      }`}>
                        <item.icon className="w-4 h-4" />
                        {item.label}
                        {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                      </motion.div>
                    </Link>
                  )
                })}
              </nav>
              <div className="mt-4 pt-4 border-t border-white/10">
                <Button variant="ghost" size="sm" onClick={handleSignOut}
                  className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </Button>
              </div>
            </div>
          </aside>
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}
