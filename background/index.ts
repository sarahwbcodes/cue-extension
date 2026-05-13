import { addIdeas, getSession, markProcessed, saveBrainstorm } from "~lib/storage"
import { brainstorm, extractIdeas } from "~lib/claude"


chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "PAGE_CONTENT") {
    handlePageContent(message).then(sendResponse).catch((err) => {
      console.error("Cue extract error:", err)
      sendResponse({ ok: false })
    })
    return true // keep channel open for async
  }

  if (message.type === "BRAINSTORM") {
    handleBrainstorm().then(sendResponse).catch((err) => {
      console.error("Cue brainstorm error:", err)
      sendResponse({ ok: false, error: err.message })
    })
    return true
  }
})

async function handlePageContent(message: {
  url: string
  title: string
  text: string
}) {
  const session = await getSession()
  if (!session) return { ok: false, reason: "no_session" }
  if (session.processedUrls.includes(message.url)) return { ok: false, reason: "already_processed" }

  const apiKey = await getApiKey()
  if (!apiKey) return { ok: false, reason: "no_api_key" }

  await markProcessed(message.url)

  const extracted = await extractIdeas(apiKey, session.context, message.title, message.text)
  if (extracted.length > 0) {
    await addIdeas(
      extracted.map((content) => ({
        content,
        source: message.url,
        pageTitle: message.title,
      }))
    )
  }

  return { ok: true, count: extracted.length }
}

async function handleBrainstorm() {
  const session = await getSession()
  if (!session || session.ideas.length === 0) return { ok: false, reason: "no_ideas" }

  const apiKey = await getApiKey()
  if (!apiKey) return { ok: false, reason: "no_api_key" }

  const result = await brainstorm(
    apiKey,
    session.context,
    session.ideas.map((i) => i.content)
  )
  await saveBrainstorm(result)
  return { ok: true, result }
}

async function getApiKey(): Promise<string | null> {
  const result = await chrome.storage.local.get("cue_api_key")
  return result.cue_api_key ?? null
}
