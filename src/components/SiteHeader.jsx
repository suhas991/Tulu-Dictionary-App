import Icon from './Icon'

export default function SiteHeader({ admin = false, onSignOut }) {
  return <header className="topbar"><a className="brand" href="/"><span className="brand-mark"><Icon name="book" /></span><span>Tulu<span className="brand-light">vāṇi</span></span></a><nav className="site-nav"><a href="/learn">Learn</a>{admin ? <button onClick={onSignOut}>Sign out</button> : <a href="/admin">Admin</a>}</nav></header>
}
