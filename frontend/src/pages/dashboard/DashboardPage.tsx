import { useState } from 'react'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { motion } from 'framer-motion'
import { Download, Plus, ExternalLink } from 'lucide-react'
import { Button, Badge, Avatar, Card, CardHeader, CardBody, StatCard } from '@/components/ui'
import { statsData, revenueData, trafficData, transactions, activityFeed } from '@/data/dashboard'
import { cn } from '@/utils/cn'
import type { Transaction } from '@/types'

const periods = ['7D', '30D', '90D', '1Y'] as const
type Period = typeof periods[number]

const periodSlice: Record<Period, number> = { '7D': 2, '30D': 4, '90D': 9, '1Y': 12 }

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-orbit-surface2 border border-orbit-border rounded-xl p-3 shadow-2xl">
      <p className="text-xs text-slate-500 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-400 capitalize">{p.name}</span>
          <span className="text-slate-100 font-semibold ml-auto">
            ${(p.value / 1000).toFixed(0)}k
          </span>
        </div>
      ))}
    </div>
  )
}

function statusConfig(status: Transaction['status']) {
  return {
    completed: { label: 'Completed', variant: 'success' as const },
    pending:   { label: 'Pending',   variant: 'warning' as const },
    failed:    { label: 'Failed',    variant: 'danger'  as const },
    refunded:  { label: 'Refunded',  variant: 'neutral' as const },
  }[status]
}

function activityColor(type: string) {
  return {
    success:   'bg-emerald-500',
    upgrade:   'bg-orbit-primary',
    info:      'bg-orbit-info',
    milestone: 'bg-orbit-accent',
    warning:   'bg-orbit-warning',
  }[type] ?? 'bg-slate-500'
}

export function DashboardPage() {
  const [period, setPeriod] = useState<Period>('1Y')
  const sliced = revenueData.slice(-periodSlice[period])

  const now = new Date()
  const greeting =
    now.getHours() < 12 ? 'Good morning' :
    now.getHours() < 17 ? 'Good afternoon' : 'Good evening'

  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-[1600px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            {greeting}, Alex{' '}
            <span className="inline-block animate-[wave_2s_ease-in-out_infinite]">👋</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">{dateStr}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />}>
            Export
          </Button>
          <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
            New Report
          </Button>
        </div>
      </motion.div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statsData.map((stat, i) => (
          <StatCard key={stat.id} data={stat} index={i} />
        ))}
      </div>

      {/* Main charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Revenue Overview — takes 2/3 */}
        <Card className="xl:col-span-2">
          <CardHeader
            title="Revenue Overview"
            subtitle="Monthly revenue vs expenses"
            actions={
              <div className="flex items-center gap-1 bg-orbit-surface2 rounded-lg p-1">
                {periods.map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                      period === p
                        ? 'bg-orbit-primary text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-300'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            }
          />
          <CardBody className="pt-2">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={sliced} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="grad-revenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-expenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#7C3AED" strokeWidth={2} fill="url(#grad-revenue)" dot={false} />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#06B6D4" strokeWidth={2} fill="url(#grad-expenses)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 pt-3 border-t border-orbit-border">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-3 h-0.5 bg-orbit-primary rounded" />
                Revenue
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-3 h-0.5 bg-orbit-accent rounded" />
                Expenses
              </div>
              <div className="ml-auto text-xs text-slate-600">
                Net profit:{' '}
                <span className="text-emerald-400 font-semibold">
                  ${((revenueData[revenueData.length - 1].revenue - revenueData[revenueData.length - 1].expenses) / 1000).toFixed(0)}k
                </span>{' '}
                this month
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Traffic Sources — takes 1/3 */}
        <Card>
          <CardHeader title="Traffic Sources" subtitle="Last 30 days" />
          <CardBody className="pt-2">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={trafficData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {trafficData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2.5 mt-2">
              {trafficData.map(item => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                  <span className="text-xs text-slate-400 flex-1">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-orbit-surface3 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${item.value}%`, background: item.color }}
                      />
                    </div>
                    <span className="text-xs text-slate-300 w-8 text-right">{item.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Bottom row: Transactions + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent Transactions */}
        <Card className="xl:col-span-2">
          <CardHeader
            title="Recent Transactions"
            subtitle={`${transactions.length} transactions this week`}
            actions={
              <Button variant="ghost" size="sm" icon={<ExternalLink className="w-3 h-3" />} iconPosition="right">
                View all
              </Button>
            }
          />
          <CardBody className="p-0 pt-2">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-orbit-border">
                    {['Customer', 'Date', 'Type', 'Amount', 'Status'].map(col => (
                      <th key={col} className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider px-5 pb-3">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-orbit-border">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar initials={tx.initials} size="sm" />
                          <div>
                            <p className="text-sm text-slate-200 font-medium">{tx.customer}</p>
                            <p className="text-xs text-slate-500">{tx.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-400 whitespace-nowrap">{tx.date}</td>
                      <td className="px-5 py-3 text-sm text-slate-400">{tx.type}</td>
                      <td className="px-5 py-3">
                        <span className={cn(
                          'text-sm font-semibold',
                          tx.amount < 0 ? 'text-red-400' : 'text-slate-100'
                        )}>
                          {tx.amount < 0 ? '-' : '+'}${Math.abs(tx.amount).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={statusConfig(tx.status).variant} dot>
                          {statusConfig(tx.status).label}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader
            title="Recent Activity"
            subtitle="Live updates"
            actions={
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-slate-500">Live</span>
              </div>
            }
          />
          <CardBody className="pt-2 space-y-0">
            {activityFeed.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 + 0.3 }}
                className="flex items-start gap-3 py-3 border-b border-orbit-border last:border-0"
              >
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0',
                  activityColor(item.type)
                )}>
                  {item.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300 leading-relaxed">{item.text}</p>
                  <p className="text-[11px] text-slate-600 mt-1">{item.time}</p>
                </div>
              </motion.div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
