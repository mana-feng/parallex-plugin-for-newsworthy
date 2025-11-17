# 📰 Newsworthy Editor

An immersive long-form multimedia article editor for creating visually rich, scrollable web stories. Design magazine-quality articles with sections, text, images, and videos, then publish directly to GitHub Pages.

> **中文文档**: 查看 [README-CN.md](README-CN.md) 获取完整的中文使用指南
> 
> **📚 Full Documentation**: See [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) for comprehensive technical documentation including API endpoints, architecture details, and developer guide.

---

## 📋 Table of Contents

1. [Quick Start](#-quick-start)
2. [Features](#-features)
3. [How to Use](#-how-to-use)
4. [Server Management](#-server-management)
5. [FAQ](#-faq)
6. [Troubleshooting](#-troubleshooting)
7. [Best Practices](#-best-practices)

---

## ✨ Features

- 🎨 **Section-Based Design** - Build articles with multiple customizable sections
- 📝 **Rich Text Editing** - TipTap editor with advanced formatting (headings, colors, drop caps)
- 🖼️ **Flexible Image Layouts** - Normal, full-width, or floating images with captions
- 🎬 **YouTube Integration** - Embed videos that work in exported HTML files
- 🌄 **Background Images** - Add parallax-like effects with section backgrounds
- 💾 **Dual Storage** - Local SQLite database + GitHub Pages integration
- 👁️ **Live Preview** - See exactly how your article will look
- 🚀 **One-Click Publishing** - Deploy to GitHub Pages instantly
- 🔒 **Secure** - AES-256 encrypted token storage

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v20.19.0+ or v22.12.0+
- **npm**: v10.9.2+
- **GitHub Account** (for publishing content)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd capstone-project-25t3-9900-h18e-almond-main
```

2. **Install dependencies**
```bash
# Install frontend dependencies
cd "Newsworthy Editor"
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### Starting the Application

#### Windows Users
Double-click the `start-servers.bat` file in the project root to automatically start both services.

#### macOS/Linux Users
```bash
chmod +x start-servers.sh
./start-servers.sh
```

#### Stopping the Servers

If you need to stop all running servers (useful when ports are already in use):

**Windows:**
```batch
# Double-click stop-servers.bat
# Or run in terminal:
stop-servers.bat
```

**macOS/Linux/Git Bash:**
```bash
chmod +x stop-servers.sh
./stop-servers.sh
```

The stop script will automatically find and terminate processes using ports:
- `5173` - Frontend Vite Dev Server
- `5174` - Frontend HMR
- `3001` - Backend API Server

#### Manual Start

**Option 1: Two Terminals (Recommended)**

Terminal 1 - Frontend:
```bash
cd "Newsworthy Editor"
npm run dev
```

Terminal 2 - Backend:
```bash
cd "Newsworthy Editor/backend"
npm start
```

**Option 2: PowerShell (Windows)**
```powershell
# Frontend
cd "Newsworthy Editor"; npm run dev

# In another terminal/window
cd "Newsworthy Editor\backend"; npm start
```

**Option 3: Bash (macOS/Linux)**
```bash
# Frontend
cd "Newsworthy Editor" && npm run dev

# In another terminal
cd "Newsworthy Editor/backend" && npm start
```

Once started successfully:
- **Frontend**: http://localhost:5173 (or 5174 if 5173 is in use)
- **Backend**: http://localhost:3001

---

## ⚙️ Initial Configuration

### Step 1: Configure GitHub Settings

1. **Open Settings Panel**
   - Click the **⚙️ Settings** button in the sidebar

2. **Get GitHub Personal Access Token**
   - Visit https://github.com/settings/tokens
   - Click **Generate new token (classic)**
   - Select permissions:
     - ✅ `repo` (Full repository access)
     - ✅ `workflow` (Optional, for triggering GitHub Actions)
   - Click **Generate token**
   - **Copy the token immediately** (shown only once)

3. **Fill in Settings**
   ```
   GitHub Token: ghp_xxxxxxxxxxxxxxxxxxxx (the token you just copied)
   GitHub Username: your-username
   Repository Name: your-repo-name
   Branch: main (or gh-pages)
   Base URL: https://your-username.github.io/your-repo-name
   ```

4. **Test Connection**
   - Click the **Test Connection** button
   - Confirm "✅ Connection successful" is displayed

5. **Save Configuration**
   - Click **Save Settings**

### Step 2: Enable GitHub Pages

1. Visit your GitHub repository
2. Go to **Settings** → **Pages**
3. Configure:
   - **Source**: Deploy from a branch
   - **Branch**: `main` (or your configured branch)
   - **Folder**: `/ (root)`
4. Click **Save**

Configuration complete! 🎉

---

## 📝 How to Use

### 🏗️ Building Your Article

#### 1. Create Sections
- Click **+ Add New Section** in the sidebar
- Sections are the building blocks of your article
- Each section can have:
  - Custom background (solid color or image)
  - Custom height
  - Multiple content blocks

#### 2. Section Settings
Click on any section to customize:
- **Background Type**: Choose color or image
- **Background Color**: Pick from color palette
- **Background Image**: Upload image for parallax effects
- **Height**: Adjust section height in pixels

#### 3. Add Content Blocks

**Text Block** 📝
- Click **+ Add Text Block**
- Rich text editor with formatting options:
  - Headings (H1-H6)
  - Bold, Italic, alignment
  - Text color and font size
  - Drop cap effects
  - Custom text width (for readability)

**Image Block** 🖼️
- Click **+ Add Image Block**
- Choose image type:
  - **Normal**: Standard image with caption
  - **Full Width**: Spans entire section width
  - **Float & Text**: Image with text wrapping around it
- Add images via URL or upload
- Customize:
  - Width and height
  - Caption position (below/right/bubble)
  - Caption animation
  - Aspect ratio lock

**Video Block** 🎬
- Click **+ Add Video Block**
- Paste YouTube URL (supports multiple formats)
- Video embeds directly in article
- Smart export: works in downloaded HTML files

---

### 🎨 Content Editing

#### Text Formatting
Select text in any text block to access:
- **Font Size**: Change text size
- **Text Color**: Choose from color picker
- **Alignment**: Left/Center alignment
- **Drop Cap**: Create magazine-style first letter
- **Text Width**: Control line length for readability

#### Image Customization
Select any image block to adjust:
- Dimensions (width × height)
- Caption text and position
- Aspect ratio preservation
- Float direction (for float-image type)

#### Video Settings
Select video block to modify:
- Video dimensions
- YouTube video ID

---

### 💾 Saving & Publishing

#### Save to GitHub Pages 🚀
1. Click **🚀 Save to GitHub Pages** in sidebar
2. Enter filename (e.g., `my-article.html`)
3. Confirm to publish
4. Article appears at: `https://[username].github.io/[repo]/[filename].html`

#### Storage Manager 📚
Manage all your articles:
- **View all saved articles**
- **Load** previous work
- **Rename** articles
- **Delete** unwanted articles
- **Pull from GitHub** to sync remote content

---

### 👁️ Preview & Export

#### Live Preview
- Click **Preview** button in header
- See exactly how your article will look
- Press `ESC` to exit preview

#### Export Features
- Articles export as standalone HTML files
- Includes all styling and content
- YouTube videos work offline (smart fallback)
- See `HOW_TO_VIEW_EXPORTED_HTML.md` for details

---

## 🎯 Key Capabilities

### Section Customization
- **Background Type**: Solid colors or images
- **Custom Heights**: Control section dimensions
- **Visual Separation**: Each section is distinct and customizable
- **Unlimited Sections**: Build articles as long as you need

### Advanced Text Features
- **Rich Formatting**: Bold, italic, headings (H1-H6)
- **Typography Control**: Font size, text color, font family
- **Drop Caps**: Magazine-style first letter effects
- **Text Width Control**: Adjust line length (measured in `ch` units)
- **Alignment**: Left and center text alignment

### Image Block Types

**1. Normal Image Block**
- Standard images with flexible sizing
- Multiple caption positions (below/right/bubble)
- Animated caption effects
- Aspect ratio lock option

**2. Full-Width Image Block**
- Spans entire section width
- Two modes: auto-height or fixed-height
- Perfect for hero images and dividers

**3. Float Image Block**
- Text wraps around the image
- Float left or right
- Adjustable width percentage
- Great for magazine-style layouts

### Video Integration
- **YouTube Embeds**: Paste any YouTube URL
- **Format Support**: Standard, shorts, live, embed URLs
- **Smart Export**: Videos work in offline HTML files
- **Responsive**: Auto-adjusts to screen size

---

## 🔧 Server Management

### Project Structure

```
Newsworthy Editor/
├── backend/              # Backend server
│   ├── server.js        # Main server file
│   ├── database.js      # Database operations
│   ├── github.js        # GitHub integration
│   ├── config-store.js  # Settings storage
│   ├── crypto-utils.js  # Token encryption
│   └── database.sqlite  # Local data storage
├── src/                 # Frontend source code
│   ├── components/      # Vue components
│   ├── stores/          # Pinia state management
│   ├── utils/           # Utility functions
│   └── config/          # Configuration files
│       └── api.js       # API configuration (port settings)
└── public/              # Static assets
```

### Port Configuration

#### API Port Configuration
```javascript
// File: Newsworthy Editor/src/config/api.js
const API_PORT = 3001;  // Change this to switch ports

export const API_BASE_URL = `http://localhost:${API_PORT}/api`;
```

#### Backend Port Configuration
```javascript
// File: Newsworthy Editor/backend/server.js
const PORT = process.env.PORT || 3001;
```

Or use environment variables:
```bash
set PORT=3002
node "Newsworthy Editor/backend/server.js"
```

### Common Commands

#### Frontend Development
```bash
cd "Newsworthy Editor"
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run linter
```

#### Backend Development
```bash
cd "Newsworthy Editor/backend"
node server.js   # Start server
```

---

## 🔧 Technology Stack

### Frontend
- **Vue 3** - Progressive JavaScript framework
- **TipTap** - Rich text editor based on ProseMirror
- **Pinia** - State management
- **Vite** - Fast build tool

### Backend
- **Express** - Web framework for Node.js
- **Better-SQLite3** - Fast, synchronous SQLite database
- **Octokit** - GitHub REST API client
- **Multer** - File upload handling

### Database Configuration

#### SQLite Journal Modes

The backend uses SQLite with **WAL (Write-Ahead Logging)** mode by default. This configuration affects how database files are managed:

**WAL Mode (Current Default)** ✅
```
backend/
├── database.sqlite       # Main database file
├── database.sqlite-shm   # Shared memory file (temporary)
└── database.sqlite-wal   # Write-ahead log file (temporary)
```

**Benefits:**
- ✅ Better performance for concurrent operations
- ✅ Improved write performance
- ✅ Readers don't block writers
- ✅ Ideal for multi-user scenarios

**Considerations:**
- ⚠️ Creates 3 files instead of 1
- ⚠️ Requires checkpoint operation before backup
- ⚠️ `.shm` and `.wal` files are temporary and auto-managed

**DELETE Mode (Alternative)**

If you prefer a single database file, you can switch to DELETE mode:

```javascript
// File: Newsworthy Editor/backend/database.js (line 25)
db.pragma('journal_mode = DELETE');  // Change from WAL to DELETE
```

```
backend/
└── database.sqlite       # Single file only
```

**Benefits:**
- ✅ Only one database file
- ✅ Simpler file management
- ✅ Easier to backup (just copy the file)
- ✅ Sufficient for single-user applications

**Trade-offs:**
- ⚠️ Slightly lower performance under high concurrency
- ⚠️ Writers block readers during transactions

**Which Mode to Choose?**

| Scenario | Recommended Mode |
|----------|------------------|
| Single-user editor (typical use) | DELETE ✅ |
| Multiple concurrent users | WAL ✅ |
| Need simple backups | DELETE ✅ |
| High-performance requirements | WAL ✅ |
| Minimal file management | DELETE ✅ |

**Switching Between Modes:**

1. Stop the backend server
2. Delete temporary files (if switching from WAL):
   ```bash
   # Windows
   del "Newsworthy Editor\backend\database.sqlite-shm"
   del "Newsworthy Editor\backend\database.sqlite-wal"
   
   # macOS/Linux
   rm "Newsworthy Editor/backend/database.sqlite-shm"
   rm "Newsworthy Editor/backend/database.sqlite-wal"
   ```
3. Edit `database.js` line 25 to change the mode
4. Restart the backend server

**Note:** For most users, the default WAL mode provides the best balance of performance and reliability. Only switch to DELETE mode if you specifically need simpler file management.

---

## ❓ FAQ

### Port Conflicts

**Q: Getting `EADDRINUSE` error (port already in use)?**

**A:** Solutions:

| Solution | Action | Time | Difficulty |
|----------|--------|------|------------|
| Wait for release | Wait 2-5 minutes and retry | 2-5 min | ⭐ |
| Restart computer | Restart your computer | 5-10 min | ⭐ |

**Q: Why is the port still in use after running the stop script?**

**A:** This is normal Windows behavior:
- The process is terminated, but the port is in TIME_WAIT state
- Wait 30-120 seconds for the system to automatically release it
- Or restart your computer to immediately release all ports

**Q: How to check if a port is in use?**

**A:** Run this command:
```bash
netstat -ano | findstr :3001
```
If there's output, the port is in use.

**Q: How to find which process is using a port?**

**A:**
```bash
# Find process using port 3001
netstat -ano | findstr :3001

# Example output:
# TCP    0.0.0.0:3001    0.0.0.0:0    LISTENING    12345
#                                                   ^^^^^ This is the Process ID

# View process details
tasklist /FI "PID eq 12345"
```

**Q: How to manually kill a process?**

**A:**
```bash
taskkill /F /PID 12345
```
Replace `12345` with the actual process ID.

---

## ❓ FAQ (Continued)

### Publishing & GitHub

**Q: Page not showing after publishing?**  
A: Wait 1-2 minutes for GitHub Pages to build. Check if GitHub Pages is enabled in your repository settings.

**Q: How to modify a published page?**  
A: Click Edit in Storage Manager, make your changes, then click Publish to GitHub again.

**Q: What if my GitHub token expires?**  
A: Generate a new token at https://github.com/settings/tokens, then update it in the Settings panel.

### Content & Media

**Q: Can I upload images?**  
A: Yes. Click the image button in the editor toolbar and select a local file or paste an image URL.

**Q: How do YouTube videos work in exported HTML files?**  
A: The exported HTML includes smart video handling:
- **Direct opening (double-click)**: Click video thumbnail → Opens YouTube in new tab
- **Web server mode**: Click thumbnail → Plays embedded in page

**Q: What video formats are supported?**  
A: Currently only YouTube videos. Supported URL formats:
- Standard: `https://www.youtube.com/watch?v=VIDEO_ID`
- Short link: `https://youtu.be/VIDEO_ID`
- Shorts: `https://www.youtube.com/shorts/VIDEO_ID`
- Live: `https://www.youtube.com/live/VIDEO_ID`
- Embed: `https://www.youtube.com/embed/VIDEO_ID`

### Technical

**Q: Frontend can't connect to backend?**

**A:** Check the following:
1. Is the backend running?
2. Is the port in `src/config/api.js` correct?
3. Are there any errors in the browser console?
4. Is your firewall blocking the connection?

**Q: How to backup my content?**  
A: Content is automatically saved in two places:
- **GitHub repository** (online, version controlled)
- **Local database** (`backend/database.sqlite` - backup this file regularly)

**Q: Can I use this without GitHub?**  
A: Yes, you can use the editor and save locally. However, publishing and sharing features require GitHub integration.

**Q: Database errors?**

**A:**
```bash
# 1. Check database file
dir "Newsworthy Editor\backend\database.sqlite"

# 2. If file is corrupted, delete and recreate
del "Newsworthy Editor\backend\database.sqlite"
cd "Newsworthy Editor\backend"
node server.js  # Will automatically create new database
```

---

## 🔍 Troubleshooting

### Scenario 1: Port Already in Use

```bash
# 1. Check port status
netstat -ano | findstr :3001

# 2. Try stopping
Double-click: stop-servers.bat

# 3. Wait for port release
Wait 2-5 minutes

# 4. If still not working, restart computer
```

### Scenario 2: Process Won't Terminate

```bash
# Most thorough solution: restart computer
```

### Scenario 3: Database Error

```bash
# 1. Check database file
dir "Newsworthy Editor\backend\database.sqlite"

# 2. If file is corrupted, delete and recreate
del "Newsworthy Editor\backend\database.sqlite"
cd "Newsworthy Editor\backend"
node server.js  # Will automatically create new database
```

---

## 💡 Best Practices

1. ✅ **Always use scripts to start/stop servers**
   - Use `start-servers.bat`/`start-servers.sh` to start
   - Use `stop-servers.bat`/`stop-servers.sh` to stop
   - Don't directly close command line windows

2. ✅ **Check documentation first when encountering issues**
   - Review the FAQ section in this document
   - Check browser console for error messages

3. ✅ **Use configuration files to manage ports**
   - Modify `src/config/api.js` instead of hardcoding

4. ✅ **Regular cleanup**
   - Stop servers at the end of each day
   - Avoid accumulation of zombie processes

5. ✅ **Regular backups**
   - Backup `backend/database.sqlite` file
   - Regularly push to GitHub

---

## 🎯 Recommended Workflow

### During Development

```bash
# 1. Start servers (first time each day)
Double-click: start-servers.bat (Windows)
Or run: ./start-servers.sh (macOS/Linux)

# 2. Develop...

# 3. Stop servers (end of day)
Double-click: stop-servers.bat (Windows)
Or run: ./stop-servers.sh (macOS/Linux)
```

### When Encountering Port Conflicts

```bash
# Option 1: Wait for port release
Wait 2-5 minutes
Re-run startup script

# Option 2: Restart computer
Restart and then start servers
```

---

## 🔒 Security & Privacy

- ✅ **Encrypted Storage**: GitHub tokens are stored with AES-256 encryption
- ✅ **Local-First**: All data is saved locally, nothing sent to third parties
- ✅ **No Tracking**: No analytics or user tracking
- ⚠️ **Token Safety**: Never share your GitHub token with anyone
- ⚠️ **Token Leaked?**: Immediately revoke it on GitHub and generate a new one
- 🔄 **Regular Updates**: Update your GitHub token periodically for security

---

## 📚 Related Documentation

- **Chinese Documentation**: `README-CN.md`
- **Project Root**: Contains startup scripts and configuration files

---

## 📝 License

This project is part of a capstone project for educational purposes.

---

## 🤝 Contributing

This is an academic project. For issues or suggestions:
1. Check existing documentation
2. Review the FAQ section
3. Contact the development team

---

**Last Updated**: November 2, 2025  
**Version**: 0.0.0  
**Course**: COMP9900
