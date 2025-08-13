# Phone AI + GitHub 📱🤖  
**Mobile-First Dual Fullscreen: AI CLI & Text Editor with Chinese Support**

A minimal, phone-friendly React PWA for editing GitHub repository files using AI assistance. Designed for SMALL SCREENS with only two main views—AI CLI (chat/commands) and Fullscreen Text Editor (viewer + edit + diff toggle). Fully supports Chinese text editing and AI instructions.

## 🚀 **[Launch PWA →](https://wangchengyeh.github.io/Chat_github/)**

### **Quick Start:**
1. **Launch**: Click the link above to open the app
2. **Setup**: Type `/config` to configure your GitHub token and OpenAI API key  
3. **Edit**: Use `/open filename` to load files and start AI-assisted editing
4. **Install**: Look for "Add to Home Screen" (mobile) or install icon (desktop)

---

## ✨ **Key Features**

### 🎯 **Core Capabilities**
- **100% Client-Side**: No server required, tokens stay local
- **PWA Ready**: Installable as native app with offline capabilities
- **Mobile-Optimized**: Touch-friendly interface for small screens
- **Command-Driven**: Fast `/command` syntax for power users
- **AI-Powered**: Transform files with natural language instructions
- **Real-Time Sync**: Direct GitHub API integration for immediate commits

### 🌏 **Chinese Language Support**
- **Full CJK Support**: Traditional & Simplified Chinese text rendering
- **Chinese Fonts**: PingFang SC, Hiragino Sans GB, Microsoft YaHei
- **Bilingual Interface**: Chinese + English prompts and help text
- **IME Compatible**: Proper input method support for Chinese typing
- **AI Instructions**: Give commands in Chinese: "添加中文註解到這個函數"

### 🔧 **Technical Features**
- **Syntax Highlighting**: JavaScript, TypeScript, Markdown, JSON
- **Diff Viewer**: Visual comparison with Original → Modified → Diff modes
- **Live Preview**: Real-time file editing with CodeMirror
- **Smart Commits**: Automated git operations with proper SHA handling
- **Token Security**: Optional localStorage with clear privacy controls

---

## 🏗️ **Architecture & Design**

### **Two-Mode Interface**
| Mode | Purpose | Features |
|------|---------|----------|
| **CLI Mode** | AI interaction & commands | Scrollable history, command parsing, AI responses |
| **Editor Mode** | File editing & review | Syntax highlighting, diff view, status bar |

### **Core Principles**
| Principle | Implementation |
|-----------|----------------|
| **Mobile First** | Single-surface interactions, touch-optimized UI |
| **Command Driven** | `/command` syntax for all operations |
| **Full Replacement** | AI returns complete updated files (no merging) |
| **Stateless Backend** | Pure GitHub + OpenAI APIs, no proprietary server |
| **Privacy Focused** | Local token storage, client-side processing |

### **Data Flow**
```
1. /open file.md → GitHub API → Load content into editor
2. "Add comments" → OpenAI API → Generate updated content  
3. /apply → Replace editor content → Mark as dirty
4. /commit "msg" → GitHub API → Save with new SHA
```

---

## 💻 **Command Reference**

### **File Operations**
| Command | Description | Example |
|---------|-------------|---------|
| `/open <path>` | Load file from GitHub | `/open src/App.tsx` |
| `/save` | Save draft to localStorage | `/save` |
| `/revert` | Restore to original content | `/revert` |

### **AI Operations**
| Command | Description | Example |
|---------|-------------|---------|
| `plain text` | AI instruction (no prefix) | `Add error handling to this function` |
| `/apply` | Apply AI changes to editor | `/apply` |
| `/ai <instruction>` | Explicit AI command | `/ai Refactor using async/await` |

### **Git Operations**
| Command | Description | Example |
|---------|-------------|---------|
| `/commit "message"` | Commit current content | `/commit "feat: add validation"` |
| `/diff` | Show differences | `/diff` |
| `/branch <name>` | Switch branch | `/branch feature/new-ui` |

### **System Commands**
| Command | Description | Example |
|---------|-------------|---------|
| `/config` | Open settings overlay | `/config` |
| `/help` | Show all commands | `/help` |
| `/editor` | Switch to editor mode | `/editor` |
| `/cli` | Switch to CLI mode | `/cli` |
| `/clear` | Clear command history | `/clear` |
| `/tokens` | Estimate token usage | `/tokens` |

---

## 🚀 **Deployment & Installation**

### **Web Access**
- **Live URL**: https://wangchengyeh.github.io/Chat_github/
- **GitHub Pages**: Auto-deployed from main branch
- **HTTPS Required**: For PWA and clipboard features

### **PWA Installation**
#### **Mobile (iOS/Android)**
1. Open URL in Safari/Chrome
2. Tap "Add to Home Screen" 
3. Confirm installation
4. Launch from home screen

