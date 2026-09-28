import { useState } from "react";
import Icon from "./Icon";

export default function Flashcards({ entries }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  if (!entries.length)
    return (
      <div className="empty-state">Add words to start a flashcard session.</div>
    );
  const entry = entries[index % entries.length];
  function next() {
    setIndex((index + 1) % entries.length);
    setRevealed(false);
  }
  return (
    <section className="flashcard-stage">
      <div
        className="flashcard"
        onClick={() => setRevealed(!revealed)}
        role="button"
        tabIndex="0"
        onKeyDown={(event) => event.key === "Enter" && setRevealed(!revealed)}
      >
        <span className="flashcard-label">
          {revealed ? "Meaning" : "English"}
        </span>
        <h2>{revealed ? entry.meaning : entry.english}</h2>
        {revealed && (
          <>
            <p className="flashcard-example">
              {entry.example || "No example added yet."}
            </p>
            <div className="flashcard-translations">
              <span>
                Tulu <b>{entry.tulu}</b>
              </span>
              <span>
                Kannada <b>{entry.kannada}</b>
              </span>
              <span>
                Telugu <b>{entry.telugu}</b>
              </span>
            </div>
          </>
        )}
        <p className="flashcard-hint">
          {revealed ? "Tap to hide meaning" : "Tap to reveal meaning"}
        </p>
      </div>
      <div className="flashcard-controls">
        <span>
          {(index % entries.length) + 1} / {entries.length}
        </span>
        <button className="add-button" onClick={next}>
          <Icon name="arrow" /> Next word
        </button>
      </div>
    </section>
  );
}
