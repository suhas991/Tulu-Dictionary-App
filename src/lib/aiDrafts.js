export async function generateDraftSuggestion(existingEnglish) {
  const groqApiKey = import.meta.env.VITE_GROQ_API_KEY

  const systemPrompt = `You are an Everyday English Vocabulary Assistant.
Generate exactly one common everyday English word or natural phrase for beginner or intermediate learners.
Prefer practical words used at home, with family and friends, while shopping, travelling, at school, at work, or in daily conversations.
Avoid advanced, academic, literary, rare, or overly formal vocabulary. Do not provide translations.
Write the meaning as one simple English sentence.
Return ONLY one valid JSON object with exactly these keys and no markdown, explanation, or code fence:
{"english":"word or phrase","meaning":"one simple sentence"}`

  function normalizeWord(value) {
    return value.toLowerCase().trim().replace(/[^a-z0-9\s']/g, '').replace(/\s+/g, ' ')
  }

  function parseSuggestion(content, excluded) {
    if (Array.isArray(content)) {
      const text = content.map((part) => typeof part === 'string' ? part : part?.text || '').join('')
      return parseSuggestion(text, excluded)
    }
    if (content && typeof content === 'object') {
      const objectContent = content
      const english = objectContent.english || objectContent.word || objectContent.phrase
      const meaning = objectContent.meaning || objectContent.definition
      if (typeof english === 'string' && typeof meaning === 'string') {
        const normalizedEnglish = english.trim()
        const normalizedMeaning = meaning.trim()
        if (normalizedEnglish.length >= 2 && normalizedEnglish.length <= 80 && normalizedMeaning.length >= 5 && normalizedMeaning.length <= 240 && !excluded.has(normalizeWord(normalizedEnglish))) {
          return { english: normalizedEnglish, meaning: normalizedMeaning }
        }
      }
      return null
    }
    if (typeof content !== 'string') return null
    const cleaned = content.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
    const jsonText = cleaned.match(/\{[\s\S]*\}/)?.[0]
    if (!jsonText) return null
    try {
      const result = JSON.parse(jsonText)
      return parseSuggestion(result, excluded)
    } catch {
      const englishMatch = cleaned.match(/"english"\s*:\s*"([^"\n]+)"/i)
      const meaningMatch = cleaned.match(/"meaning"\s*:\s*"([^"\n]+)"/i)
      if (!englishMatch || !meaningMatch) return null
      const english = englishMatch[1].trim()
      const meaning = meaningMatch[1].trim()
      if (english.length < 2 || english.length > 80 || meaning.length < 5 || meaning.length > 240 || excluded.has(normalizeWord(english))) return null
      return { english, meaning }
    }
  }

  if (!groqApiKey) return { data: null, error: new Error('VITE_GROQ_API_KEY is not configured.') }
  const excluded = new Set(existingEnglish.filter(Boolean).map(normalizeWord))
  const exclusionText = existingEnglish.length
    ? `Do not use any of these existing English words or phrases: ${existingEnglish.join(', ')}.`
    : 'There are no existing words to exclude.'
  let lastError = 'The AI returned an invalid or duplicate suggestion.'

  for (const model of ['openai/gpt-oss-120b', 'openai/gpt-oss-20b']) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            temperature: 0.7,
            reasoning_effort: 'low',
            max_completion_tokens: 512,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `${exclusionText}\nChoose a word that is definitely not in the list. Generate one new word now. Output only the JSON object.` },
            ],
          }),
        })
        const payload = await response.json().catch(() => null)
        if (!response.ok) {
          lastError = payload?.error?.message || `The ${model} model could not generate a suggestion.`
          break
        }
        const message = payload?.choices?.[0]?.message
        const suggestion = parseSuggestion(message?.content || message?.reasoning || payload?.choices?.[0]?.text, excluded)
        if (suggestion) return { data: suggestion, error: null }
        lastError = `The ${model} model returned invalid JSON or a duplicate word.`
      } catch {
        lastError = 'Could not reach the Groq API.'
        break
      }
    }
  }
  return { data: null, error: new Error(lastError) }
}

export async function generateMeaningSuggestion(english, signal) {
  const groqApiKey = import.meta.env.VITE_GROQ_API_KEY
  if (!groqApiKey) return { data: null, error: new Error('VITE_GROQ_API_KEY is not configured.') }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        temperature: 0.2,
        reasoning_effort: 'low',
        max_completion_tokens: 160,
        messages: [
          {
            role: 'system',
            content: 'You define English words and phrases for language learners. Return only valid JSON in this exact shape: {"meaning":"one simple English sentence"}. Do not add markdown or commentary.',
          },
          { role: 'user', content: `Give a simple everyday meaning for: ${english.trim()}` },
        ],
      }),
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok) return { data: null, error: new Error(payload?.error?.message || 'The AI meaning lookup failed.') }

    const content = payload?.choices?.[0]?.message?.content || ''
    const jsonText = content.replace(/```(?:json)?/gi, '').replace(/```/g, '').match(/\{[\s\S]*\}/)?.[0]
    const meaning = jsonText ? JSON.parse(jsonText).meaning : ''
    if (typeof meaning !== 'string' || meaning.trim().length < 5) {
      return { data: null, error: new Error('The AI returned an invalid meaning.') }
    }
    return { data: { meaning: meaning.trim() }, error: null }
  } catch (error) {
    if (error?.name === 'AbortError') return { data: null, error: { code: 'aborted' } }
    return { data: null, error: error instanceof SyntaxError ? new Error('The AI returned invalid JSON.') : new Error('Could not reach the AI meaning lookup.') }
  }
}
