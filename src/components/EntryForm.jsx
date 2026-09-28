import React, { useState } from "react";
import { canPublish, emptyEntry, missingFields } from "../lib/entries";

export default function EntryForm({
  initialEntry = emptyEntry,
  onSubmit,
  onCancel,
  saving = false,
}) {
  const [form, setForm] = useState({ ...emptyEntry, ...initialEntry });

  function updateForm(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function submit(event, action) {
    event.preventDefault();
    onSubmit(form, action);
  }

  const missing = missingFields(form);
  return (
    <form className="entry-form" onSubmit={(event) => submit(event, "draft")}>
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
