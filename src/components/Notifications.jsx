import { useEffect, useState } from "react";
import {
  clearReadNotifications,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../lib/auth";

export default function Notifications({ userId, fullPage = false }) {
  const [items, setItems] = useState([]);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    listNotifications(userId).then(({ data, error }) => {
      setItems(data || []);
      if (error) setNotice(error.message);
    });
  }, [userId]);
  async function read(item) {
    if (!item.is_read) {
      await markNotificationRead(item.id);
      setItems(
        items.map((current) =>
          current.id === item.id ? { ...current, is_read: true } : current,
        ),
      );
    }
  }
  async function readAll() {
    const { error } = await markAllNotificationsRead(userId);
    if (error) setNotice(error.message);
    else setItems(items.map((item) => ({ ...item, is_read: true })));
  }
  async function clearRead() {
    const { error } = await clearReadNotifications(userId);
    if (error) setNotice(error.message);
    else setItems(items.filter((item) => !item.is_read));
  }
  const unreadCount = items.filter((item) => !item.is_read).length;
  return (
    <section
      className={`notification-panel ${fullPage ? "notification-page-panel" : ""}`}
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">Translation tasks</p>
          <h2>Notifications</h2>
        </div>
        <div className="notification-tools">
          <span>{unreadCount} unread</span>
          {fullPage && (
            <>
              <button
                className="notification-action"
                onClick={readAll}
                disabled={!unreadCount}
              >
                Mark Read
              </button>
              <button
                className="notification-action danger"
                onClick={clearRead}
                disabled={items.every((item) => !item.is_read)}
              >
                Clear
              </button>
            </>
          )}
        </div>
      </div>
      {notice && <p className="form-error">{notice}</p>}
      {items.length ? (
        items.map((item) => (
          <button
            className={`notification-item ${item.is_read ? "read" : ""}`}
            key={item.id}
            onClick={() => read(item)}
          >
            Add the <strong>{item.language_code}</strong> translation for{" "}
            <strong>{item.entries?.english || "this draft"}</strong>
            <small>{new Date(item.created_at).toLocaleDateString()}</small>
          </button>
        ))
      ) : (
        <p className="empty-state">No translation tasks yet.</p>
      )}
    </section>
  );
}
