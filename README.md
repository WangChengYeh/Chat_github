# phone AI + GitHub  
Mobile-First Dual Fullscreen: AI CLI & Text Editor

A minimal, phone-friendly React PWA for editing GitHub repo files using an AI assistant. Designed for SMALL SCREENS: only two main views—AI CLI (chat / commands) and Fullscreen Text Editor (viewer + edit + diff toggle).

## 🚀 **[Launch PWA →](https://wangchengyeh.github.io/Chat_github/)**

**Quick Start:**
1. Click the link above to open the app
2. Type `/config` to set up your GitHub token and OpenAI API key  
3. Use `/open filename` to load files and start editing with AI assistance
4. Install as PWA: Look for "Add to Home Screen" (mobile) or install icon (desktop)

---
## 1. Quick Pitch
- 100% client-side (tokens stay local)
- Two fullscreen modes for focus & small device ergonomics
- Command-driven AI assisted editing
- Instant switch between reading, instructing, applying, committing
- Minimal network + minimal UI = faster on low storage / low RAM phones

---
## 2. Core Principles
| Principle | Description |
|-----------|-------------|
| Mobile First | No crowded panels; single-surface interactions |
| Two Modes | /editor and /cli (AI) only |
| Command Driven | Fast, predictable, scriptable habits |
| Full Replacement | AI returns FULL updated file (avoid merge confusion) |
| Stateless Backend | Pure GitHub + OpenAI APIs; no server owned by app |
| Minimal Persist | Only essentials (repo + model) optionally saved |

---
## 3. Fullscreen Modes
### A. AI CLI Mode
Scrollable history + bottom input bar. Plain text, low overhead.
- Interpret plain lines as AI instructions
- Slash-prefixed lines are commands (e.g. `/open`, `/commit`)
- Shows AI output and system notices

### B. Editor Mode
Fullscreen text area (or CodeMirror) with optional diff overlay.
- Status bar (top 1 line): branch | path | dirty flag | quick buttons
- Gestures (optional): swipe left/right to toggle CLI <-> Editor
- Diff toggle cycles: Original → Modified → Diff

---
## 4. Minimal Workflow (Example)
```
/open README.md
Refetched README.md (sha ...)
Add a security note about token scope.
AI proposes new file.
/apply
Review in editor (dirty*)
/commit "docs: add token scope note"
```
(Plain sentence = AI instruction. Use `/apply` only when satisfied.)

---
## 5. CLI Commands
| Command | Action |
|---------|--------|
| /open <path> | Fetch file (sets originalContent, clears AI draft) |
| /ai <instruction> | Same as plain text; request AI transform |
| /apply | Apply last AI proposal into editor (dirty=true) |
| /diff | Show diff (in CLI or switch editor diff mode) |
| /revert | Restore originalContent (dirty=false) |
| /commit "msg" | Commit current editor content to branch |
| /branch <name> | Switch/create branch (planned auto-create) |
| /model <id> | Switch LLM model config |
| /config | Open overlay to edit tokens / repo info |
| /save | Save current edited content locally (draft) |
| /tokens | Estimate token usage (optional) |
| /help | List commands |
| /editor | Switch to editor view |
| /cli | Switch to AI CLI view |
| /clear | Clear CLI history display only |

No-slash = AI transform of current file with that sentence as instruction.

---
## 6. Architecture (Slim)
```
React (Zustand Store)
  |-- UI Mode: cli | editor
  |-- Services: github.ts, ai.ts, diff.ts
  |-- store.file: { original, current, sha, dirty }
  |-- store.ai: { lastInstruction, lastAIContent, pending }
```
Data Flow:
1. /open → GET contents → decode → store.file.original/current
2. Instruction → build prompt → LLM → lastAIContent
3. /apply → current = lastAIContent (dirty flag)
4. /commit → PUT new base64 content with sha → update sha + dirty=false

---
## 7. Installation & Run
```
npm install
npm run dev
# or build
npm run build && npm run preview
```
GitHub Pages: set `vite.config.js` base to `'/Chat_github/'` then deploy `dist/`.

---
## 8. Configuration Overlay Fields
| Field | Notes |
|-------|------|
| GitHub Token | Fine-grained; content read/write only |
| OpenAI Key | Or compatible endpoint key |
| Owner / Repo | E.g. WangChengYeh / Chat_github |
| Branch | Default main (editable) |
| Path | Target file path e.g. src/index.ts |
| Model | e.g. gpt-4o-mini |
| Temperature | Default 0.3 |

---
## 9. Prompt Strategy (System Layer)
```
You rewrite the whole file based on the instruction. Return ONLY the full updated file with no explanations.
```
User prompt includes:
- Instruction
- Current file delimitation lines

---
## 10. Security Notes
| Topic | Note |
|-------|------|
| Token Storage | Keep in memory; optional opt-in localStorage |
| Principle of Least Privilege | Restrict PAT to specific repo if possible |
| LLM Exposure | Entire file sent; avoid secrets / credentials |
| No Backend | All JS visible—never embed real secret keys in source |
| Revocation | Revoke tokens after use |

---
## 11. Roadmap (Mobile-Focused)
- Offline commit queue (when network lost)
- Streaming AI output (progressive view)
- Inline quick diff chips (changed lines only)
- Lightweight file tree (:ls implemented fully)
- AI patch mode (generate diff instead full file) for big files
- Token budget estimator badge
- Multi-provider abstraction (Anthropic / Azure / Local) 

---
## 12. Troubleshooting
| Symptom | Cause | Fix |
|---------|-------|-----|
| 401 on /open | Bad token / scope | Regenerate PAT |
| 404 path | Wrong path / branch | Check /branch and path |
| 409 commit | Stale sha | /open again before /commit |
| Empty AI response | Model overloaded | Retry or shorten file |
| Diff mismatch | AI returned truncated file | Re-run with clearer prompt |

---
## 13. License
(Choose a license, e.g. MIT, and add LICENSE file.)

---
## 14. Example AI Instructions
- Add input validation for empty form submission.
- Convert callbacks to async/await; keep logic same.
- Insert concise comments in Traditional Chinese.
- Refactor to extract duplicate error handling into a helper.

---
## 15. Quick Start (Ultra Short)
```
/open README.md
Improve structure of sections about mobile UI.
/apply
/commit "docs: restructure mobile UI sections"
```

---
Happy mobile editing!  
Use /help anytime.