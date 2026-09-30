const LOOKUP_URL = "https://freedictionaryapi.com/api/v1/entries/en";

function firstUsableDefinition(payload) {
  const entries = Array.isArray(payload?.entries) ? payload.entries : [];
  for (const entry of entries) {
    for (const sense of entry?.senses || []) {
      const definition = String(sense?.definition || "")
        .replace(/\s+/g, " ")
        .trim();
      if (definition.length >= 5) return definition;
    }
  }
  return "";
}

export async function lookupEnglishMeaning(word, signal) {
  const query = word.trim().toLowerCase().replace(/\s+/g, " ");
  if (query.length < 2) {
    return { meaning: "", sourceUrl: "", error: null };
  }

  try {
    const response = await fetch(
      `${LOOKUP_URL}/${encodeURIComponent(query)}`,
      { signal },
    );
    if (response.status === 404) {
      return { meaning: "", sourceUrl: "", error: "not-found" };
    }
    if (!response.ok) {
      return { meaning: "", sourceUrl: "", error: "lookup-failed" };
    }

    const payload = await response.json();
    const meaning = firstUsableDefinition(payload);
    return {
      meaning,
      sourceUrl: payload?.source?.url || "",
      error: meaning ? null : "not-found",
    };
  } catch (error) {
    if (error?.name === "AbortError") {
      return { meaning: "", sourceUrl: "", error: "aborted" };
    }
    return { meaning: "", sourceUrl: "", error: "lookup-failed" };
  }
}
