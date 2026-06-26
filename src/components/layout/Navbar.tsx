'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { LogOut, LayoutDashboard, Menu, X, MapPin } from 'lucide-react'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const getDashboardLink = () => {
    if (profile?.role === 'admin') return '/admin'
    if (profile?.role === 'owner') return '/owner'
    return '/dashboard'
  }

  const navLinks = [
    { href: '/turfs', label: 'Browse Turfs' },
    { href: '/about', label: 'About' },
  ]

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass-dark shadow-lg' : 'bg-transparent'
      }`}
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-lg">⚽</span>
            </div>
            <span className="text-xl font-bold gradient-text">TurfX Ultra</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === link.href ? 'text-primary' : 'text-muted-foreground'
                }`}>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <Avatar className="w-8 h-8 ring-2 ring-primary/50">
                      <AvatarFallback className="bg-primary/20 text-primary font-semibold text-sm">
                        {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left hidden lg:block">
                      <p className="text-sm font-medium text-foreground leading-none">{profile?.full_name || 'User'}</p>
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">{profile?.role}</p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 glass-dark border-white/10">
                  <DropdownMenuItem onClick={() => router.push(getDashboardLink())} className="cursor-pointer">
                    <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Sign In</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 font-semibold">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden text-muted-foreground hover:text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-dark border-t border-white/10"
          >
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium text-muted-foreground hover:text-primary py-2">
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 flex flex-col gap-2">
                {user ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => { router.push(getDashboardLink()); setMobileOpen(false) }}
                      className="border-white/10 justify-start">
                      <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-destructive justify-start">
                      <LogOut className="w-4 h-4 mr-2" /> Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full border-white/10">Sign In</Button>
                    </Link>
                    <Link href="/auth/signup" onClick={() => setMobileOpen(false)}>
                      <Button size="sm" className="w-full bg-primary hover:bg-primary/90">Get Started</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
