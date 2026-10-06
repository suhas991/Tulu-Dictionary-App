import React, { useEffect, useRef, useState } from "react";
import { generateDraftSuggestion, generateMeaningSuggestion } from "../lib/aiDrafts";
import { lookupEnglishMeaning } from "../lib/dictionaryLookup";
import { canPublish, emptyEntry, missingFields } from "../lib/entries";

export default function EntryForm({
  initialEntry = emptyEntry,
  onSubmit,
  onCancel,
  existingEnglishWords = [],
  saving = false,
}) {
  const [form, setForm] = useState({ ...emptyEntry, ...initialEntry });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [duplicateError, setDuplicateError] = useState("");
  const [lookupState, setLookupState] = useState("idle");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceName, setSourceName] = useState("");
  const autoFilledMeaningRef = useRef("");
  const formRef = useRef(form);
  formRef.current = form;

  function normalizeWord(value) {
    return value.toLowerCase().trim().replace(/\s+/g, " ");
  }

  function updateForm(event) {
    const { name, value } = event.target;
    setForm({ ...form, [name]: value });
    if (name === "english") setDuplicateError("");
    if (name === "meaning" && value.trim() !== autoFilledMeaningRef.current) {
      setLookupState("idle");
      setSourceUrl("");
      setSourceName("");
    }
  }

  function submit(event, action) {
    event.preventDefault();
    const english = normalizeWord(form.english || "");
    const originalEnglish = normalizeWord(initialEntry.english || "");
    const duplicate = english && existingEnglishWords.some((word) => {
      const normalized = normalizeWord(word);
      return normalized === english && normalized !== originalEnglish;
    });
    if (duplicate) {
      setDuplicateError("This English word already exists. Please choose a different word.");
      return;
    }
    setDuplicateError("");
    onSubmit(form, action);
  }

  async function generateWithAi() {
    setAiLoading(true);
    setAiError("");
    const { data, error } = await generateDraftSuggestion(existingEnglishWords);
    setAiLoading(false);
    if (error || !data?.english || !data?.meaning) {
      setAiError(error?.message || data?.error || "Could not generate a suggestion.");
      return;
    }
    autoFilledMeaningRef.current = "";
    setLookupState("idle");
    setSourceUrl("");
    setSourceName("");
    setForm((current) => ({ ...current, english: data.english, meaning: data.meaning }));
  }

  useEffect(() => {
    const word = (form.english || "").trim();
    if (word.length < 2) {
      setLookupState("idle");
      setSourceUrl("");
      setSourceName("");
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const currentMeaning = (formRef.current.meaning || "").trim();
      if (currentMeaning && currentMeaning !== autoFilledMeaningRef.current) return;

      setLookupState("loading");
      const result = await lookupEnglishMeaning(word, controller.signal);
      if (result.error === "aborted") return;

      const latestMeaning = (formRef.current.meaning || "").trim();
      if (latestMeaning && latestMeaning !== autoFilledMeaningRef.current) {
        setLookupState("idle");
        return;
      }

      if (!result.meaning) {
        const aiResult = await generateMeaningSuggestion(word, controller.signal);
        if (aiResult.error?.code === "aborted") return;
        const aiMeaning = aiResult.data?.meaning;
        if (aiMeaning) {
          autoFilledMeaningRef.current = aiMeaning;
          setForm((current) => ({ ...current, meaning: aiMeaning }));
          setLookupState("filled");
          setSourceName("AI");
          setSourceUrl("");
          return;
        }
        setLookupState(result.error === "not-found" ? "missing" : "error");
        setSourceUrl("");
        setSourceName("");
        return;
      }

      autoFilledMeaningRef.current = result.meaning;
      setForm((current) => ({ ...current, meaning: result.meaning }));
      setLookupState("filled");
      setSourceName("Free Dictionary API");
      setSourceUrl(result.sourceUrl || "");
    }, 450);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [form.english]);

  const missing = missingFields(form);
  return (
    <form className="entry-form" onSubmit={(event) => submit(event, "draft")}>
      <div className="ai-draft-row">
        <span>Need an everyday English starting point?</span>
        <button className="ai-button" type="button" onClick={generateWithAi} disabled={aiLoading || saving}>
          {aiLoading ? "Generating..." : "AI suggestion"}
        </button>
      </div>
      {aiError && <p className="form-error">{aiError}</p>}
      {duplicateError && <p className="form-error" role="alert">{duplicateError}</p>}
      <div className="form-grid">
        {["english", "tulu", "kannada", "telugu"].map((key) => (
          <label key={key}>
            <span>
              {key[0].toUpperCase() + key.slice(1)}
              <small> (optional in draft)</small>
            </span>
            <input
              name={key}
              value={form[key] || ""}
              onChange={updateForm}
              placeholder={`Enter ${key} word`}
            />
          </label>
        ))}
      </div>
      <label>
        <span>
          Meaning<small> (optional in draft)</small>
        </span>
        <textarea
          name="meaning"
          value={form.meaning || ""}
          onChange={updateForm}
          placeholder="Explain the word in English"
          rows="2"
        />
        {lookupState === "loading" && (
          <small className="dictionary-hint">Looking up meaning…</small>
        )}
        {lookupState === "filled" && (
          <small className="dictionary-hint">
            Meaning auto-filled from{" "}
            {sourceUrl ? <a href="https://freedictionaryapi.com/" target="_blank" rel="noreferrer">{sourceName}</a> : sourceName}
            {sourceUrl ? (
              <>
                {" "}
                ·{" "}
                <a href={sourceUrl} target="_blank" rel="noreferrer">
                  Wiktionary
                </a>
              </>
            ) : null}
          </small>
        )}
        {lookupState === "missing" && (
          <small className="dictionary-hint">No dictionary meaning found for this word.</small>
        )}
        {lookupState === "error" && (
          <small className="dictionary-hint">Could not look up the meaning right now.</small>
        )}
      </label>
      <label>
        <span>
          Example <small>(optional)</small>
        </span>
        <textarea
          name="example"
          value={form.example || ""}
          onChange={updateForm}
          placeholder="Use the word in a sentence"
          rows="2"
        />
      </label>
      <label>
        <span>Part of speech</span>
        <select
          name="part_of_speech"
          value={form.part_of_speech}
          onChange={updateForm}
        >
          <option>noun</option>
          <option>verb</option>
          <option>adjective</option>
          <option>adverb</option>
          <option>phrase</option>
        </select>
      </label>
      {missing.length > 0 && (
        <p className="draft-hint">
          Missing for publication: {missing.join(", ")}
        </p>
      )}
      <div className="modal-actions">
        <button type="button" className="cancel-button" onClick={onCancel}>
          Cancel
        </button>
        <button className="draft-button" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save draft"}
        </button>
        <button
          className="add-button"
          type="button"
          onClick={(event) => submit(event, "publish")}
          disabled={saving || !canPublish(form)}
        >
          Publish
        </button>
      </div>
    </form>
  );
}
