# phone AI + Github: PWA GitHub Repo Editor with ChatGPT

一個部署在 **GitHub Pages** 的 PWA Web App，允許使用者：
- 使用 **GitHub Personal Access Token** 讀寫自己的 repo
- 使用 **OpenAI API Key** 與 ChatGPT 對話並修改 repo 內容
- 不需要後端伺服器，全部運行於瀏覽器端

## 功能
- **GitHub API**
  - 下載指定檔案內容
  - 更新檔案（commit 到指定分支）
- **OpenAI API**
  - 將檔案內容與修改指令傳給 AI
  - 接收 AI 修改後的檔案
- **PWA**
  - 可安裝到桌面（iPhone / Android）
  - 支援離線快取（UI 部分）

## 使用方式
1. 開啟應用頁面 `https://<your-username>.github.io/<repo-name>/`
2. 輸入：
   - **GitHub Personal Access Token**
     - 前往 [GitHub Token 生成頁面](https://github.com/settings/tokens/new)
     - 勾選 `repo` 權限
   - **OpenAI API Key**
     - 前往 [OpenAI API Key 生成頁面](https://platform.openai.com/api-keys)
3. 輸入 GitHub Repo 與檔案路徑
4. 下載檔案
5. 在「修改指令」欄位輸入想要的變更
6. 點擊「送出到 ChatGPT」讓 AI 修改檔案
7. 點擊「提交回 GitHub」將新檔案推送回 Repo

## 架構
