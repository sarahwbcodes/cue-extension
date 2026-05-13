const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

const EXTRACT_SYSTEM = `You are an idea-extraction assistant. The user has initialized a research context (a goal or topic they care about).
Given a web page's content, extract any ideas, signals, patterns, or insights that are meaningfully relevant to that context.
Return a JSON array of objects, each with a "content" field (1-2 sentences, specific and actionable).
If nothing on the page is relevant, return an empty array [].
Only return the JSON array — no prose, no markdown code fences.`

const BRAINSTORM_SYSTEM = `You are a creative strategist. The user has been browsing the web with a specific goal in mind.
They have accumulated a set of signals and ideas from their browsing session.
Your job: synthesize these into a rich brainstorm — patterns, opportunities, concrete next steps, contrarian takes, and questions worth exploring.
Be specific, not generic. Reference the actual signals where relevant. Use a structured format with short headers.`

async function callGroq(apiKey: string, model: string, system: string, userContent: string, maxTokens: number): Promise<string> {
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
    }),
  })

  if (!response.ok) throw new Error(`Groq API error: ${response.status}`)
  const data = await response.json()
  return data.choices[0].message.content.trim()
}

export async function extractIdeas(
  apiKey: string,
  context: string,
  pageTitle: string,
  pageText: string
): Promise<string[]> {
  const text = await callGroq(
    apiKey,
    "llama-3.1-8b-instant",
    EXTRACT_SYSTEM,
    `Context: ${context}\n\nPage title: ${pageTitle}\n\nPage content (truncated):\n${pageText.slice(0, 4000)}`,
    512
  )

  try {
    const parsed = JSON.parse(text)
    return Array.isArray(parsed) ? parsed.map((item: { content: string }) => item.content).filter(Boolean) : []
  } catch {
    return []
  }
}

export async function brainstorm(
  apiKey: string,
  context: string,
  ideas: string[]
): Promise<string> {
  const signals = ideas.map((idea, i) => `${i + 1}. ${idea}`).join("\n")

  return callGroq(
    apiKey,
    "llama-3.3-70b-versatile",
    BRAINSTORM_SYSTEM,
    `Goal: ${context}\n\nSignals gathered from browsing:\n${signals}`,
    1024
  )
}
