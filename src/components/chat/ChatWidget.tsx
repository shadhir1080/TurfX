'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

const RASA_URL = process.env.NEXT_PUBLIC_RASA_URL || 'http://localhost:5005/webhooks/rest/webhook'

const initialMessage: Message = {
  id: 'welcome',
  text: '👋 Hi! I\'m TurfBot. I can help you with questions about booking, cancellations, pricing, and more. How can I help?',
  sender: 'bot',
  timestamp: new Date(),
}

function renderInlineStyles(text: string, isBot: boolean) {
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong 
          key={index} 
          className={`font-bold ${isBot ? 'text-emerald-400' : 'text-white'}`}
        >
          {part.slice(2, -2)}
        </strong>
      )
    }
    return part
  })
}

function formatMessageText(text: string, isBot: boolean) {
  const paragraphs = text.split(/\n\n+/)

  return paragraphs.map((para, paraIndex) => {
    const lines = para.split('\n')
    const isBulletList = lines.length > 0 && lines.every(line => /^\s*[-*•]\s+/.test(line))
    const isNumberedList = lines.length > 0 && lines.every(line => /^\s*\d+\.\s+/.test(line))

    if (isBulletList) {
      return (
        <ul key={paraIndex} className="list-disc pl-4 my-1.5 space-y-1">
          {lines.map((line, lineIndex) => {
            const content = line.replace(/^\s*[-*•]\s+/, '')
            return <li key={lineIndex}>{renderInlineStyles(content, isBot)}</li>
          })}
        </ul>
      )
    }

    if (isNumberedList) {
      return (
        <ol key={paraIndex} className="list-decimal pl-4 my-1.5 space-y-1">
          {lines.map((line, lineIndex) => {
            const content = line.replace(/^\s*\d+\.\s+/, '')
            return <li key={lineIndex}>{renderInlineStyles(content, isBot)}</li>
          })}
        </ol>
      )
    }

    return (
      <p key={paraIndex} className="mb-1.5 last:mb-0">
        {lines.map((line, lineIndex) => (
          <span key={lineIndex}>
            {renderInlineStyles(line, isBot)}
            {lineIndex < lines.length - 1 && <br />}
          </span>
        ))}
      </p>
    )
  })
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([initialMessage])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!isOpen && messages.length > 1) setUnread(prev => prev + 1)
    if (isOpen) setUnread(0)
  }, [messages.length])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: 'user',
      timestamp: new Date(),
    }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    const sentText = input.trim()
    setInput('')
    setLoading(true)

    // Check if running on localhost (development environment)
    const isLocal = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

    if (isLocal) {
      // 1. Localhost: Query the local Ollama LLM RAG endpoint
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: updatedMessages }),
        })
        const data = await res.json()
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: data.reply || "I'm sorry, I encountered an issue generating a response.",
          sender: 'bot',
          timestamp: new Date(),
        }])
      } catch (err) {
        console.error('Error connecting to local chatbot API:', err)
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: "I couldn't reach TurfBot's local server. Please ensure Ollama is running.",
          sender: 'bot',
          timestamp: new Date(),
        }])
      }
    } else {
      // 2. Production Domain: Persist current Rasa / Local Heuristic fallback
      try {
        const res = await fetch(RASA_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sender: 'user', message: sentText }),
        })
        const data = await res.json()
        const botReplies: Message[] = (data || []).map((r: any, i: number) => ({
          id: `${Date.now()}-${i}`,
          text: r.text || '...',
          sender: 'bot',
          timestamp: new Date(),
        }))

        if (botReplies.length === 0) {
          botReplies.push({
            id: Date.now().toString(),
            text: "I'm not sure about that. Try asking about booking, cancellations, or pricing.",
            sender: 'bot',
            timestamp: new Date(),
          })
        }
        setMessages(prev => [...prev, ...botReplies])
      } catch {
        const lower = sentText.toLowerCase()
        let reply = ""
        if (lower.includes('book') || lower.includes('how to book')) {
          reply = "To book a turf, go to the 'Browse Turfs' page, select your preferred turf, choose an available date and hourly slot, choose your payment option (advance or full), and click 'Book Now'."
        } else if (lower.includes('cancel') || lower.includes('refund')) {
          reply = "You can cancel bookings from your User Dashboard. Full payment bookings cancelled 24 hours in advance get a 100% refund of the turf cost. Advance payments are non-refundable."
        } else if (lower.includes('price') || lower.includes('cost') || lower.includes('commission')) {
          reply = "Pricing is set hourly by turf owners. Weekends may have a small surcharge. A platform fee of 10% (or custom owner commission) is added to the total amount."
        } else if (lower.includes('sport') || lower.includes('football') || lower.includes('cricket')) {
          reply = "Various sports are available including Football, Cricket, Badminton, and Box Cricket depending on the turf you choose. You can filter by sport on the browse page."
        } else {
          reply = "I'm currently running in standby mode. You can book turfs, make split payments, and manage them on your dashboard. Let me know if you have questions about pricing or bookings!"
        }

        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: reply,
          sender: 'bot',
          timestamp: new Date(),
        }])
      }
    }
    setLoading(false)
  }

  const quickReplies = ['How do I book a turf?', 'Can I cancel my booking?', 'What sports are available?', 'How is pricing calculated?']

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
            className="w-80 sm:w-96 h-[520px] glass-dark border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary/20 border-b border-white/10 px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm">TurfBot</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender === 'bot' && (
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-3 h-3 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-white/10 text-foreground rounded-bl-sm'
                  }`}>
                    {formatMessageText(msg.text, msg.sender === 'bot')}
                  </div>
                  {msg.sender === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                      <User className="w-3 h-3 text-primary" />
                    </div>
                  )}
                </motion.div>
              ))}
              {loading && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3 h-3 text-primary" />
                  </div>
                  <div className="bg-white/10 px-3 py-2 rounded-2xl rounded-bl-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {quickReplies.map((q) => (
                  <button key={q} onClick={() => { setInput(q); }}
                    className="text-xs bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/30 text-muted-foreground hover:text-primary px-2.5 py-1.5 rounded-full transition-all">
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form onSubmit={sendMessage} className="p-3 border-t border-white/10 flex gap-2">
              <Input value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="Ask TurfBot anything..."
                className="flex-1 bg-white/5 border-white/10 focus:border-primary text-sm h-9" />
              <Button type="submit" size="icon" disabled={loading || !input.trim()}
                className="h-9 w-9 bg-primary hover:bg-primary/90 shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-14 h-14 bg-primary hover:bg-primary/90 rounded-full shadow-lg shadow-primary/30 flex items-center justify-center glow-green transition-colors"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-6 h-6 text-primary-foreground" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle className="w-6 h-6 text-primary-foreground" />
            </motion.div>
          )}
        </AnimatePresence>
        {!isOpen && unread > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
            {unread}
          </div>
        )}
      </motion.button>
    </div>
  )
}