#### **Desktop (Chrome/Edge)**
1. Visit URL in browser
2. Click install icon (⊕) in address bar
3. Click "Install Chat GitHub"
4. App opens in dedicated window

### **Self-Hosting**
```bash
git clone https://github.com/WangChengYeh/Chat_github.git
cd Chat_github
npm install
npm run build
# Deploy dist/ folder to your hosting provider
```

---

## 🔐 **Security & Configuration**

### **Required Tokens**
| Token Type | Permissions | Usage |
|------------|-------------|-------|
| **GitHub PAT** | `contents:write` | Read/write repository files |
| **OpenAI API** | Standard access | AI text transformations |

### **Privacy Controls**
- **Memory Only**: Tokens stored in RAM by default
- **Optional Persistence**: User-controlled localStorage saving
- **No Server**: All processing happens in your browser
- **Token Scoping**: Use fine-grained GitHub tokens when possible

### **Configuration Fields**
```javascript
{
  githubToken: "ghp_...",     // GitHub Personal Access Token
  openaiKey: "sk-...",        // OpenAI API Key  
  owner: "username",          // GitHub username/org
  repo: "repository",         // Repository name
  branch: "main",             // Target branch
  model: "gpt-4o-mini",       // AI model selection
  temperature: 0.3            // AI creativity (0-2)
}
```

---

## 🛠️ **Development**

### **Tech Stack**
- **Frontend**: React 18 + TypeScript + Vite
- **State**: Zustand for lightweight state management
- **Editor**: CodeMirror 6 with language support
- **PWA**: Vite PWA plugin with service worker
- **Styling**: CSS with mobile-first responsive design
- **APIs**: GitHub REST API + OpenAI Chat Completions

### **Local Development**
```bash
npm install          # Install dependencies
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
npm run lint        # Check code quality
```

### **Project Structure**
```
src/
├── components/
│   ├── CLI.tsx           # Command interface
│   ├── Editor.tsx        # Code editor with diff
│   └── ConfigOverlay.tsx # Settings modal
├── services/
│   ├── github.ts         # GitHub API integration
│   ├── ai.ts            # OpenAI API integration  
│   └── diff.ts          # Text comparison utilities
├── store.ts             # Zustand state management
├── App.tsx              # Main application
└── App.css              # Responsive styling
```

---

## 🌟 **Example Workflows**

### **Basic File Editing**
```bash
/config                              # Setup tokens
/open README.md                      # Load file
Add installation instructions        # AI instruction
/apply                              # Apply changes
/editor                             # Review in editor
/commit "docs: add installation"    # Save changes
```

### **Code Refactoring**
```bash
/open src/utils.js                  # Load JavaScript file
Convert to TypeScript with types    # AI instruction
/apply                             # Apply transformation
/diff                              # Review changes
/commit "refactor: convert to TS"  # Commit changes
```

### **Chinese Development**
```bash
/config                            # 設定 tokens
/open 文件.md                      # 載入中文檔案
為這個專案添加中文說明              # 中文AI指令
/apply                            # 套用變更
/commit "docs: 添加中文說明"        # 提交變更
```

---

## 🐛 **Troubleshooting**

### **Common Issues**
| Symptom | Cause | Solution |
|---------|-------|----------|
| 401 on `/open` | Invalid GitHub token | Regenerate PAT with `contents:write` |
| 404 file not found | Wrong path/branch | Check `/branch` and file path |
| 409 commit conflict | Stale SHA | Run `/open` again before `/commit` |
| Empty AI response | Model overloaded | Retry with shorter content |
| Chinese not showing | Font issues | Update browser or check font support |

### **Browser Support**
- **Recommended**: Chrome 90+, Safari 14+, Edge 90+
- **PWA Features**: Requires modern browser with service worker support
- **Chinese Fonts**: Best on macOS/iOS (PingFang), Windows (Microsoft YaHei)

---

## 🔮 **Roadmap**

### **v1.1 - Enhanced Mobile**
- [ ] Offline commit queue
- [ ] Streaming AI responses
- [ ] Gesture navigation
- [ ] File tree browser

### **v1.2 - Advanced Features**
- [ ] Multi-file editing
- [ ] AI patch mode (diffs only)
- [ ] Branch management UI
- [ ] Collaborative editing

### **v1.3 - Extensibility**
- [ ] Multiple AI providers (Anthropic, Azure)
- [ ] Custom prompts/templates
- [ ] Plugin system
- [ ] Local LLM support

---

## 📄 **License**

MIT License - Feel free to use this for personal or commercial projects.

---

## 🙏 **Contributing**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

**Happy mobile coding! 📱✨**  
Use `/help` in the app for quick command reference.