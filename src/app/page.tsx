'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, MapPin, Star, ChevronRight, Shield, Zap, Clock, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Navbar from '@/components/layout/Navbar'
import TurfCard from '@/components/turfs/TurfCard'
import { useTurfs } from '@/hooks/useTurfs'

const fadeUp: any = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: 'easeOut' }
  })
}

const features = [
  { icon: Zap, title: 'Instant Booking', description: 'Book your slot in seconds with real-time availability.' },
  { icon: Shield, title: 'Secure Payments', description: 'Pay safely with Razorpay — India\'s most trusted gateway.' },
  { icon: Clock, title: '24/7 Access', description: 'Browse and book anytime, from anywhere.' },
  { icon: Trophy, title: 'Premium Turfs', description: 'Only verified, high-quality venues make the cut.' },
]

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const { turfs, loading } = useTurfs({ limit: 6, verified: true, sortByNearest: true })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/turfs?q=${encodeURIComponent(searchQuery)}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center hero-gradient overflow-hidden pt-16">
        {/* Decorative orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/15 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        {/* Floating sport emojis */}
        {['⚽', '🏏', '🏸', '🎾', '🏀'].map((emoji, i) => (
          <motion.div key={emoji}
            className="absolute text-4xl opacity-20 pointer-events-none"
            style={{
              left: `${10 + i * 20}%`,
              top: `${20 + (i % 3) * 20}%`,
            }}
            animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.5 }}
          >
            {emoji}
          </motion.div>
        ))}

        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6"
          >
            <Star className="w-4 h-4 text-primary fill-primary" />
            <span className="text-sm text-primary font-medium">India&apos;s #1 Turf Booking Platform</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-foreground mb-6 leading-tight"
          >
            Book Your
            <span className="block gradient-text">Perfect Turf</span>
            in Seconds
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            Discover, compare, and instantly book premium sports turfs near you.
            Cricket, Football, Badminton — we&apos;ve got it all.
          </motion.p>

          {/* Search Bar */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto"
          >
            <div className="relative flex-1">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by location or turf name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 bg-white/10 border-white/20 focus:border-primary text-foreground placeholder:text-muted-foreground text-base rounded-xl"
              />
            </div>
            <Button type="submit" className="h-14 px-8 bg-primary hover:bg-primary/90 font-bold text-base rounded-xl glow-green">
              <Search className="w-5 h-5 mr-2" /> Search
            </Button>
          </motion.form>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-wrap justify-center gap-8 mt-12 text-sm text-muted-foreground"
          >
            {[['500+', 'Turfs Listed'], ['50K+', 'Happy Players'], ['100+', 'Cities'], ['4.8★', 'Avg. Rating']].map(([num, label]) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold text-foreground">{num}</p>
                <p>{label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 w-6 h-10 border-2 border-white/20 rounded-full flex items-start justify-center pt-2"
        >
          <div className="w-1 h-2 bg-primary rounded-full" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Why Choose <span className="gradient-text">TurfX Ultra?</span>
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We&apos;re making sports accessible for everyone with a seamless, end-to-end experience.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
              className="glass-dark rounded-2xl p-6 border border-white/10 card-hover"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Turfs */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Featured <span className="gradient-text">Turfs</span></h2>
            <p className="text-muted-foreground mt-1">Top-rated venues handpicked for you.</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/turfs')}
            className="border-white/10 hover:bg-white/5 hidden sm:flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-dark rounded-2xl overflow-hidden border border-white/10">
                <div className="shimmer h-48" />
                <div className="p-5 space-y-3">
                  <div className="shimmer h-5 rounded w-3/4" />
                  <div className="shimmer h-4 rounded w-1/2" />
                  <div className="shimmer h-4 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {turfs.map((turf, i) => (
              <motion.div key={turf.id} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}>
                <TurfCard turf={turf} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto glass-dark rounded-3xl p-12 border border-white/10 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-emerald-500/10 pointer-events-none" />
          <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4 relative z-10">
            Own a Turf? <span className="gradient-text">List it Today.</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-8 relative z-10 max-w-xl mx-auto">
            Join hundreds of turf owners earning more with TurfX Ultra. Get verified, manage bookings, and receive instant payouts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <Button size="lg" onClick={() => router.push('/auth/signup')}
              className="bg-primary hover:bg-primary/90 font-bold px-8 h-12 glow-green">
              List Your Turf — Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push('/turfs')}
              className="border-white/20 hover:bg-white/5 h-12">
              Browse Turfs
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-base">⚽</span>
            </div>
            <span className="font-bold gradient-text">TurfX Ultra</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 TurfX Ultra. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
