import EntryTable from './EntryTable'
import Icon from './Icon'

export default function AdminWordViews({
  entries,
  total,
  counts,
  page,
  pageSize,
  view,
  missingFilter,
  search,
  onFiltersChange,
  onEdit,
  onDelete,
  onPublish,
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const setView = (nextView) => onFiltersChange({ view: nextView, missingFilter: 'all', page: 1 })
  const setSearch = (nextSearch) => onFiltersChange({ search: nextSearch, page: 1 })
  const setMissingFilter = (nextMissingFilter) => onFiltersChange({ missingFilter: nextMissingFilter, page: 1 })

  return <section className="workspace admin-words">
    <div className="admin-view-toolbar">
      <div className="admin-view-tabs" role="tablist">
        <button className={view === 'drafts' ? 'active' : ''} onClick={() => setView('drafts')}>Drafts <span>{counts.drafts}</span></button>
        <button className={view === 'published' ? 'active' : ''} onClick={() => setView('published')}>Published <span>{counts.published}</span></button>
      </div>
      <div className="admin-view-controls">
        <label className="admin-search">
          <Icon name="search" />
          <input type="search" aria-label="Search words" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search words" />
        </label>
        {view === 'drafts' && <label className="draft-sort"><span>Filter drafts</span><select value={missingFilter} onChange={(event) => setMissingFilter(event.target.value)}><option value="all">All drafts</option><option value="english">Missing English</option><option value="tulu">Missing Tulu</option><option value="kannada">Missing Kannada</option><option value="telugu">Missing Telugu</option><option value="meaning">Missing meaning</option></select></label>}
      </div>
    </div>
    <div className="admin-view-summary">{view === 'drafts' ? `${total} drafts matching filter` : `${total} published words`}</div>
    <EntryTable entries={entries} admin onEdit={onEdit} onDelete={onDelete} onPublish={onPublish} />
    {total > 0 && <div className="pagination" aria-label="Admin dictionary pagination">
      <button type="button" onClick={() => onFiltersChange({ page: page - 1 })} disabled={page === 1}>Previous</button>
      <span>Page {page} of {totalPages}</span>
      <button type="button" onClick={() => onFiltersChange({ page: page + 1 })} disabled={page >= totalPages}>Next</button>
    </div>}
  </section>
}
