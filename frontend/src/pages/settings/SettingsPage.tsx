import { useState } from 'react'
import { motion } from 'framer-motion'
import { Moon, Sun, Monitor, User, Bell, Shield, Key, Save, Camera } from 'lucide-react'
import { Button, Input, Card, CardHeader, CardBody, Badge } from '@/components/ui'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/utils/cn'

type ThemeOption = 'dark' | 'light' | 'system'

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  index = 0,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  children: React.ReactNode
  index?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orbit-primary/10">
              <Icon className="w-4 h-4 text-orbit-primary-light" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="pt-5 border-t border-orbit-border mt-4">
          {children}
        </CardBody>
      </Card>
    </motion.div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative w-10 h-5 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orbit-primary',
        checked ? 'bg-orbit-primary' : 'bg-orbit-surface3'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  )
}

export function SettingsPage() {
  const { theme, toggle } = useTheme()
  const [themeOption, setThemeOption] = useState<ThemeOption>(theme)
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    digest: true,
    security: true,
  })
  const [name, setName] = useState('Alex Morgan')
  const [email, setEmail] = useState('alex@orbitdash.io')
  const [saved, setSaved] = useState(false)

  const handleThemeSelect = (option: ThemeOption) => {
    setThemeOption(option)
    if (option !== 'system') {
      const isDark = option === 'dark'
      const currentlyDark = theme === 'dark'
      if (isDark !== currentlyDark) toggle()
    }
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const themeOptions: { value: ThemeOption; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-2xl space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <SectionCard icon={User} title="Profile" description="Your name and email address" index={0}>
        <div className="flex items-start gap-5 mb-5">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orbit-primary to-orbit-accent flex items-center justify-center text-white text-xl font-bold">
              B
            </div>
            <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-orbit-primary flex items-center justify-center shadow-lg">
              <Camera className="w-3 h-3 text-white" />
            </button>
          </div>
          <div className="flex-1 space-y-3">
            <Input label="Display name" value={name} onChange={e => setName(e.target.value)} />
            <Input label="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button size="sm" icon={<Save className="w-3.5 h-3.5" />} onClick={handleSave}>
            {saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </SectionCard>

      {/* Appearance */}
      <SectionCard icon={Sun} title="Appearance" description="Customize how Orbit looks for you" index={1}>
        <div>
          <p className="text-xs font-medium text-slate-400 mb-3">Theme</p>
          <div className="flex items-center gap-2">
            {themeOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleThemeSelect(opt.value)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150',
                  themeOption === opt.value
                    ? 'bg-orbit-primary/15 border-orbit-primary/40 text-orbit-primary-light shadow-sm'
                    : 'border-orbit-border text-slate-400 hover:border-orbit-border2 hover:text-slate-200'
                )}
              >
                <opt.icon className="w-4 h-4" />
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-600 mt-2">
            System follows your OS preference
          </p>
        </div>

        <div className="mt-5 pt-5 border-t border-orbit-border">
          <p className="text-xs font-medium text-slate-400 mb-3">Accent Color</p>
          <div className="flex items-center gap-3">
            {[
              { name: 'Violet', color: '#7C3AED', active: true },
              { name: 'Cyan', color: '#06B6D4', active: false },
              { name: 'Emerald', color: '#10B981', active: false },
              { name: 'Rose', color: '#F43F5E', active: false },
              { name: 'Amber', color: '#F59E0B', active: false },
            ].map(c => (
              <button
                key={c.name}
                title={c.name}
                className={cn(
                  'w-7 h-7 rounded-full transition-all duration-150',
                  c.active ? 'ring-2 ring-offset-2 ring-offset-orbit-surface scale-110' : 'hover:scale-105'
                )}
                style={{ background: c.color, '--tw-ring-color': c.color } as React.CSSProperties}
              />
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Notifications */}
      <SectionCard icon={Bell} title="Notifications" description="Choose what you want to be notified about" index={2}>
        <div className="space-y-4">
          {[
            { key: 'email' as const, label: 'Email notifications', description: 'Receive updates, invoices, and alerts via email' },
            { key: 'push' as const, label: 'Push notifications', description: 'Browser push notifications for real-time alerts' },
            { key: 'digest' as const, label: 'Weekly digest', description: 'A weekly summary of your key metrics every Monday' },
            { key: 'security' as const, label: 'Security alerts', description: 'Get notified of new sign-ins and security events' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-200">{item.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
              </div>
              <Toggle
                checked={notifications[item.key]}
                onChange={v => setNotifications(n => ({ ...n, [item.key]: v }))}
              />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Security */}
      <SectionCard icon={Shield} title="Security" description="Manage your password and two-factor authentication" index={3}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-200">Password</p>
              <p className="text-xs text-slate-500 mt-0.5">Last changed 3 months ago</p>
            </div>
            <Button variant="outline" size="sm">Change Password</Button>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-orbit-border">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-slate-200">Two-Factor Authentication</p>
                <Badge variant="danger">Disabled</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Add an extra layer of security to your account</p>
            </div>
            <Button size="sm" icon={<Shield className="w-3.5 h-3.5" />}>Enable 2FA</Button>
          </div>
        </div>
      </SectionCard>

      {/* API Keys */}
      <SectionCard icon={Key} title="API Keys" description="Manage keys for connecting Orbit to your backend" index={4}>
        <div className="space-y-3">
          {[
            { name: 'Production', key: 'sk-orbit-prod-••••••••••••••••••••••3f8a', status: 'active' as const, created: 'Jan 15, 2026' },
            { name: 'Development', key: 'sk-orbit-dev-••••••••••••••••••••••9b2c', status: 'active' as const, created: 'Mar 4, 2026' },
          ].map(apiKey => (
            <div key={apiKey.name} className="flex items-center justify-between p-3 rounded-lg bg-orbit-surface2 border border-orbit-border">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-200">{apiKey.name}</p>
                  <Badge variant="success" dot>Active</Badge>
                </div>
                <p className="text-xs font-mono text-slate-500 mt-1">{apiKey.key}</p>
                <p className="text-[11px] text-slate-600 mt-0.5">Created {apiKey.created}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">Copy</Button>
                <Button variant="outline" size="sm">Revoke</Button>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full mt-2" icon={<Key className="w-3.5 h-3.5" />}>
            Generate New Key
          </Button>
        </div>
      </SectionCard>
    </div>
  )
}
