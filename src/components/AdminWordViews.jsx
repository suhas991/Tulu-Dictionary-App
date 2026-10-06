import { useMemo, useState } from 'react'
import EntryTable from './EntryTable'
import Icon from './Icon'
import { missingFields } from '../lib/entries'

export default function AdminWordViews({ entries, onEdit, onDelete, onPublish }) {
  const [view, setView] = useState('drafts')
  const [missingFilter, setMissingFilter] = useState('all')
  const [search, setSearch] = useState('')
  const drafts = useMemo(() => entries.filter((entry) => entry.status !== 'published'), [entries])
  const published = useMemo(() => entries.filter((entry) => entry.status === 'published'), [entries])
  const visibleEntries = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase()
    const source = view === 'drafts'
      ? drafts.filter((entry) => missingFilter === 'all' || missingFields(entry).includes(missingFilter))
      : published
    const filtered = normalizedSearch
      ? source.filter((entry) => [entry.english, entry.tulu, entry.kannada, entry.telugu, entry.meaning, entry.example]
        .filter(Boolean)
        .some((value) => value.toLocaleLowerCase().includes(normalizedSearch)))
      : source
    return [...filtered].sort((first, second) => {
      if (view === 'drafts') return missingFields(second).length - missingFields(first).length
      return new Date(second.created_at) - new Date(first.created_at)
    })
  }, [drafts, published, missingFilter, search, view])

  return <section className="workspace admin-words">
    <div className="admin-view-toolbar">
      <div className="admin-view-tabs" role="tablist">
        <button className={view === 'drafts' ? 'active' : ''} onClick={() => setView('drafts')}>Drafts <span>{drafts.length}</span></button>
        <button className={view === 'published' ? 'active' : ''} onClick={() => setView('published')}>Published <span>{published.length}</span></button>
      </div>
      <div className="admin-view-controls">
        <label className="admin-search">
          <Icon name="search" />
          <input type="search" aria-label="Search words" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search words" />
        </label>
        {view === 'drafts' && <label className="draft-sort"><span>Filter drafts</span><select value={missingFilter} onChange={(event) => setMissingFilter(event.target.value)}><option value="all">All drafts</option><option value="english">Missing English</option><option value="tulu">Missing Tulu</option><option value="kannada">Missing Kannada</option><option value="telugu">Missing Telugu</option><option value="meaning">Missing meaning</option></select></label>}
      </div>
    </div>
    <div className="admin-view-summary">{view === 'drafts' ? `${visibleEntries.length} drafts matching filter` : `${visibleEntries.length} published words`}</div>
    <EntryTable entries={visibleEntries} admin onEdit={onEdit} onDelete={onDelete} onPublish={onPublish} />
  </section>
}
