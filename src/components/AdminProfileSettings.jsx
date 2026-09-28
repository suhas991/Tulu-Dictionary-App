import { useState } from 'react'
import { languages } from '../lib/entries'

export default function AdminProfileSettings({ session, profile, selectedLanguages, onSave, saving = false }) {
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [notificationsEnabled, setNotificationsEnabled] = useState(profile?.notifications_enabled !== false)
  const [selected, setSelected] = useState(selectedLanguages || [])

  function toggleLanguage(language) {
    setSelected(selected.includes(language) ? selected.filter((item) => item !== language) : [...selected, language])
  }

  function submit(event) {
    event.preventDefault()
    onSave({ display_name: displayName, notifications_enabled: notificationsEnabled }, selected)
  }

  return <section className="profile-panel">
    <div className="section-heading"><div><p className="eyebrow">Your profile</p><h2>Curator settings</h2></div><span>{session.user.email}</span></div>
    <form className="profile-form" onSubmit={submit}>
      <label><span>Display name</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Your name" /></label>
      <div className="language-picker"><span>Languages you can translate</span><div>{languages.map(({ key, label }) => <button type="button" key={key} className={selected.includes(key) ? 'selected' : ''} onClick={() => toggleLanguage(key)}>{label}</button>)}</div></div>
      <label className="toggle-label"><input type="checkbox" checked={notificationsEnabled} onChange={(event) => setNotificationsEnabled(event.target.checked)} /><span>Receive translation notifications</span></label>
      <button className="draft-button" type="submit" disabled={saving || selected.length === 0}>{saving ? 'Saving...' : 'Save profile'}</button>
    </form>
  </section>
}
