import { useState } from 'react'
import { languages } from '../lib/entries'

export default function AdminProfileSetup({ onComplete, saving = false }) {
  const [displayName, setDisplayName] = useState('')
  const [selected, setSelected] = useState([])
  function toggle(language) { setSelected(selected.includes(language) ? selected.filter((item) => item !== language) : [...selected, language]) }
  return <section className="auth-panel profile-setup"><p className="eyebrow">Your curator profile</p><h1>What languages do you <em>know?</em></h1><p>Choose every language you can help translate. We’ll send you matching draft notifications.</p><form onSubmit={(event) => { event.preventDefault(); onComplete({ display_name: displayName }, selected) }}><label><span>Display name</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Your name" /></label><div className="language-picker"><span>Languages you know</span><div>{languages.map(({ key, label }) => <button type="button" key={key} className={selected.includes(key) ? 'selected' : ''} onClick={() => toggle(key)}>{label}</button>)}</div></div><button className="add-button" disabled={saving || selected.length === 0}>{saving ? 'Saving...' : 'Continue to dashboard'}</button></form></section>
}