import { useEffect, useMemo, useState } from "react";
import SiteHeader from "../components/SiteHeader";
import Icon from "../components/Icon";
import EntryTable from "../components/EntryTable";
import Flashcards from "../components/Flashcards";
import { languages, listEntries } from "../lib/entries";

export default function LearnPage() {
  const [entries, setEntries] = useState([]);
  const [query, setQuery] = useState("");
  const [activeLanguage, setActiveLanguage] = useState("all");
  const [mode, setMode] = useState("browse");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    listEntries().then(({ data, error, local }) => {
      setEntries(data || []);
      setLoading(false);
      if (error)
        setNotice(
          "Could not load the shared lexicon. Showing the starter words.",
        );
      if (local)
        setNotice("Preview mode: connect Supabase to load the shared lexicon.");
    });
  }, []);

  const filteredEntries = useMemo(
    () =>
      entries.filter((entry) => {
        const normalized = query.toLowerCase();
        const matchesQuery =
          !normalized ||
          [...languages.map(({ key }) => key), "meaning", "example"].some(
            (key) => entry[key]?.toLowerCase().includes(normalized),
          );
        const matchesLanguage =
          activeLanguage === "all" ||
          entry[activeLanguage]?.toLowerCase().includes(normalized);
        return matchesQuery && matchesLanguage;
      }),
    [entries, query, activeLanguage],
  );

  return (
    <main className="page-shell">
      <SiteHeader />
      <section className="page-heading">
        <div>
          <p className="eyebrow">The learning room</p>
          <h1>
            Find a word.
            <br />
            <em>Keep it close.</em>
          </h1>
        </div>
        <div className="mode-switch" role="tablist">
          <button
            className={mode === "browse" ? "active" : ""}
            onClick={() => setMode("browse")}
          >
            <Icon name="book" /> Browse
          </button>
          <button
            className={mode === "cards" ? "active" : ""}
            onClick={() => setMode("cards")}
          >
            <Icon name="cards" /> Flashcards
          </button>
        </div>
      </section>
      {notice && (
        <div className="notice" role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Dismiss notice">
            <Icon name="close" />
          </button>
        </div>
      )}
      {mode === "cards" ? (
        <Flashcards entries={filteredEntries} />
      ) : (
        <section className="workspace">
          <div className="toolbar">
            <div className="search-box">
              <Icon name="search" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search words, meanings, or examples..."
                aria-label="Search dictionary"
              />
            </div>
          </div>
          <div className="filters">
            <div className="filter-tabs">
              <button
                className={activeLanguage === "all" ? "active" : ""}
                onClick={() => setActiveLanguage("all")}
              >
                All words <span>{entries.length}</span>
              </button>
              {languages.map((language) => (
                <button
                  className={activeLanguage === language.key ? "active" : ""}
                  key={language.key}
                  onClick={() => setActiveLanguage(language.key)}
                >
                  {language.label}
                </button>
              ))}
            </div>
            <span className="result-count">
              {loading ? "Loading..." : `${filteredEntries.length} entries`}
            </span>
          </div>
          {loading ? (
            <div className="empty-state">Loading the lexicon...</div>
          ) : (
            <EntryTable
              entries={filteredEntries}
              activeLanguage={activeLanguage}
            />
          )}
        </section>
      )}
      <footer>
        <span>Made for the words we grew up with.</span>
        <span>
          <b>{entries.length}</b> words · 4 languages
        </span>
      </footer>
    </main>
  );
}
