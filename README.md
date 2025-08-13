# phone AI + GitHub  
PWA GitHub Repo Editor with OpenAI (Pure Client-Side)

A fully client‑side Progressive Web App (PWA) deployed on GitHub Pages enabling you to:
- Read and write files in your own GitHub repositories using a Personal Access Token (classic or fine‑grained)
- Use an LLM (OpenAI API or compatible endpoint) to transform or generate file content
- Commit the AI‑modified file back to a selected branch
- Operate entirely in the browser (no backend, no proxy); tokens stay local
- Install on mobile (iOS / Android) or desktop with offline UI shell

---

## 1. Overview of Features

### GitHub Integration
- Fetch file content (GET /repos/{owner}/{repo}/contents/{path})
- Create or update files (PUT /contents)
- Create new files or delete (optional)
- Optional: create new branch via refs API
- Custom branch & commit message
- Displays commit result (SHA + link)

### AI / LLM
- Builds a prompt from: system template + user instruction + current file content
- Receives full modified file (recommended) or future diff mode
- Adjustable model parameters (model name, temperature, max tokens—if implemented)
- Encourages “return only the full modified file” to minimize parsing ambiguity

### PWA
- Installable on iOS / Android / Desktop (Add to Home Screen)
- Service Worker caches static assets → offline UI shell
- App Manifest (name, icons, theme colors)
- Runs offline for interface; network required for API operations

### UX Utilities
- Text / code editor (raw textarea or enhanced editor lib if used)
- Diff preview (implemented or planned)
- Local persistence of last repo / path / model settings
- Light / dark theme (if implemented)
- Basic change status (unsaved modifications indicator)

---

## 2. Typical Workflow
1. Enter GitHub Token + OpenAI (or compatible) API Key
2. Specify owner / repo / branch / file path
3. Fetch file → populate editor
4. Write a natural language modification instruction
5. Send to AI → receive modified content
6. (Optional) View diff
7. Provide commit message
8. Commit back to GitHub
9. Inspect commit link for verification
10. Repeat iterative refinement as needed

---

## 3. Architecture

Pure Frontend (Browser) ↔ GitHub REST API  
Pure Frontend (Browser) ↔ OpenAI / LLM API  

```
+-------------------------------+
|            UI Layer           |
| (Forms / Editor / AI Output)  |
+-----------------+-------------+
                  |
                  v
+-------------------------------+
|   App State & Logic           |
| (File content / edits / cfg)  |
+---------+---------------------+
          |             |
          v             v
+---------------+   +------------------+
| GitHub REST   |   | OpenAI / LLM API |
+---------------+   +------------------+
```

---

## 4. Data Flow
1. Fetch file → Base64 decode → editor
2. Build AI prompt (system + instruction + file)
3. Send prompt → AI returns new file text
4. (Optional) Generate diff for review
5. Retrieve/confirm latest file SHA
6. Commit updated Base64 content via PUT
7. Show commit confirmation (SHA / link)

---

## 5. Suggested Directory Structure (Adjust as Needed)
```
/
├─ index.html
├─ src/
│  ├─ main.js (or main.ts)
│  ├─ ui/
│  │  ├─ form.js
│  │  ├─ editor.js
│  │  └─ diff.js
│  ├─ services/
│  │  ├─ github.js
│  │  ├─ openai.js
│  │  └─ storage.js
│  ├─ pwa/
│  │  ├─ sw.js
│  │  └─ manifest.json
│  └─ utils/
│     ├─ base64.js
│     └─ diff.js
├─ assets/
│  ├─ icons/
│  └─ styles.css
├─ README.md
└─ LICENSE
```

---

## 6. Tech Stack (Replace with Actual Choices)
| Concern    | Example Options |
| ---------- | ----------------|
| Framework  | Vanilla JS / React / Vue / Svelte / None |
| Editor     | CodeMirror / Monaco / Plain textarea |
| Network    | fetch API |
| Build Tool | None / Vite |
| Styling    | CSS / Tailwind |
| LLM Client | OpenAI REST (/v1/chat/completions or /v1/responses) |
| Storage    | memory + localStorage (optional) |
| PWA        | Service Worker + Manifest |

