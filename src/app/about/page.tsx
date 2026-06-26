'use client'

import { motion } from 'framer-motion'
import Navbar from '@/components/layout/Navbar'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Users, MapPin, Zap } from 'lucide-react'

const features = [
  {
    icon: <MapPin className="w-8 h-8 text-primary" />,
    title: 'Local to Coimbatore',
    description: 'We focus exclusively on providing the best turf experiences in and around Coimbatore.'
  },
  {
    icon: <Zap className="w-8 h-8 text-yellow-500" />,
    title: 'Instant Booking',
    description: 'Book your favorite turfs instantly with our seamless checkout process and live availability.'
  },
  {
    icon: <Users className="w-8 h-8 text-blue-500" />,
    title: 'Community Driven',
    description: 'Join thousands of sports enthusiasts. Discover new turfs, read reviews, and play together.'
  },
  {
    icon: <Trophy className="w-8 h-8 text-emerald-500" />,
    title: 'Premium Venues',
    description: 'We partner with the top-rated sports venues ensuring high-quality facilities for your matches.'
  }
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-black text-foreground mb-6"
          >
            About <span className="gradient-text">TurfX Ultra</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          >
            TurfX Ultra is Coimbatore’s premier sports venue booking platform. We connect passionate players with the city’s best turfs, making it incredibly easy to find, book, and play your favorite sports. Whether it is a midnight football match or an early morning cricket net session, we have got you covered.
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Card className="glass-dark border-white/10 h-full card-hover">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Mission Section */}
        <motion.div 
          initial={{ opacity: 0 }} 
          whileInView={{ opacity: 1 }} 
          viewport={{ once: true }}
          className="glass-dark rounded-3xl p-8 sm:p-12 border border-primary/20 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Mission</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              To empower athletes and sports lovers by providing a frictionless platform to access world-class sporting infrastructure. We believe that access to sports should be simple, transparent, and community-focused.
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
