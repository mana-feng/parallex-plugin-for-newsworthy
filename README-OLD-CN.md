# 📰 Newsworthy Editor - 中文指南

一个沉浸式长篇多媒体文章编辑器，用于创建视觉丰富的可滚动网页故事。设计杂志品质的文章，包含章节、文本、图片和视频，然后直接发布到 GitHub Pages。

> **📚 完整技术文档**: 查看 [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) 获取全面的技术文档，包括 API 端点、架构细节和开发者指南。

---

## 📋 目录

1. [快速启动](#快速启动)
2. [功能特性](#功能特性)
3. [使用指南](#使用指南)
4. [服务器管理](#服务器管理)
5. [常见问题](#常见问题)

---

## 🚀 快速启动

### 系统要求

- **Node.js**: v20.19.0+ 或 v22.12.0+
- **npm**: v10.9.2+
- **GitHub 账号**（用于发布内容）

### 安装步骤

1. **克隆仓库**
```bash
git clone <repository-url>
cd capstone-project-25t3-9900-h18e-almond-main
```

2. **安装依赖**
```bash
# 安装前端依赖
cd "Newsworthy Editor"
npm install

# 安装后端依赖
cd backend
npm install
cd ../..
```

### 启动应用

#### Windows 用户
双击项目根目录下的 `start-servers.bat` 文件，自动启动前后端服务。

#### macOS/Linux 用户
```bash
chmod +x start-servers.sh
./start-servers.sh
```

#### 停止服务器

**Windows:**
```batch
# 双击 stop-servers.bat
# 或在终端运行：
stop-servers.bat
```

**macOS/Linux/Git Bash:**
```bash
chmod +x stop-servers.sh
./stop-servers.sh
```

停止脚本会自动查找并终止使用以下端口的进程：
- `5173` - 前端 Vite 开发服务器
- `5174` - 前端 HMR（热模块替换）
- `3001` - 后端 API 服务器

启动成功后：
- **前端**: http://localhost:5173
- **后端**: http://localhost:3001

---

## ✨ 功能特性

- 🎨 **章节式设计** - 使用多个可自定义章节构建文章
- 📝 **富文本编辑** - TipTap 编辑器，支持高级格式化（标题、颜色、首字下沉）
- 🖼️ **灵活的图片布局** - 普通、全宽或浮动图片，带标题
- 🎬 **YouTube 集成** - 嵌入视频，在导出的 HTML 文件中也能工作
- 🌄 **背景图片** - 为章节添加视差效果的背景
- 💾 **双重存储** - 本地 SQLite 数据库 + GitHub Pages 集成
- 👁️ **实时预览** - 准确查看文章的最终效果
- 🚀 **一键发布** - 即时部署到 GitHub Pages
- 🔒 **安全** - AES-256 加密的令牌存储

---

## 📝 使用指南

### 初始配置

#### 步骤 1：配置 GitHub 设置

1. **打开设置面板**
   - 点击侧边栏的 **⚙️ 设置** 按钮

2. **获取 GitHub 个人访问令牌**
   - 访问 https://github.com/settings/tokens
   - 点击 **Generate new token (classic)**
   - 选择权限：
     - ✅ `repo`（完整的仓库访问权限）
     - ✅ `workflow`（可选，用于触发 GitHub Actions）
   - 点击 **Generate token**
   - **立即复制令牌**（只显示一次）

3. **填写设置**
   ```
   GitHub Token: ghp_xxxxxxxxxxxxxxxxxxxx（刚才复制的令牌）
   GitHub Username: your-username
   Repository Name: your-repo-name
   Branch: main（或 gh-pages）
   Base URL: https://your-username.github.io/your-repo-name
   ```

4. **测试连接**
   - 点击 **Test Connection** 按钮
   - 确认显示 "✅ Connection successful"

5. **保存配置**
   - 点击 **Save Settings**

#### 步骤 2：启用 GitHub Pages

1. 访问你的 GitHub 仓库
2. 进入 **Settings** → **Pages**
3. 配置：
   - **Source**: Deploy from a branch
   - **Branch**: `main`（或你配置的分支）
   - **Folder**: `/ (root)`
4. 点击 **Save**

配置完成！🎉

### 构建文章

#### 1. 创建章节
- 点击侧边栏的 **+ Add New Section**
- 章节是文章的构建块
- 每个章节可以有：
  - 自定义背景（纯色或图片）
  - 自定义高度
  - 多个内容块

#### 2. 章节设置
点击任意章节进行自定义：
- **Background Type**: 选择颜色或图片
- **Background Color**: 从调色板选择
- **Background Image**: 上传图片以实现视差效果
- **Height**: 调整章节高度（像素）

#### 3. 添加内容块

**文本块** 📝
- 点击 **+ Add Text Block**
- 富文本编辑器，支持格式化选项：
  - 标题（H1-H6）
  - 粗体、斜体、对齐
  - 文本颜色和字体大小
  - 首字下沉效果
  - 自定义文本宽度（提高可读性）

**图片块** 🖼️
- 点击 **+ Add Image Block**
- 选择图片类型：
  - **Normal**: 标准图片，带标题
  - **Full Width**: 跨越整个章节宽度
  - **Float & Text**: 图片周围有文字环绕
- 通过 URL 或上传添加图片
- 自定义：
  - 宽度和高度
  - 标题位置（下方/右侧/气泡）
  - 标题动画
  - 纵横比锁定

**视频块** 🎬
- 点击 **+ Add Video Block**
- 粘贴 YouTube URL（支持多种格式）
- 视频直接嵌入文章
- 智能导出：在下载的 HTML 文件中也能工作

### 保存与发布

#### 保存到 GitHub Pages 🚀
1. 点击侧边栏的 **🚀 Save to GitHub Pages**
2. 输入文件名（例如：`my-article.html`）
3. 确认发布
4. 文章将出现在：`https://[username].github.io/[repo]/[filename].html`

#### 存储管理器 📚
管理所有文章：
- **查看**所有已保存的文章
- **加载**之前的工作
- **重命名**文章
- **删除**不需要的文章
- **从 GitHub 拉取**以同步远程内容

### 预览与导出

#### 实时预览
- 点击标题栏的 **Preview** 按钮
- 准确查看文章的最终效果
- 按 `ESC` 退出预览

#### 导出功能
- 文章导出为独立的 HTML 文件
- 包含所有样式和内容
- YouTube 视频离线也能工作（智能回退）

---

## 🔧 服务器管理

### 项目结构

```
Newsworthy Editor/
├── backend/              # 后端服务器
│   ├── server.js        # 主服务器文件
│   ├── database.js      # 数据库操作
│   ├── github.js        # GitHub集成
│   ├── config-store.js  # 设置存储
│   ├── crypto-utils.js  # 令牌加密
│   └── database.sqlite  # 本地数据存储
├── src/                 # 前端源代码
│   ├── components/      # Vue组件
│   ├── stores/          # Pinia状态管理
│   ├── utils/           # 工具函数
│   └── config/          # 配置文件
│       └── api.js       # API配置（端口设置）
└── public/              # 静态资源
```

### 端口配置

#### API端口配置
```javascript
// 文件: Newsworthy Editor/src/config/api.js
const API_PORT = 3001;  // 修改这里来切换端口

export const API_BASE_URL = `http://localhost:${API_PORT}/api`;
```

#### 后端端口配置
```javascript
// 文件: Newsworthy Editor/backend/server.js
const PORT = process.env.PORT || 3001;
```

或使用环境变量：
```bash
set PORT=3002
node "Newsworthy Editor/backend/server.js"
```

### 常用命令

#### 前端开发
```bash
cd "Newsworthy Editor"
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run preview  # 预览生产版本
npm run lint     # 代码检查
```

#### 后端开发
```bash
cd "Newsworthy Editor/backend"
node server.js   # 启动服务器
```

---

## ❓ 常见问题

### 端口冲突问题

**Q: 遇到 `EADDRINUSE` 错误（端口被占用）怎么办？**

**A:** 解决方案：

| 方案 | 操作 | 时间 | 难度 |
|------|------|------|------|
| 等待释放 | 等待 2-5 分钟后重试 | 2-5分钟 | ⭐ |
| 重启电脑 | 重启计算机 | 5-10分钟 | ⭐ |

**Q: 为什么运行停止脚本后端口还是被占用？**

**A:** 这是Windows的正常行为：
- 进程已终止，但端口处于 TIME_WAIT 状态
- 需要等待 30-120 秒让系统自动释放
- 或重启计算机立即释放所有端口

**Q: 如何检查端口是否被占用？**

**A:** 运行以下命令：
```bash
netstat -ano | findstr :3001
```
如果有输出，说明端口被占用。

**Q: 如何找到占用端口的进程？**

**A:**
```bash
# 查找占用端口3001的进程
netstat -ano | findstr :3001

# 输出示例：
# TCP    0.0.0.0:3001    0.0.0.0:0    LISTENING    12345
#                                                   ^^^^^ 这是进程ID

# 查看进程详情
tasklist /FI "PID eq 12345"
```

**Q: 如何手动终止进程？**

**A:**
```bash
taskkill /F /PID 12345
```
将 `12345` 替换为实际的进程ID。

### 发布与 GitHub

**Q: 发布后页面不显示？**

**A:** 等待 1-2 分钟让 GitHub Pages 构建。检查仓库设置中是否启用了 GitHub Pages。

**Q: 如何修改已发布的页面？**

**A:** 在存储管理器中点击编辑，进行修改后再次点击发布到 GitHub。

**Q: GitHub 令牌过期了怎么办？**

**A:** 在 https://github.com/settings/tokens 生成新令牌，然后在设置面板中更新。

### 内容与媒体

**Q: 可以上传图片吗？**

**A:** 可以。点击编辑器工具栏中的图片按钮，选择本地文件或粘贴图片 URL。

**Q: YouTube 视频在导出的 HTML 文件中如何工作？**

**A:** 导出的 HTML 包含智能视频处理：
- **直接打开（双击）**: 点击视频缩略图 → 在新标签页打开 YouTube
- **Web 服务器模式**: 点击缩略图 → 在页面中播放嵌入视频

**Q: 支持哪些视频格式？**

**A:** 目前仅支持 YouTube 视频。支持的 URL 格式：
- 标准: `https://www.youtube.com/watch?v=VIDEO_ID`
- 短链接: `https://youtu.be/VIDEO_ID`
- Shorts: `https://www.youtube.com/shorts/VIDEO_ID`
- 直播: `https://www.youtube.com/live/VIDEO_ID`
- 嵌入: `https://www.youtube.com/embed/VIDEO_ID`

### 技术问题

**Q: 前端无法连接到后端？**

**A:** 检查以下几点：
1. 后端是否正在运行？
2. `src/config/api.js` 中的端口是否正确？
3. 浏览器控制台是否有错误？
4. 防火墙是否阻止了连接？

**Q: 如何备份内容？**

**A:** 内容自动保存在两个地方：
- **GitHub 仓库**（在线，版本控制）
- **本地数据库**（`backend/database.sqlite` - 定期备份此文件）

**Q: 可以不使用 GitHub 吗？**

**A:** 可以，你可以使用编辑器并在本地保存。但是，发布和分享功能需要 GitHub 集成。

**Q: 数据库错误怎么办？**

**A:**
```bash
# 1. 检查数据库文件
dir "Newsworthy Editor\backend\database.sqlite"

# 2. 如果文件损坏，删除并重新创建
del "Newsworthy Editor\backend\database.sqlite"
cd "Newsworthy Editor\backend"
node server.js  # 会自动创建新数据库
```

---

## 🔍 故障排除

### 场景1：端口被占用

```bash
# 1. 检查端口状态
netstat -ano | findstr :3001

# 2. 尝试停止
双击: stop-servers.bat

# 3. 等待端口释放
等待 2-5 分钟

# 4. 如果还是不行，重启计算机
```

### 场景2：进程无法终止

```bash
# 最彻底的解决方案：重启计算机
```

### 场景3：数据库错误

```bash
# 1. 检查数据库文件
dir "Newsworthy Editor\backend\database.sqlite"

# 2. 如果文件损坏，删除并重新创建
del "Newsworthy Editor\backend\database.sqlite"
cd "Newsworthy Editor\backend"
node server.js  # 会自动创建新数据库
```

---

## 💡 最佳实践

1. ✅ **总是使用脚本启动/停止服务器**
   - 使用 `start-servers.bat`/`start-servers.sh` 启动
   - 使用 `stop-servers.bat`/`stop-servers.sh` 停止
   - 不要直接关闭命令行窗口

2. ✅ **遇到问题先查看文档**
   - 查看本文档的常见问题部分
   - 检查浏览器控制台的错误信息

3. ✅ **使用配置文件管理端口**
   - 修改 `src/config/api.js` 而不是硬编码

4. ✅ **定期清理**
   - 每天结束时停止服务器
   - 避免僵尸进程积累

5. ✅ **定期备份**
   - 备份 `backend/database.sqlite` 文件
   - 定期推送到 GitHub

---

## 🎯 推荐工作流程

### 开发时

```bash
# 1. 启动服务器（每天第一次）
双击: start-servers.bat（Windows）
或运行: ./start-servers.sh（macOS/Linux）

# 2. 开发...

# 3. 停止服务器（每天最后）
双击: stop-servers.bat（Windows）
或运行: ./stop-servers.sh（macOS/Linux）
```

### 遇到端口冲突时

```bash
# 方案1：等待端口释放
等待 2-5 分钟
重新运行启动脚本

# 方案2：重启计算机
重启后再启动服务器
```

---

## 🔒 安全与隐私

- ✅ **加密存储**: GitHub 令牌使用 AES-256 加密存储
- ✅ **本地优先**: 所有数据保存在本地，不发送给第三方
- ✅ **无跟踪**: 无分析或用户跟踪
- ⚠️ **令牌安全**: 永远不要与任何人分享你的 GitHub 令牌
- ⚠️ **令牌泄露？**: 立即在 GitHub 上撤销它并生成新的
- 🔄 **定期更新**: 定期更新你的 GitHub 令牌以提高安全性

---

## 🔧 技术栈

### 前端
- **Vue 3** - 渐进式 JavaScript 框架
- **TipTap** - 基于 ProseMirror 的富文本编辑器
- **Pinia** - 状态管理
- **Vite** - 快速构建工具

### 后端
- **Express** - Node.js 的 Web 框架
- **Better-SQLite3** - 快速、同步的 SQLite 数据库
- **Octokit** - GitHub REST API 客户端
- **Multer** - 文件上传处理

### 数据库配置

#### SQLite 日志模式

后端默认使用 SQLite 的 **WAL（Write-Ahead Logging，预写日志）** 模式。此配置会影响数据库文件的管理方式：

**WAL 模式（当前默认）** ✅
```
backend/
├── database.sqlite       # 主数据库文件
├── database.sqlite-shm   # 共享内存文件（临时）
└── database.sqlite-wal   # 预写日志文件（临时）
```

**优点：**
- ✅ 并发操作性能更好
- ✅ 写入性能提升
- ✅ 读取不会阻塞写入
- ✅ 适合多用户场景

**注意事项：**
- ⚠️ 会创建 3 个文件而不是 1 个
- ⚠️ 备份前需要执行 checkpoint 操作
- ⚠️ `.shm` 和 `.wal` 文件是临时的，自动管理

**DELETE 模式（备选方案）**

如果你希望只有一个数据库文件，可以切换到 DELETE 模式：

```javascript
// 文件: Newsworthy Editor/backend/database.js（第25行）
db.pragma('journal_mode = DELETE');  // 从 WAL 改为 DELETE
```

```
backend/
└── database.sqlite       # 只有一个文件
```

**优点：**
- ✅ 只有一个数据库文件
- ✅ 文件管理更简单
- ✅ 备份更容易（直接复制文件）
- ✅ 对单用户应用足够

**权衡：**
- ⚠️ 高并发下性能略低
- ⚠️ 事务期间写入会阻塞读取

**如何选择模式？**

| 使用场景 | 推荐模式 |
|----------|----------|
| 单用户编辑器（典型使用） | DELETE ✅ |
| 多个并发用户 | WAL ✅ |
| 需要简单备份 | DELETE ✅ |
| 高性能要求 | WAL ✅ |
| 最小化文件管理 | DELETE ✅ |

**切换模式的步骤：**

1. 停止后端服务器
2. 删除临时文件（如果从 WAL 切换）：
   ```bash
   # Windows
   del "Newsworthy Editor\backend\database.sqlite-shm"
   del "Newsworthy Editor\backend\database.sqlite-wal"
   
   # macOS/Linux
   rm "Newsworthy Editor/backend/database.sqlite-shm"
   rm "Newsworthy Editor/backend/database.sqlite-wal"
   ```
3. 编辑 `database.js` 第25行来更改模式
4. 重启后端服务器

**注意：** 对于大多数用户，默认的 WAL 模式提供了性能和可靠性的最佳平衡。只有在特别需要简化文件管理时才切换到 DELETE 模式。

---

## 📚 相关文档

- **英文文档**: `README.md`
- **项目根目录**: 包含启动脚本和配置文件

---

## 📝 许可证

本项目是教育目的的毕业设计项目的一部分。

---

## 🤝 贡献

这是一个学术项目。如有问题或建议：
1. 查看现有文档
2. 查看常见问题部分
3. 联系开发团队

---

**最后更新**: 2025年11月2日  
**版本**: 0.0.0  
**课程**: COMP9900



