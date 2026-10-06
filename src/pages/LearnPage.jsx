import { useEffect, useState } from "react";
import SiteHeader from "../components/SiteHeader";
import Icon from "../components/Icon";
import EntryTable from "../components/EntryTable";
import Flashcards from "../components/Flashcards";
import { languages, listEntries } from "../lib/entries";

export default function LearnPage() {
  const pageSize = 20;
  const [entries, setEntries] = useState([]);
  const [query, setQuery] = useState("");
  const [activeLanguage, setActiveLanguage] = useState("all");
  const [page, setPage] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [mode, setMode] = useState("browse");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setLoading(true);
    listEntries({
      page,
      pageSize,
      search: query,
      language: activeLanguage,
    }).then(({ data, count, error, local }) => {
      setEntries(data || []);
      setTotalEntries(count ?? data?.length ?? 0);
      setLoading(false);
      if (error)
        setNotice(
          "Could not load the shared lexicon. Showing the starter words.",
        );
      if (local)
        setNotice("Preview mode: connect Supabase to load the shared lexicon.");
    });
  }, [activeLanguage, page, pageSize, query]);

  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const updateQuery = (value) => {
    setQuery(value);
    setPage(1);
  };
  const updateLanguage = (value) => {
    setActiveLanguage(value);
    setPage(1);
  };

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
        <Flashcards entries={entries} />
      ) : (
        <section className="workspace">
          <div className="toolbar">
            <div className="search-box">
              <Icon name="search" />
              <input
                value={query}
                onChange={(event) => updateQuery(event.target.value)}
                placeholder="Search words, meanings, or examples..."
                aria-label="Search dictionary"
              />
            </div>
          </div>
          <div className="filters">
            <div className="filter-tabs">
              <button
                className={activeLanguage === "all" ? "active" : ""}
                onClick={() => updateLanguage("all")}
              >
                All words <span>{totalEntries}</span>
              </button>
              {languages.map((language) => (
                <button
                  className={activeLanguage === language.key ? "active" : ""}
                  key={language.key}
                  onClick={() => updateLanguage(language.key)}
                >
                  {language.label}
                </button>
              ))}
            </div>
            <span className="result-count">
              {loading ? "Loading..." : `${totalEntries} entries`}
            </span>
          </div>
          {loading ? (
            <div className="empty-state">Loading the lexicon...</div>
          ) : (
            <EntryTable
              entries={entries}
              activeLanguage={activeLanguage}
            />
          )}
          {!loading && totalEntries > 0 && (
            <div className="pagination" aria-label="Dictionary pagination">
              <button
                type="button"
                onClick={() => setPage((currentPage) => currentPage - 1)}
                disabled={page === 1}
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((currentPage) => currentPage + 1)}
                disabled={page >= totalPages}
              >
                Next
              </button>
            </div>
          )}
        </section>
      )}
      <footer>
        <span>Made for the words we grew up with.</span>
        <span>
          <b>{totalEntries}</b> words · 4 languages
        </span>
      </footer>
    </main>
  );
}
