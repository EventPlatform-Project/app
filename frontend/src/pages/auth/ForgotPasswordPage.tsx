import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, ArrowRight } from 'lucide-react'
import { Button, Input } from '@/components/ui'

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => { setLoading(false); setSent(true) }, 1000)
  }

  return (
    <div className="min-h-screen bg-orbit-bg flex items-center justify-center p-6">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-orbit-primary/8 blur-[100px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-orbit-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <span className="text-slate-100 font-semibold">Orbit</span>
        </div>

        {!sent ? (
          <>
            <h1 className="text-2xl font-bold text-slate-100 mb-1">Reset your password</h1>
            <p className="text-slate-500 text-sm mb-8">
              Enter your email and we'll send you a reset link
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="you@company.com"
                prefix={<Mail className="w-3.5 h-3.5" />}
                required
              />
              <Button type="submit" size="lg" className="w-full" loading={loading} icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
                Send Reset Link
              </Button>
            </form>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="w-12 h-12 rounded-2xl bg-orbit-success/15 flex items-center justify-center mb-6">
              <Mail className="w-6 h-6 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100 mb-2">Check your inbox</h1>
            <p className="text-slate-500 text-sm mb-8">
              We've sent a password reset link to your email. It expires in 30 minutes.
            </p>
            <Button variant="outline" size="lg" className="w-full">
              Open Email App
            </Button>
          </motion.div>
        )}

        <Link
          to="/sign-in"
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors mt-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to sign in
        </Link>
      </motion.div>
    </div>
  )
}
