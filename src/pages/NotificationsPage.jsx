import { useEffect, useState } from "react";
import SiteHeader from "../components/SiteHeader";
import Notifications from "../components/Notifications";
import AdminProfileSettings from "../components/AdminProfileSettings";
import { getSession, saveAdminProfile, signOut, subscribeToAuth } from "../lib/auth";

export default function NotificationsPage() {
  const [auth, setAuth] = useState({
    loading: true,
    session: null,
    isAdmin: false,
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    getSession().then((result) => setAuth({ loading: false, ...result }));
    return subscribeToAuth(async () =>
      setAuth({ loading: false, ...(await getSession()) }),
    );
  }, []);

  async function saveProfile(profile, languageCodes) {
    setProfileSaving(true);
    const result = await saveAdminProfile(auth.session.user.id, profile, languageCodes);
    setProfileSaving(false);
    if (result.error) return;
    setAuth({
      ...auth,
      profile: { ...auth.profile, ...profile, onboarding_complete: true },
      languages: languageCodes,
    });
    setProfileOpen(false);
  }

  if (auth.loading)
    return (
      <main className="page-shell">
        <SiteHeader />
        <div className="empty-state">Checking notification access...</div>
      </main>
    );
  if (!auth.session || !auth.isAdmin)
    return (
      <main className="page-shell">
        <SiteHeader />
        <section className="auth-panel">
          <p className="eyebrow">Admin only</p>
          <h1>
            Notifications are <em>private.</em>
          </h1>
          <p>
            Sign in with an allowlisted admin account to view translation tasks.
          </p>
          <a className="add-button" href="/admin">
            Go to admin login
          </a>
        </section>
      </main>
    );
  return (
    <main className="page-shell notifications-page">
      <SiteHeader
        admin
        notificationsActive
        profileOpen={profileOpen}
        onProfile={() => setProfileOpen(true)}
        onSignOut={signOut}
      />
      <section className="page-heading">
        <div>
          <p className="eyebrow">Your translation tasks</p>
          <h1>
            Stay <em>informed.</em>
          </h1>
        </div>
      </section>
      <Notifications userId={auth.session.user.id} fullPage />
      {profileOpen && (
        <div
          className="modal-backdrop profile-backdrop"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setProfileOpen(false)
          }
        >
          <div className="modal profile-modal">
            <div className="modal-heading">
              <div>
                <p className="eyebrow">Account</p>
                <h2>Your profile</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setProfileOpen(false)}
                aria-label="Close profile"
              >
                ×
              </button>
            </div>
            <AdminProfileSettings
              session={auth.session}
              profile={auth.profile}
              selectedLanguages={auth.languages}
              onSave={saveProfile}
              saving={profileSaving}
            />
          </div>
        </div>
      )}
    </main>
  );
}
