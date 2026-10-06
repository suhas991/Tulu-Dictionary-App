import { useEffect, useState } from "react";
import { getUnreadNotificationCount } from "../lib/auth";
import Icon from "./Icon";

export default function SiteHeader({
  admin = false,
  profileActive = false,
  notificationsActive = false,
}) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (admin) getUnreadNotificationCount().then(setUnreadCount);
  }, [admin]);

  return (
    <header className="topbar">
      <a className="brand" href="/">
        <img className="brand-logo" src="/logo.png" alt="Tuluvāṇi" />
      </a>
      <nav className="site-nav">
        <a href="/learn">Learn</a>
        {admin ? (
          <>
            <a className="nav-icon-link" href="/admin" aria-label="Dashboard" title="Dashboard">
              <Icon name="home" />
            </a>
            <a
              className={`notification-link ${notificationsActive ? "active" : ""}`}
              href="/notifications"
              aria-label="Notifications"
              title="Notifications"
            >
              <Icon name="bell" />
              {unreadCount > 0 && <span className="notification-dot" aria-label={`${unreadCount} unread notifications`} />}
            </a>
            <a className={`nav-icon-link ${profileActive ? "active" : ""}`} href="/profile" aria-label="Profile" title="Profile">
              <Icon name="user" />
            </a>
          </>
        ) : (
          <a href="/admin">Admin</a>
        )}
      </nav>
    </header>
  );
}
