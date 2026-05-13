export interface IdeaEntry {
  id: string
  source: string
  pageTitle: string
  content: string
  timestamp: number
}

export interface Session {
  context: string
  ideas: IdeaEntry[]
  lastBrainstorm: string | null
  processedUrls: string[]
}

const SESSION_KEY = "cue_session"

export async function getSession(): Promise<Session | null> {
  const result = await chrome.storage.local.get(SESSION_KEY)
  return result[SESSION_KEY] ?? null
}

export async function initSession(context: string): Promise<Session> {
  const session: Session = {
    context,
    ideas: [],
    lastBrainstorm: null,
    processedUrls: [],
  }
  await chrome.storage.local.set({ [SESSION_KEY]: session })
  return session
}

export async function addIdeas(newIdeas: Omit<IdeaEntry, "id" | "timestamp">[]): Promise<void> {
  const session = await getSession()
  if (!session) return
  const entries: IdeaEntry[] = newIdeas.map((idea) => ({
    ...idea,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  }))
  session.ideas = [...session.ideas, ...entries]
  await chrome.storage.local.set({ [SESSION_KEY]: session })
}

export async function markProcessed(url: string): Promise<void> {
  const session = await getSession()
  if (!session) return
  if (!session.processedUrls.includes(url)) {
    session.processedUrls.push(url)
    await chrome.storage.local.set({ [SESSION_KEY]: session })
  }
}

export async function saveBrainstorm(content: string): Promise<void> {
  const session = await getSession()
  if (!session) return
  session.lastBrainstorm = content
  await chrome.storage.local.set({ [SESSION_KEY]: session })
}

export async function clearSession(): Promise<void> {
  await chrome.storage.local.remove(SESSION_KEY)
}
