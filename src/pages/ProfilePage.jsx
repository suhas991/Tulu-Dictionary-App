import { useEffect, useState } from "react";
import AdminProfileSettings from "../components/AdminProfileSettings";
import AdminProfileSetup from "../components/AdminProfileSetup";
import SiteHeader from "../components/SiteHeader";
import {
  getSession,
  saveAdminProfile,
  signOut,
  subscribeToAuth,
} from "../lib/auth";

export default function ProfilePage() {
  const [auth, setAuth] = useState({
    loading: true,
    session: null,
    isAdmin: false,
    profile: null,
    languages: [],
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    getSession().then((result) => setAuth({ loading: false, ...result }));
    return subscribeToAuth(async () =>
      setAuth({ loading: false, ...(await getSession()) }),
    );
  }, []);

  async function saveProfile(profile, languageCodes) {
    setSaving(true);
    const result = await saveAdminProfile(
      auth.session.user.id,
      profile,
      languageCodes,
    );
    setSaving(false);
    if (result.error) {
      setNotice(result.error.message);
      return;
    }
    setAuth({
      ...auth,
      profile: { ...auth.profile, ...profile, onboarding_complete: true },
      languages: languageCodes,
    });
    setNotice("Profile settings saved.");
  }

  if (auth.loading) {
    return (
      <main className="page-shell">
        <SiteHeader />
        <div className="empty-state">Checking profile access...</div>
      </main>
    );
  }

  if (!auth.session || !auth.isAdmin) {
    return (
      <main className="page-shell">
        <SiteHeader />
        <section className="auth-panel">
          <p className="eyebrow">Admin only</p>
          <h1>Your profile is <em>private.</em></h1>
          <p>Sign in with an allowlisted admin account to manage your profile.</p>
          <a className="add-button" href="/admin">Go to admin login</a>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell profile-page">
      <SiteHeader admin profileActive />
      <section className="page-heading">
        <div>
          <p className="eyebrow">Account settings</p>
          <h1>Your <em>profile.</em></h1>
        </div>
      </section>
      {notice && <div className="notice" role="status">{notice}</div>}
      {!auth.profile?.onboarding_complete ? (
        <AdminProfileSetup
          onComplete={saveProfile}
          saving={saving}
        />
      ) : (
        <section className="profile-page-panel">
          <AdminProfileSettings
            session={auth.session}
            profile={auth.profile}
            selectedLanguages={auth.languages}
            onSave={saveProfile}
            onSignOut={signOut}
            saving={saving}
          />
        </section>
      )}
    </main>
  );
}