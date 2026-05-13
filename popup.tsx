import { useEffect, useState } from "react"
import type { IdeaEntry, Session } from "~lib/storage"

type View = "setup" | "garden" | "brainstorm"

const KEY = "cue_session"
const API_KEY = "cue_api_key"

export default function SidePanel() {
  const [view, setView] = useState<View>("setup")
  const [session, setSession] = useState<Session | null>(null)
  const [contextInput, setContextInput] = useState("")
  const [apiKeyInput, setApiKeyInput] = useState("")
  const [brainstorm, setBrainstorm] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"context" | "key">("context")

  useEffect(() => {
    chrome.storage.local.get([KEY, API_KEY]).then((r) => {
      const s: Session | null = r[KEY] ?? null
      if (s) {
        setSession(s)
        setBrainstorm(s.lastBrainstorm)
        setView(s.lastBrainstorm ? "brainstorm" : "garden")
      }
    })

    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes[KEY]) {
        const s: Session = changes[KEY].newValue
        setSession(s)
        setBrainstorm(s.lastBrainstorm)
        if (s.lastBrainstorm && loading) {
          setLoading(false)
          setView("brainstorm")
        }
      }
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [loading])

  async function handleStart() {
    if (!contextInput.trim() || !apiKeyInput.trim()) return
    setLoading(true)
    await chrome.storage.local.set({ [API_KEY]: apiKeyInput.trim() })
    const { initSession } = await import("~lib/storage")
    const s = await initSession(contextInput.trim())
    setSession(s)
    setView("garden")
    setLoading(false)
  }

  async function handleBrainstorm() {
    setLoading(true)
    chrome.runtime.sendMessage({ type: "BRAINSTORM" })
    // result comes via storage.onChanged listener above
  }

  async function handleReset() {
    const { clearSession } = await import("~lib/storage")
    await clearSession()
    setSession(null)
    setBrainstorm(null)
    setContextInput("")
    setApiKeyInput("")
    setStep("context")
    setView("setup")
  }

  if (view === "setup") {
    return (
      <div style={s.root}>
        <p style={s.wordmark}>Cue</p>

        {step === "context" ? (
          <>
            <p style={s.prompt}>What are you trying to figure out?</p>
            <textarea
              autoFocus
              rows={3}
              placeholder="Build a unicorn startup in fintech…"
              value={contextInput}
              onChange={(e) => setContextInput(e.target.value)}
              style={s.textarea}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && contextInput.trim()) {
                  e.preventDefault()
                  setStep("key")
                }
              }}
            />
            <button
              style={{ ...s.btn, opacity: contextInput.trim() ? 1 : 0.4 }}
              disabled={!contextInput.trim()}
              onClick={() => setStep("key")}
            >
              Continue
            </button>
          </>
        ) : (
          <>
            <p style={s.prompt}>Anthropic API key</p>
            <input
              autoFocus
              type="password"
              placeholder="gsk_…"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              style={s.input}
              onKeyDown={(e) => {
                if (e.key === "Enter" && apiKeyInput.trim()) handleStart()
              }}
            />
            <div style={s.row}>
              <button style={s.ghost} onClick={() => setStep("context")}>Back</button>
              <button
                style={{ ...s.btn, opacity: apiKeyInput.trim() ? 1 : 0.4 }}
                disabled={loading || !apiKeyInput.trim()}
                onClick={handleStart}
              >
                {loading ? "Starting…" : "Start"}
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  if (view === "garden" && session) {
    const ideas = [...(session.ideas ?? [])].reverse()
    return (
      <div style={s.root}>
        <div style={s.topBar}>
          <span style={s.pill}>{session.context}</span>
          <button style={s.ghost} onClick={handleReset}>Reset</button>
        </div>

        <div style={s.stat}>
          <span style={{ ...s.dot, background: "#22c55e" }} />
          {ideas.length} signal{ideas.length !== 1 ? "s" : ""} · {session.processedUrls.length} page{session.processedUrls.length !== 1 ? "s" : ""}
        </div>

        <div style={s.feed}>
          {ideas.length === 0 ? (
            <p style={s.empty}>Browsing… ideas will appear as you go.</p>
          ) : (
            ideas.map((idea: IdeaEntry) => (
              <div key={idea.id} style={s.item}>
                <p style={s.ideaText}>{idea.content}</p>
                <a href={idea.source} target="_blank" rel="noreferrer" style={s.src}>
                  {idea.pageTitle || idea.source}
                </a>
              </div>
            ))
          )}
        </div>

        {ideas.length > 0 && (
          <button onClick={handleBrainstorm} disabled={loading} style={s.btn}>
            {loading ? "Synthesizing…" : "Brainstorm"}
          </button>
        )}
      </div>
    )
  }

  if (view === "brainstorm" && brainstorm) {
    return (
      <div style={s.root}>
        <div style={s.topBar}>
          <span style={s.pill}>{session?.context}</span>
          <button style={s.ghost} onClick={handleReset}>Reset</button>
        </div>

        <div style={s.output}>
          <pre style={s.outputText}>{brainstorm}</pre>
        </div>

        <div style={s.row}>
          <button style={s.ghost} onClick={() => setView("garden")}>Signals</button>
          <button style={{ ...s.btn, opacity: loading ? 0.6 : 1 }} disabled={loading} onClick={handleBrainstorm}>
            {loading ? "Thinking…" : "Re-run"}
          </button>
        </div>
      </div>
    )
  }

  return null
}

const s: Record<string, React.CSSProperties> = {
  root:       { display: "flex", flexDirection: "column", gap: 14, padding: 20, fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#111", width: 360, minHeight: 200, boxSizing: "border-box" },
  wordmark:   { fontWeight: 700, fontSize: 22, letterSpacing: -1, margin: 0 },
  prompt:     { margin: 0, fontWeight: 600, fontSize: 15 },
  textarea:   { padding: 10, borderRadius: 8, border: "1px solid #e5e5e5", resize: "none", fontFamily: "inherit", fontSize: 13, lineHeight: 1.5, outline: "none" },
  input:      { padding: 10, borderRadius: 8, border: "1px solid #e5e5e5", fontFamily: "inherit", fontSize: 13, outline: "none" },
  btn:        { padding: "10px 16px", borderRadius: 8, background: "#111", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, transition: "opacity 0.15s" },
  ghost:      { padding: "10px 12px", borderRadius: 8, background: "none", color: "#666", border: "none", cursor: "pointer", fontSize: 13 },
  row:        { display: "flex", gap: 8, justifyContent: "flex-end" },
  topBar:     { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  pill:       { background: "#f3f3f3", borderRadius: 20, padding: "4px 10px", fontSize: 12, color: "#444", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  stat:       { display: "flex", alignItems: "center", gap: 6, color: "#666", fontSize: 12 },
  dot:        { width: 7, height: 7, borderRadius: "50%", display: "inline-block" },
  feed:       { display: "flex", flexDirection: "column", gap: 10, flex: 1, overflowY: "auto", maxHeight: 380 },
  item:       { display: "flex", flexDirection: "column", gap: 3 },
  ideaText:   { margin: 0, lineHeight: 1.5 },
  src:        { fontSize: 11, color: "#aaa", textDecoration: "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  empty:      { color: "#bbb", fontStyle: "italic", margin: 0 },
  output:     { flex: 1, overflowY: "auto", maxHeight: 480 },
  outputText: { margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit", lineHeight: 1.6, fontSize: 13 },
}
