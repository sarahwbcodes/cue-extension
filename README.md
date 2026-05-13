# Cue

An ambient research companion that lives in your browser. Set a goal, keep browsing — Cue quietly extracts relevant ideas from every page you visit and synthesizes them into a brainstorm on demand.

## Install

### 1. Get a Groq API key (free)
Sign up at [console.groq.com](https://console.groq.com) → API Keys → Create API Key.

### 2. Download the extension
Click **Code → Download ZIP** on this page, then unzip it.

### 3. Install dependencies and build
You'll need [Node.js](https://nodejs.org) installed.

```bash
cd cue-extension
npm install
npm run build
```

This creates a `build/chrome-mv3-prod/` folder.

### 4. Load into your browser

**Chrome**
1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `build/chrome-mv3-prod` folder

**Arc**
1. Go to `arc://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `build/chrome-mv3-prod` folder

### 5. Use it
1. Click the Cue icon in your toolbar
2. Type your goal (e.g. "build a fintech startup")
3. Enter your Groq API key
4. Browse normally — ideas accumulate silently
5. Hit **Brainstorm** when you're ready to synthesize
