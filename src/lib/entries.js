import { supabase } from "./supabase";

export const languages = [
  { key: "english", label: "English", short: "EN" },
  { key: "tulu", label: "Tulu", short: "TU" },
  { key: "kannada", label: "Kannada", short: "KA" },
  { key: "telugu", label: "Telugu", short: "TE" },
];

export const emptyEntry = {
  english: "",
  tulu: "",
  kannada: "",
  telugu: "",
  meaning: "",
  example: "",
  part_of_speech: "noun",
};

export const requiredFields = [
  "english",
  "tulu",
  "kannada",
  "telugu",
  "meaning",
];

export const sampleEntries = [
  {
    id: "1",
    english: "water",
    tulu: "neeru",
    kannada: "neeru",
    telugu: "neellu",
    meaning: "A clear liquid essential for life.",
    example: "Please give me some water.",
    part_of_speech: "noun",
    created_at: "2026-09-26",
  },
  {
    id: "2",
    english: "house",
    tulu: "ill",
    kannada: "mane",
    telugu: "illu",
    meaning: "A place where people live.",
    example: "Our house is near the temple.",
    part_of_speech: "noun",
    created_at: "2026-09-25",
  },
  {
    id: "3",
    english: "good",
    tulu: "laavu",
    kannada: "olleya",
    telugu: "manchi",
    meaning: "Having desirable qualities.",
    example: "This is good food.",
    part_of_speech: "adjective",
    created_at: "2026-09-24",
  },
  {
    id: "4",
    english: "to come",
    tulu: "barpini",
    kannada: "baru",
    telugu: "raavadam",
    meaning: "To move toward or arrive at a place.",
    example: "Come home before sunset.",
    part_of_speech: "verb",
    created_at: "2026-09-22",
  },
];

function cleanEntry(entry) {
  return Object.fromEntries(
    Object.entries(entry).map(([key, value]) => [
      key,
      typeof value === "string" && !value.trim()
        ? null
        : typeof value === "string"
          ? value.trim()
          : value,
    ]),
  );
}

export function missingFields(entry) {
  return requiredFields.filter((field) => !entry[field]?.trim());
}

export function canPublish(entry) {
  return missingFields(entry).length === 0;
}

export async function listEntries({
  admin = false,
  page,
  pageSize,
  search = "",
  language = "all",
  status,
  missingField = "all",
} = {}) {
  const isPaginated = Number.isInteger(page) && Number.isInteger(pageSize);
  const normalizedSearch = search.trim().toLowerCase();
  const searchableFields = [
    ...languages.map(({ key }) => key),
    "meaning",
    "example",
  ];

  if (!supabase) {
    const filtered = sampleEntries.filter((entry) => {
      const matchesSearch =
        !normalizedSearch ||
        searchableFields.some((field) =>
          entry[field]?.toLowerCase().includes(normalizedSearch),
        );
      const matchesLanguage =
        language === "all" || entry[language]?.trim().length > 0;
      const matchesStatus =
        !status || (status === "draft" ? entry.status !== "published" : entry.status === status);
      const matchesMissing =
        missingField === "all" || !entry[missingField]?.trim();
      return matchesSearch && matchesLanguage && matchesStatus && matchesMissing;
    });
    const data = isPaginated
      ? filtered.slice((page - 1) * pageSize, page * pageSize)
      : filtered;
    return {
      data,
      count: filtered.length,
      error: null,
      local: true,
    };
  }

  const query = supabase
    .from("entries")
    .select("*", isPaginated ? { count: "exact" } : undefined);
  if (!admin) query.eq("status", "published");
  if (status) query.eq("status", status);
  if (missingField !== "all") query.is(missingField, null);
  if (language !== "all") query.not(language, "is", null).neq(language, "");
  if (normalizedSearch) {
    const safeSearch = normalizedSearch.replace(/[,%()]/g, " ");
    query.or(
      searchableFields
        .map((field) => `${field}.ilike.%${safeSearch}%`)
        .join(","),
    );
  }
  if (isPaginated) {
    query.range((page - 1) * pageSize, page * pageSize - 1);
  }
  const result = await query.order("created_at", { ascending: false });
  return { ...result, local: false };
}

export async function createEntry(entry) {
  const payload = cleanEntry(entry);
  payload.status = "draft";
  if (supabase) {
    payload.created_by = (await supabase.auth.getUser()).data.user?.id;
    payload.updated_by = payload.created_by;
  }
  if (!supabase)
    return {
      data: {
        ...payload,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      },
      error: null,
      local: true,
    };
  return {
    ...(await supabase.from("entries").insert(payload).select().single()),
    local: false,
  };
}

export async function updateEntry(id, entry) {
  const payload = cleanEntry(entry);
  if (!supabase)
    return {
      data: {
        ...payload,
        id,
        status: entry.status || "draft",
        created_at: new Date().toISOString(),
      },
      error: null,
      local: true,
    };
  payload.updated_by = (await supabase.auth.getUser()).data.user?.id;
  return {
    ...(await supabase
      .from("entries")
      .update(payload)
      .eq("id", id)
      .select()
      .single()),
    local: false,
  };
}

export async function publishEntry(id) {
  if (!supabase)
    return { data: null, error: new Error("Publishing requires Supabase.") };
  return supabase.rpc("publish_entry", { entry_id: id });
}

export async function deleteEntry(id) {
  if (!supabase) return { error: null, local: true };
  return {
    ...(await supabase.from("entries").delete().eq("id", id)),
    local: false,
  };
}