Add exact library names & versions here once finalized.

---

## 7. Deployment (GitHub Pages)
1. Fork or clone repository
2. Push code to `main`
3. Repository Settings → Pages → Source = GitHub Actions or `main` (root)
4. Access: `https://<username>.github.io/<repo-name>/`

If using a build step:
```
npm install
npm run build   # outputs /dist
```
Deploy `/dist` to Pages.

---

## 8. Local Usage
Static (no bundler):
- Open `index.html` via a local server (avoid file:// CORS issues).  
For example:
```
npx serve .
# or
python -m http.server 5173
```

Bundled (example):
```
npm install
npm run dev
npm run build
```

---

## 9. UI Sections
- Credentials Panel: GitHub Token, OpenAI Key
- Repository Panel: owner, repo, branch, file path
- File Editor: current file content (editable)
- Instruction Box: natural language change request
- Model Settings: model, temperature, max tokens (if supported)
- AI Result / Diff Panel
- Commit Panel: commit message + action button
- Status / Logs: API responses, errors

---

## 10. Security Considerations
| Aspect | Note |
| ------ | ---- |
| Token Handling | Prefer in-memory; localStorage only if user opts in |
| Scope Minimization | Use fine-grained token restricted to repo contents |
| HTTPS | GitHub Pages provides TLS by default |
| Sensitive Data | Do not process secrets or confidential code with external LLM |
| Source Transparency | All logic visible—never embed private keys in code |
| Revocation | Revoke tokens after testing if not needed long-term |

---

## 11. FAQ
Q: Commit fails with 401/403?  
A: Token invalid or insufficient scope.

Q: 404 on fetch?  
A: Wrong owner/repo/branch/path or file missing.

Q: AI returns explanations mixed with code?  
A: Adjust instruction: “Return ONLY the full modified file content—no commentary.”

Q: Diff not appearing?  
A: Feature may be planned; currently full replacement view.

Q: Offline operation?  
A: UI loads offline; API interactions require network.

---

## 12. Troubleshooting
| Symptom | Likely Cause | Resolution |
| ------- | ------------ | ---------- |
| 401 Unauthorized | Token expired / wrong scopes | Regenerate token |
| 404 Not Found | Path / repo / branch typo | Verify inputs |
| 409 Conflict | Stale file SHA | Refetch file & retry |
| AI Timeout | Network or model latency | Retry / reduce file size |
| PWA Not Installable | Missing manifest / SW not registered | Check deployment logs |
| Blank AI Result | Model error / prompt too large | Shorten file or summarize |

---

## 13. Roadmap
- Batch multi-file modifications
- Automatic branch creation + Pull Request flow
- Inline diff & merge editor
- WebCrypto-based token obfuscation
- Multi-provider LLM abstraction
- Prompt template management
- Large-file summarization / chunk strategy
- i18n (English + others)
- File tree explorer
- Rate limit / usage indicators

---

## 14. Contribution Guide
1. Fork repository
2. Create feature branch: `feat/<name>`
3. Implement changes + update docs
4. (Optional) add tests / lint
5. Open Pull Request with rationale & test steps
6. Address review feedback

Suggested Conventional Commit prefixes:
```
feat: add X
fix: correct Y
docs: update Z
refactor: restructure (no behavior change)
perf: optimize A
test: add coverage
chore: tooling / deps
```

---

## 15. License
Specify license (e.g., MIT) and include a `LICENSE` file.

---

## 16. Prompt Examples
- Add validation: if input is empty, show an error. Return only the complete updated file.
- Convert callbacks to async/await; preserve logic; output full file.
- Insert explanatory comments (English) without altering behavior.

---

## 17. Disclaimer
This is an educational / personal productivity tool. Avoid using it with repositories containing sensitive or proprietary data. You are responsible for compliance with your organization’s security policies.

---

## 18. Quick Start (Condensed)
1. Open deployed URL
2. Enter GitHub token + OpenAI key
3. Set repo parameters (owner / repo / branch / path)
4. Fetch file
5. Describe desired change
6. Send to AI
7. Review result (diff if available)
8. Commit with message
9. Verify on GitHub

---

Happy building—PRs and issues welcome!