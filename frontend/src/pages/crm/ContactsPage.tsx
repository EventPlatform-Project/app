import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Plus, Filter, LayoutGrid, List,
  Mail, Phone, Building2, MapPin, Tag, ArrowUpRight,
} from 'lucide-react'
import { Button, Badge, Avatar, Input, Card } from '@/components/ui'
import { contacts } from '@/data/contacts'
import { cn } from '@/utils/cn'
import type { Contact } from '@/types'

const statusConfig = {
  active:   { label: 'Active',   variant: 'success' as const },
  inactive: { label: 'Inactive', variant: 'neutral' as const },
  prospect: { label: 'Prospect', variant: 'info'    as const },
}

function ContactCard({ contact, index }: { contact: Contact; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="p-5 hover:border-orbit-border2 transition-all duration-200 group cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar initials={contact.initials} size="lg" online={contact.status === 'active'} />
            <div>
              <p className="text-sm font-semibold text-slate-100">{contact.name}</p>
              <p className="text-xs text-slate-500">{contact.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusConfig[contact.status].variant} dot>
              {statusConfig[contact.status].label}
            </Badge>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-slate-300">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Building2 className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
            {contact.company}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Mail className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
            <span className="truncate">{contact.email}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Phone className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
            {contact.phone}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
            {contact.location}
          </div>
        </div>

        {contact.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Tag className="w-3 h-3 text-slate-700" />
            {contact.tags.map(tag => (
              <span key={tag} className="text-[10px] text-slate-500 bg-orbit-surface3 px-2 py-0.5 rounded-full border border-orbit-border">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-orbit-border flex items-center justify-between">
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-200">{contact.deals}</p>
            <p className="text-[10px] text-slate-600">Deals</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-200">
              {contact.value > 0 ? `$${(contact.value / 1000).toFixed(0)}k` : '—'}
            </p>
            <p className="text-[10px] text-slate-600">Value</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-slate-500">{contact.lastActivity}</p>
            <p className="text-[10px] text-slate-600">Last active</p>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

function ContactRow({ contact, index }: { contact: Contact; index: number }) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.04 }}
      className="border-b border-orbit-border hover:bg-white/2 transition-colors group"
    >
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Avatar initials={contact.initials} size="sm" online={contact.status === 'active'} />
          <div>
            <p className="text-sm text-slate-200 font-medium">{contact.name}</p>
            <p className="text-xs text-slate-500">{contact.email}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <div>
          <p className="text-sm text-slate-300">{contact.company}</p>
          <p className="text-xs text-slate-500">{contact.role}</p>
        </div>
      </td>
      <td className="px-5 py-3.5 text-sm text-slate-400">{contact.location}</td>
      <td className="px-5 py-3.5">
        <Badge variant={statusConfig[contact.status].variant} dot>
          {statusConfig[contact.status].label}
        </Badge>
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-1 flex-wrap">
          {contact.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[10px] text-slate-500 bg-orbit-surface3 px-2 py-0.5 rounded-full border border-orbit-border">
              {tag}
            </span>
          ))}
        </div>
      </td>
      <td className="px-5 py-3.5 text-sm text-slate-300 font-medium">
        {contact.value > 0 ? `$${(contact.value / 1000).toFixed(0)}k` : '—'}
      </td>
      <td className="px-5 py-3.5 text-sm text-slate-500">{contact.lastActivity}</td>
      <td className="px-5 py-3.5">
        <button className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-white/5">
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </td>
    </motion.tr>
  )
}

type ViewMode = 'grid' | 'list'
type StatusFilter = 'all' | 'active' | 'inactive' | 'prospect'

export function ContactsPage() {
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const filtered = contacts.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Contacts</h1>
          <p className="text-slate-500 text-sm mt-0.5">{contacts.length} total contacts</p>
        </div>
        <Button icon={<Plus className="w-3.5 h-3.5" />}>Add Contact</Button>
      </div>

      {/* Filters + View toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-48 max-w-sm">
          <Input
            prefix={<Search className="w-3.5 h-3.5" />}
            placeholder="Search contacts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1 bg-orbit-surface2 border border-orbit-border rounded-lg p-1">
          {(['all', 'active', 'inactive', 'prospect'] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium capitalize transition-all',
                statusFilter === s
                  ? 'bg-orbit-primary text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <Button variant="outline" size="sm" icon={<Filter className="w-3.5 h-3.5" />}>
          Filters
        </Button>

        <div className="flex items-center gap-1 bg-orbit-surface2 border border-orbit-border rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={cn('p-1.5 rounded-md transition-all', viewMode === 'grid' ? 'bg-orbit-primary text-white' : 'text-slate-500 hover:text-slate-300')}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn('p-1.5 rounded-md transition-all', viewMode === 'list' ? 'bg-orbit-primary text-white' : 'text-slate-500 hover:text-slate-300')}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-slate-600">
        Showing {filtered.length} of {contacts.length} contacts
      </p>

      {/* Grid view */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((contact, i) => (
            <ContactCard key={contact.id} contact={contact} index={i} />
          ))}
        </div>
      )}

      {/* List view */}
      {viewMode === 'list' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-orbit-border">
                  {['Contact', 'Company', 'Location', 'Status', 'Tags', 'Value', 'Last Active', ''].map(col => (
                    <th key={col} className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider px-5 py-3">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((contact, i) => (
                  <ContactRow key={contact.id} contact={contact} index={i} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-600">
          <p className="text-lg font-medium text-slate-500">No contacts found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}
