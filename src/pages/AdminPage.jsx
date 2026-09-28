import { useEffect, useState } from 'react'
import AdminProfileSetup from '../components/AdminProfileSetup'
import AdminWordViews from '../components/AdminWordViews'
import EntryForm from '../components/EntryForm'
import Icon from '../components/Icon'
import SiteHeader from '../components/SiteHeader'
import {
  createEntry,
  deleteEntry,
  emptyEntry,
  listEntries,
  publishEntry,
  updateEntry,
} from '../lib/entries'
import {
  getSession,
  saveAdminProfile,
  signIn,
  signOut,
  subscribeToAuth,
} from '../lib/auth'

export default function AdminPage() {
  const [auth, setAuth] = useState({ loading: true, session: null, isAdmin: false, profile: null, languages: [] })
  const [entries, setEntries] = useState([])
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [login, setLogin] = useState({ email: '', password: '' })
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)

  useEffect(() => {
    getSession().then((result) => {
      setAuth({ loading: false, ...result })
      if (result.isAdmin) loadEntries()
    })
    return subscribeToAuth(async (_event, session) => {
      const result = await getSession()
      setAuth({ loading: false, ...result })
      if (session && result.isAdmin) loadEntries()
    })
  }, [])

  async function loadEntries() {
    const { data, error } = await listEntries({ admin: true })
    setEntries(data || [])
    if (error) setNotice(error.message)
  }

  async function submitLogin(event) {
    event.preventDefault()
    setNotice('')
    const { error } = await signIn(login.email, login.password)
    if (error) setNotice(error.message)
  }

  async function completeProfile(profile, languageCodes) {
    setProfileSaving(true)
    const result = await saveAdminProfile(auth.session.user.id, profile, languageCodes)
    setProfileSaving(false)
    if (result.error) setNotice(result.error.message)
    else setAuth({ ...auth, profile: { ...profile, onboarding_complete: true }, languages: languageCodes })
  }

  async function saveEntry(entry, action) {
    setSaving(true)
    const result = editing
      ? await updateEntry(editing.id, { ...entry, status: 'draft' })
      : await createEntry(entry)
    if (!result.error && action === 'publish') {
      const published = await publishEntry(result.data.id)
      if (published.error) result.error = published.error
    }
    setSaving(false)
    if (result.error) {
      setNotice(result.error.code === '23505' || result.error.message?.includes('entries_english_unique')
        ? 'This English word already exists. Please choose a different word.'
        : result.error.message)
      return
    }
    setShowForm(false)
    setEditing(null)
    setNotice(action === 'publish' ? 'Entry published.' : 'Draft saved. Matching admins have been notified.')
    await loadEntries()
  }

  async function removeEntry(entry) {
    if (!window.confirm(`Delete “${entry.english || 'this draft'}” from the dictionary?`)) return
    const { error } = await deleteEntry(entry.id)
    if (error) setNotice(error.message)
    else {
      setNotice('Entry deleted.')
      await loadEntries()
    }
  }

  async function publish(entry) {
    const { error } = await publishEntry(entry.id)
    if (error) setNotice(error.message)
    else {
      setNotice('Entry published.')
      await loadEntries()
    }
  }

  if (auth.loading) return <main className="page-shell"><SiteHeader /><div className="empty-state">Checking admin access...</div></main>

  if (!auth.session) return <main className="page-shell admin-page"><SiteHeader /><section className="auth-panel"><p className="eyebrow">Curator access</p><h1>Keep the lexicon <em>growing.</em></h1><p>Sign in with your Supabase admin account to add, edit, or remove words.</p><form onSubmit={submitLogin}><label><span>Email</span><input type="email" value={login.email} onChange={(event) => setLogin({ ...login, email: event.target.value })} required /></label><label><span>Password</span><input type="password" value={login.password} onChange={(event) => setLogin({ ...login, password: event.target.value })} required /></label>{notice && <p className="form-error">{notice}</p>}<button className="add-button" type="submit">Sign in <span aria-hidden="true">→</span></button></form></section></main>

  if (!auth.isAdmin) return <main className="page-shell"><SiteHeader /><section className="auth-panel"><p className="eyebrow">Access restricted</p><h1>This account is not an <em>admin.</em></h1><p>Ask an existing administrator to add your Supabase user ID to the admin allowlist.</p><button className="cancel-button" onClick={signOut}>Sign out</button></section></main>

  if (!auth.profile?.onboarding_complete) return <main className="page-shell"><SiteHeader admin /><AdminProfileSetup onComplete={completeProfile} saving={profileSaving} /></main>

  return <main className="page-shell admin-page">
    <SiteHeader admin />
    <section className="page-heading"><div><p className="eyebrow">Dictionary studio</p><h1>Shape the <em>archive.</em></h1></div><button className="add-button" onClick={() => { setEditing(null); setShowForm(true) }}><Icon name="plus" /> New draft</button></section>
    {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notice"><Icon name="close" /></button></div>}
    <AdminWordViews entries={entries} onEdit={(entry) => { setEditing(entry); setShowForm(true) }} onDelete={removeEntry} onPublish={publish} />
    {showForm && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowForm(false)}><div className="modal"><div className="modal-heading"><div><p className="eyebrow">{editing ? 'Edit entry' : 'New draft'}</p><h2>{editing ? 'Refine a word' : 'Start a word'}</h2></div><button type="button" className="icon-button" onClick={() => setShowForm(false)} aria-label="Close dialog"><Icon name="close" /></button></div><EntryForm initialEntry={editing || emptyEntry} existingEnglishWords={entries.map((entry) => entry.english).filter(Boolean)} onSubmit={saveEntry} onCancel={() => setShowForm(false)} saving={saving} /></div></div>}
  </main>
}
