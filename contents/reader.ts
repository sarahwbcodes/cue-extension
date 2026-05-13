import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_idle",
}

function extractPageText(): string {
  const clone = document.body?.cloneNode(true) as HTMLElement
  if (!clone) return ""
  clone.querySelectorAll("nav, footer, header, script, style, noscript, aside").forEach((el) => el.remove())
  return clone.innerText.replace(/\s+/g, " ").trim()
}

async function run() {
  // Only run on real pages, skip extension pages and blank tabs
  if (!document.body || document.title === "New Tab") return
  const url = window.location.href
  if (url.startsWith("chrome://") || url.startsWith("chrome-extension://")) return

  const text = extractPageText()
  if (text.length < 200) return // skip thin pages

  chrome.runtime.sendMessage({
    type: "PAGE_CONTENT",
    url,
    title: document.title,
    text,
  })
}

run()
