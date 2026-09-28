import "./App.css";
import IntroPage from "./pages/IntroPage";
import LearnPage from "./pages/LearnPage";
import AdminPage from "./pages/AdminPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";

export default function App() {
  const path = window.location.pathname;
  if (path === "/learn") return <LearnPage />;
  if (path === "/admin") return <AdminPage />;
  if (path === "/notifications") return <NotificationsPage />;
  if (path === "/profile") return <ProfilePage />;
  return <IntroPage />;
}
