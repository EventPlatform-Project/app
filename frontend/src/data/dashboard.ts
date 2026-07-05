import { DollarSign, Users, TrendingUp, Activity } from 'lucide-react'
import type { StatCardData, Transaction } from '@/types'

export const revenueData = [
  { month: 'Jan', revenue: 42000, expenses: 28000 },
  { month: 'Feb', revenue: 53000, expenses: 31000 },
  { month: 'Mar', revenue: 48000, expenses: 29000 },
  { month: 'Apr', revenue: 71000, expenses: 35000 },
  { month: 'May', revenue: 64000, expenses: 32000 },
  { month: 'Jun', revenue: 89000, expenses: 38000 },
  { month: 'Jul', revenue: 95000, expenses: 41000 },
  { month: 'Aug', revenue: 108000, expenses: 44000 },
  { month: 'Sep', revenue: 96000, expenses: 39000 },
  { month: 'Oct', revenue: 114000, expenses: 47000 },
  { month: 'Nov', revenue: 128000, expenses: 52000 },
  { month: 'Dec', revenue: 142000, expenses: 55000 },
]

export const trafficData = [
  { name: 'Organic', value: 38, color: '#7C3AED' },
  { name: 'Direct', value: 24, color: '#06B6D4' },
  { name: 'Social', value: 18, color: '#8B5CF6' },
  { name: 'Email', value: 12, color: '#22D3EE' },
  { name: 'Paid', value: 8, color: '#A78BFA' },
]

export const statsData: StatCardData[] = [
  {
    id: 'revenue',
    label: 'Total Revenue',
    value: '$284,902',
    change: 12.5,
    changeLabel: 'vs last month',
    icon: DollarSign,
    color: 'primary',
    sparkData: [
      { value: 42000 }, { value: 53000 }, { value: 48000 }, { value: 71000 },
      { value: 64000 }, { value: 89000 }, { value: 108000 }, { value: 142000 },
    ],
  },
  {
    id: 'users',
    label: 'Active Users',
    value: '14,293',
    change: 8.2,
    changeLabel: 'vs last month',
    icon: Users,
    color: 'accent',
    sparkData: [
      { value: 8200 }, { value: 9100 }, { value: 8800 }, { value: 10200 },
      { value: 11000 }, { value: 12400 }, { value: 13100 }, { value: 14293 },
    ],
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions',
    value: '2,847',
    change: 23.1,
    changeLabel: 'vs last month',
    icon: TrendingUp,
    color: 'success',
    sparkData: [
      { value: 1200 }, { value: 1400 }, { value: 1800 }, { value: 1900 },
      { value: 2100 }, { value: 2300 }, { value: 2600 }, { value: 2847 },
    ],
  },
  {
    id: 'churn',
    label: 'Churn Rate',
    value: '1.4%',
    change: -0.3,
    changeLabel: 'vs last month',
    icon: Activity,
    color: 'warning',
    sparkData: [
      { value: 2.1 }, { value: 1.9 }, { value: 2.0 }, { value: 1.8 },
      { value: 1.7 }, { value: 1.6 }, { value: 1.5 }, { value: 1.4 },
    ],
  },
]

export const transactions: Transaction[] = [
  { id: '1', customer: 'Alex Chen', email: 'alex@acme.io', initials: 'AC', date: 'Jun 21, 2026', type: 'Subscription', amount: 299, status: 'completed' },
  { id: '2', customer: 'Sarah Kim', email: 'sarah@pixel.co', initials: 'SK', date: 'Jun 21, 2026', type: 'Pro Upgrade', amount: 49, status: 'pending' },
  { id: '3', customer: 'Marcus Webb', email: 'marcus@loop.dev', initials: 'MW', date: 'Jun 20, 2026', type: 'One-time', amount: 799, status: 'completed' },
  { id: '4', customer: 'Priya Patel', email: 'priya@nova.io', initials: 'PP', date: 'Jun 20, 2026', type: 'Subscription', amount: 149, status: 'completed' },
  { id: '5', customer: 'James Liu', email: 'james@drift.ai', initials: 'JL', date: 'Jun 19, 2026', type: 'Refund', amount: -99, status: 'refunded' },
  { id: '6', customer: 'Emma Torres', email: 'emma@forge.com', initials: 'ET', date: 'Jun 19, 2026', type: 'Subscription', amount: 299, status: 'failed' },
  { id: '7', customer: 'Daniel Park', email: 'daniel@stack.io', initials: 'DP', date: 'Jun 18, 2026', type: 'Enterprise', amount: 1499, status: 'completed' },
]

export const activityFeed = [
  { id: '1', text: 'New enterprise deal closed with Acme Corp', time: '2 min ago', type: 'success', initials: 'AC' },
  { id: '2', text: 'Sarah Kim upgraded to Pro plan', time: '18 min ago', type: 'upgrade', initials: 'SK' },
  { id: '3', text: 'System maintenance scheduled for Sunday 2AM', time: '1 hour ago', type: 'info', initials: 'SY' },
  { id: '4', text: 'Revenue milestone: $250K MRR reached', time: '3 hours ago', type: 'milestone', initials: 'MR' },
  { id: '5', text: 'James Liu requested a refund', time: '5 hours ago', type: 'warning', initials: 'JL' },
]
