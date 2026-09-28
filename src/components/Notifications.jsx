import { useEffect, useState } from 'react'
import { listNotifications, markNotificationRead } from '../lib/auth'

export default function Notifications({ userId }) {
  const [items, setItems] = useState([])
  useEffect(() => { listNotifications(userId).then(({ data }) => setItems(data || [])) }, [userId])
  async function read(item) { if (!item.is_read) { await markNotificationRead(item.id); setItems(items.map((current) => current.id === item.id ? { ...current, is_read: true } : current)) } }
  return <section className="notification-panel"><div className="section-heading"><div><p className="eyebrow">Translation tasks</p><h2>Notifications</h2></div><span>{items.filter((item) => !item.is_read).length} unread</span></div>{items.length ? items.map((item) => <button className={`notification-item ${item.is_read ? 'read' : ''}`} key={item.id} onClick={() => read(item)}>Add the <strong>{item.language_code}</strong> translation for <strong>{item.entries?.english || 'this draft'}</strong><small>{new Date(item.created_at).toLocaleDateString()}</small></button>) : <p className="empty-state">No translation tasks yet.</p>}</section>
}