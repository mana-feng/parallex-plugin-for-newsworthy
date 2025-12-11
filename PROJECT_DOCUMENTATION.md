# Newsworthy Editor - Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Backend Documentation](#backend-documentation)
5. [Frontend Documentation](#frontend-documentation)
6. [Setup and Configuration](#setup-and-configuration)
7. [API Endpoints](#api-endpoints)

---

## Project Overview

**Newsworthy Editor** is a visual web-based editor for creating rich, interactive news pages with features like parallax scrolling, image blocks, text editing, and video embeds. The project supports GitHub Pages integration for publishing content directly to a repository.

### Key Features
- **Visual Editor**: WYSIWYG editor for creating sections with various content types
- **Image Management**: Upload, convert (AVIF), and manage images locally and on GitHub
- **Parallax/Scrollytelling**: Create engaging parallax sections with multiple slides
- **GitHub Integration**: Publish pages directly to GitHub Pages
- **Storage Management**: Local database for drafts, automatic cleanup of temporary images
- **Responsive Design**: Built-in device preview (PC, Tablet, Mobile)

---

## Technology Stack

### Backend
- **Node.js** with **Express.js** - REST API server
- **better-sqlite3** - Local SQLite database
- **Octokit** - GitHub API integration
- **Sharp** - Image processing and AVIF conversion
- **crypto-js** - Encryption for sensitive data
- **node-cron** - Scheduled tasks for image cleanup

### Frontend
- **Vue 3** - Progressive JavaScript framework
- **Pinia** - State management
- **Vite** - Build tool and development server
- **TipTap** - Rich text editor
- **html2canvas** - Screenshot generation for previews

---

## Project Structure

```
capstone-project-25t3-9900-h18e-almond-functions/
├── Newsworthy Editor/
│   ├── backend/                    # Backend server
│   │   ├── api/                    # API endpoint handlers
│   │   │   ├── buttonHandlers.js  # Main button action handlers
│   │   │   ├── buttonHelpers.js   # Helper functions for handlers
│   │   │   ├── pullAllAPI.js      # Pull all pages from GitHub
│   │   │   └── syncStatusManager.js # Sync status calculation
│   │   ├── config-store.js         # Configuration storage
│   │   ├── crypto-utils.js         # Encryption utilities
│   │   ├── database.js             # Database initialization & operations
│   │   ├── database.sqlite         # SQLite database file
│   │   ├── github.js               # GitHub API integration
│   │   ├── imageBlockAPI.js        # Image API endpoints
│   │   ├── imageConverter.js       # AVIF conversion
│   │   ├── parallaxAPI.js          # Parallax API endpoints
│   │   ├── server.js               # Main server file
│   │   └── package.json            # Backend dependencies
│   │
│   ├── src/                        # Frontend source
│   │   ├── components/             # Vue components
│   │   │   ├── add/                # Add content buttons
│   │   │   ├── header/             # Header bar components
│   │   │   ├── storage/            # Storage management components
│   │   │   ├── CustomDialog.vue    # Custom dialog component
│   │   │   ├── HeaderBar.vue       # Top header bar
│   │   │   ├── ImageSettingsPanel.vue
│   │   │   ├── InputModal.vue      # Input modal component
│   │   │   ├── ParallaxSection.vue # Parallax section component
│   │   │   ├── PreviewOverlay.vue  # Preview overlay
│   │   │   ├── SettingsPanel.vue   # Settings panel
│   │   │   ├── SideBar.vue         # Sidebar component
│   │   │   ├── StorageManager.vue  # Storage manager
│   │   │   ├── TipTapBlock.vue     # Rich text editor
│   │   │   ├── VisualEditor.vue    # Main editor component
│   │   │   └── WorkCanvas.vue      # Canvas/workspace
│   │   │
│   │   ├── composables/            # Vue composables
│   │   │   └── usePageSave.js      # Page save logic
│   │   │
│   │   ├── config/                 # Configuration
│   │   │   └── imageStorage.js     # Image storage config
│   │   │
│   │   ├── processes/              # Business logic processes
│   │   │   ├── html-export/        # HTML export process
│   │   │   │   ├── exportHelpers.js
│   │   │   │   ├── htmlBuilder.js
│   │   │   │   └── index.js
│   │   │   └── html-save/          # HTML save process
│   │   │       ├── index.js
│   │   │       ├── saveHelpers.js
│   │   │       ├── savePage.js
│   │   │       └── updatePage.js
│   │   │
│   │   ├── services/               # Service layer
│   │   │   ├── apiService.js       # API communication
│   │   │   ├── baseStylesService.js
│   │   │   ├── imageBlockService.js
│   │   │   ├── imageProcessingService.js
│   │   │   ├── parallaxService.js
│   │   │   ├── sectionService.js
│   │   │   ├── textBlockService.js
│   │   │   └── videoBlockService.js
│   │   │
│   │   ├── stores/                 # Pinia stores
│   │   │   └── editorStore.js      # Main editor state
│   │   │
│   │   ├── utils/                  # Utility functions
│   │   │   ├── buildHtml.js
│   │   │   ├── dialog.js           # Dialog utilities
│   │   │   ├── imageUrlUtils.js    # Image URL conversion
│   │   │   ├── inputModal.js       # Input modal utilities
│   │   │   └── parseHtml.js
│   │   │
│   │   ├── App.vue                 # Root component
│   │   └── main.js                 # Application entry
│   │
│   ├── public/                     # Static assets
│   ├── index.html                  # HTML entry point
│   ├── vite.config.js              # Vite configuration
│   └── package.json                # Frontend dependencies
│
├── README.md                       # Project readme
├── start-servers.bat/sh            # Start scripts
└── stop-servers.bat/sh             # Stop scripts
```

---

## Backend Documentation

### Core Files

#### `server.js`
**Description**: Main Express server file that sets up all API endpoints and middleware.

**Key Functions**:
- `app.listen(PORT)` - Start the server on specified port
- `scheduleAutoCleanup()` - Schedule daily cleanup of temporary images at midnight
- `cleanupOldTempImages(hoursOld)` - Clean up images older than specified hours
- `cleanupTempImagesFromHtml(htmlContent)` - Extract and clean temp image references from HTML

**API Endpoints**:
- Health & Status: `GET /api/health`, `GET /api/github/status`
- Settings: `GET/POST /api/settings/github`, `POST /api/settings/github/test`
- Groups: `GET/POST/PUT/DELETE /api/groups/*`
- Pages: `GET/POST/PUT/DELETE /api/pages/*`
- Images: `POST /api/images/upload`, `DELETE /api/images/temp/:imageId`
- GitHub Operations: `POST /api/github/pull-all`, `POST /api/pages/:id/upload`

---

#### `database.js`
**Description**: Database initialization and operations using better-sqlite3.

**Key Functions**:
- `initDatabase()` - Initialize database schema and run migrations
- **groupOperations**: CRUD operations for groups
  - `create` - Insert new group
  - `getAll` - Get all groups with page counts
  - `getById` - Get single group by ID
  - `update` - Update group information
  - `delete` - Delete group
- **pageOperations**: CRUD operations for pages
  - `create` - Insert new page
  - `getAll` - Get all pages with group info
  - `getById` - Get single page by ID
  - `getByFilename` - Get page by filename
  - `getByGroup` - Get pages in a group
  - `update` - Update page information
  - `updateSortOrder` - Update page sort order
  - `delete` - Delete page
  - `search` - Search pages by title/filename
  - `findEmptyContent` - Find pages with empty content
  - `deleteEmptyContent` - Delete empty pages
  - `deleteAll` - Delete all pages
  - `resetAutoIncrement` - Reset auto-increment counter
- **groupsJsonOperations**: Import/export groups as JSON
  - `exportToJson()` - Export groups to JSON object
  - `importFromJson(jsonData)` - Import groups from JSON
  - `exportToJsonString()` - Export as JSON string
  - `importFromJsonString(jsonString)` - Import from JSON string
- **tempImageOperations**: Temporary image storage
  - `save` - Save/update temporary image
  - `getById` - Get image by ID
  - `getAll` - Get all temporary images
  - `delete` - Delete temporary image
  - `deleteAll` - Delete all temporary images
  - `deleteOlderThan(hours)` - Delete images older than specified hours
  - `countOlderThan(hours)` - Count old images

**Database Schema**:
```sql
-- Groups table
groups (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at DATETIME,
  updated_at DATETIME
)

-- Pages table
pages (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  github_url TEXT UNIQUE,
  group_id INTEGER,
  sort_order INTEGER DEFAULT 0,
  html_content TEXT NOT NULL,
  sections_data TEXT,
  preview_image TEXT,
  last_uploaded_at DATETIME,
  created_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY (group_id) REFERENCES groups(id)
)

-- Temporary images table
temp_images (
  id INTEGER PRIMARY KEY,
  image_id TEXT UNIQUE NOT NULL,
  filename TEXT NOT NULL,
  image_data TEXT NOT NULL,
  mime_type TEXT DEFAULT 'image/jpeg',
  created_at DATETIME
)

-- Settings table
settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME
)
```

---

#### `github.js`
**Description**: GitHub API integration using Octokit for file management.

**Key Functions**:
- `getOctokit()` - Get authenticated Octokit instance
- `getConfig()` - Get GitHub configuration
- `uploadToGitHub(filename, content, customDate)` - Upload HTML file to GitHub with date-based folder structure
- `updateFileAtPath(filePath, content)` - Update file at specific path
- `deleteFromGitHub(filename)` - Delete file from repository
- `listGitHubFiles()` - List all HTML files (recursive)
- `getFilesRecursively(octokit, owner, repo, branch, path)` - Recursively get files from directory
- `renameInGitHub(oldFilename, newFilename, content, customDate)` - Rename file in repository
- `validateGitHubConfig()` - Validate GitHub configuration
- `testGitHubConfig(testConfig)` - Test GitHub credentials
- `getFileFromGitHub(filePath)` - Get file content from repository
- `syncWithGitHub(filePath, localContent)` - Compare local and remote versions
- `getAllFilesFromGitHub()` - Get all HTML files with content (batched)
- `pullAllFromGitHub()` - Pull all HTML files from GitHub
- `checkImageExists(filename, customDate)` - Check if image exists in repository
- `uploadImageToGitHub(imageData, filename, customDate, overwrite, existingSha)` - Upload image to GitHub with date-based path
- `uploadGroupsJson(jsonContent)` - Upload groups.json
- `downloadGroupsJson()` - Download groups.json

**Folder Structure**:
- HTML files: `YYYY/MM/filename.html`
- Images: `YYYY/MM/images/filename.ext`
- Groups: `groups.json` (root)

---

#### `imageBlockAPI.js`
**Description**: API endpoints for image management, including save, retrieve, and upload operations.

**Key Functions**:
- `setupImageBlockAPI(app, PORT)` - Setup image API routes
  - `POST /api/images/temp/save` - Save image to local database (auto-converts to AVIF)
  - `GET /api/images/temp/:imageId` - Get image from database (returns image data)
  - `GET /api/images/temp` - Get all temporary images
  - `POST /api/images/check-conflict` - Check if image exists in GitHub
  - `POST /api/images/upload-to-github` - Upload single image to GitHub
  - `POST /api/images/temp/validate` - Validate image IDs
  - `POST /api/images/temp/upload-to-github` - Batch upload images to GitHub

**Image Processing Flow**:
1. Frontend uploads image → Backend receives data URL
2. Backend converts to AVIF format using Sharp
3. Image saved to database with UUID
4. Returns localhost URL for preview
5. On publish, uploads to GitHub and replaces URLs

---

#### `imageConverter.js`
**Description**: Image format conversion using Sharp library.

**Key Functions**:
- `convertToAVIF(imageData, options)` - Convert image data URL to AVIF format
  - Parameters: `quality` (1-100), `maxWidth`, `maxHeight`
  - Returns: AVIF data URL
- `convertBufferToAVIF(imageBuffer, options)` - Convert image buffer to AVIF

**AVIF Benefits**:
- Better compression than JPEG/PNG
- Smaller file sizes (30-50% reduction)
- Maintains high quality
- Modern browser support

---

#### `parallaxAPI.js`
**Description**: API setup for parallax sections (currently uses existing image API).

**Key Functions**:
- `setupParallaxAPI(app)` - Setup parallax-specific routes (currently empty, uses image API)

**Future Features**:
- Parallax templates
- Parallax validation
- Parallax-specific settings

---

#### `config-store.js`
**Description**: Configuration storage using SQLite with encryption support.

**Key Functions**:
- **configStore**:
  - `get(key)` - Get configuration value
  - `set(key, value)` - Set configuration value
  - `delete(key)` - Delete configuration
  - `getAll()` - Get all configurations
- **githubConfig**:
  - `get()` - Get GitHub config (raw with encrypted token)
  - `set(config)` - Set GitHub config (encrypts token)
  - `isConfigured()` - Check if GitHub is configured
  - `getConfig()` - Get decrypted GitHub config

**Stored Configuration**:
- `github_config`: GitHub token, owner, repo, branch, baseUrl

---

#### `crypto-utils.js`
**Description**: Encryption utilities for sensitive data using crypto-js.

**Key Functions**:
- `encrypt(plainText)` - Encrypt text using AES
- `decrypt(encryptedText)` - Decrypt text
- `isEncrypted(text)` - Check if text is encrypted

**Usage**: Encrypts GitHub personal access tokens before storing in database.

---

### API Handler Files

#### `api/buttonHandlers.js`
**Description**: Main action handlers for button operations.

**Key Functions**:
- `handlePullAllFromGitHub(req, res)` - Pull all pages from GitHub
- `handleSmartSyncGroups(req, res)` - Smart sync groups (merge local and GitHub)
- `handleUploadPageToGitHub(req, res)` - Upload single page to GitHub
- `handleDeletePage(req, res)` - Delete page from database and GitHub
- `handlePushGroupsToGitHub(req, res)` - Push groups to GitHub
- `handlePullGroupsFromGitHub(req, res)` - Pull groups from GitHub

---

#### `api/buttonHelpers.js`
**Description**: Helper functions for button handlers.

**Key Functions**:
- `sortGroupsJson(json)` - Sort groups for comparison
- `extractLocalImageIds(htmlContent)` - Extract local image IDs from HTML
- `replaceImageUrlsInHtml(htmlContent, imageUrlMapping)` - Replace image URLs in HTML
- `isGitHubConfigured()` - Check if GitHub is configured
- `getPageById(id)` - Get page by ID with error handling

---

#### `api/pullAllAPI.js`
**Description**: Pull all pages from GitHub with image downloading.

**Key Functions**:
- `handlePullAll(req, res)` - Main pull all handler
- `downloadImageFromGitHub(githubImageUrl)` - Download image from GitHub and save locally
- `convertGitHubImagesToLocal(htmlContent)` - Convert GitHub image URLs to local URLs

**Pull Flow**:
1. Fetch all HTML files from GitHub
2. Download images from GitHub to local database
3. Replace GitHub image URLs with local URLs
4. Save/update pages in database

---

#### `api/syncStatusManager.js`
**Description**: Calculate and manage page sync status.

**Key Functions**:
- `normalizeTimestamp(timestamp)` - Normalize SQLite timestamp to UTC
- `getSyncStatus(page)` - Determine page sync status
  - `local-only`: No github_url
  - `synced`: Local and GitHub are in sync
  - `out-of-sync`: Local was updated after last upload
- `addSyncStatusToPage(page)` - Add sync_status to page object
- `addSyncStatusToPages(pages)` - Add sync_status to page array
- `updatePageUploadTimestamp(pageOperations, pageId)` - Update last_uploaded_at

---

## Frontend Documentation

### Core Files

#### `src/main.js`
**Description**: Application entry point.

**Key Functions**:
- `createApp(App)` - Create Vue app instance
- `app.use(createPinia())` - Register Pinia store
- `app.config.errorHandler` - Global error handler
- `app.mount('#app')` - Mount app to DOM

---

#### `src/App.vue`
**Description**: Root Vue component.

**Components Used**:
- `VisualEditor` - Main editor component
- `InputModal` - Input modal for user prompts
- `CustomDialog` - Custom dialog for alerts/confirms

**Lifecycle**:
- `onMounted()` - Initialize global modal and dialog instances

---

### Store

#### `src/stores/editorStore.js`
**Description**: Main Pinia store for editor state management.

**State**:
- `sections` - Array of editor sections
- `selected` - Currently selected element
- `currentPageInfo` - Current page metadata
- `activeEditor` - Active TipTap editor instance
- `isPreview` - Preview mode flag
- `devices` - Device preview options
- `selectedDeviceId` - Current device selection

**Key Actions**:

**Section Management**:
- `addSection()` - Add normal section
- `addParallaxSection()` - Add parallax section
- `selectSection(sectionId)` - Select section
- `setSecType(type)` - Set section background type
- `setSecBg(color)` - Set section background color
- `setSecHeight(h)` - Set section height
- `setSecBgImg(url)` - Set section background image
- `revokeAllBlobs()` - Clean up blob URLs

**Block Management**:
- `addTextBlock()` - Add text block
- `addImageBlock(src, sourceType)` - Add image block
- `addVideoBlock(url)` - Add video block
- `addFullWidthImageBlock(src, sourceType)` - Add fullwidth image
- `addFloatImageBlock(src, sourceType)` - Add float image
- `selectBlock(sectionId, blockId, blockType, imageIndex, part)` - Select block
- `deleteSelected()` - Delete selected element

**Text Block Settings**:
- `setTextBlockWidth(val, unit)` - Set text block width (ch or px)

**Image Block Settings**:
- `setImgWidth(w)` - Set image width
- `setImgHeight(h)` - Set image height
- `setImgKeepRatio(v)` - Toggle aspect ratio lock
- `setImgCaption(text)` - Set image caption
- `setImgCaptionPosition(pos)` - Set caption position (bottom/bubble)
- `setImgCaptionBubbleAnimated(v)` - Toggle bubble animation

**Fullwidth Image Settings**:
- `setFullWidthImgMode(mode)` - Set mode (auto/fixed)
- `setFullWidthImgHeight(h)` - Set fixed height
- `setFullWidthImgCaption(text)` - Set caption
- `setFullWidthImgCaptionPosition(pos)` - Set caption position
- `setFullWidthImgCaptionBubbleAnimated(v)` - Toggle animation

**Float Image Settings**:
- `setFloatImgAlign(align)` - Set float alignment (left/right)
- `setFloatImgWidth(w)` - Set width percentage
- `setFloatImgCaption(text)` - Set caption
- `setFloatImgCaptionPosition(pos)` - Set caption position
- `setFloatImgCaptionBubbleAnimated(v)` - Toggle animation

**Video Block Settings**:
- `setVideoUrl(url)` - Set YouTube URL
- `setVideoWidth(w)` - Set video width
- `setVideoHeight(h)` - Set video height
- `setVideoKeepRatio(v)` - Toggle aspect ratio lock

**Image Management**:
- `extractImageId(url)` - Extract image ID from URL
- `collectLocalImageIds()` - Collect all local image IDs
- `collectLocalImageDetails()` - Collect detailed image info
- `replaceLocalUrls(urlMapping)` - Replace local URLs with GitHub URLs

**Preview & Export**:
- `runPreview()` - Enable preview mode
- `stopPreview()` - Disable preview mode
- `togglePreview()` - Toggle preview mode
- `selectDevice(id)` - Change device preview
- `exportToHTML()` - Export sections to HTML
- `prepareSectionsForSave()` - Prepare sections for database save
- `generatePreviewImage()` - Generate page thumbnail

**Page Management**:
- `clearAllSections()` - Clear all content
- `returnToHome()` - Return to home (with confirmation)
- `loadSections(sectionsData, pageInfo)` - Load page into editor

---

### Composables

#### `src/composables/usePageSave.js`
**Description**: Page save/update operations logic.

**Key Functions**:
- `reuploadImageFromUrl(imageUrl, imageId)` - Re-upload image from URL
- `replaceInvalidImageReferences(urlMapping)` - Replace invalid image refs
- `validateAndReuploadImages(localImageIds)` - Validate and re-upload invalid images
- `uploadImagesWithHandling(localImageIds, handleImageConflicts)` - Upload images to GitHub with conflict handling
- `verifyLocalImagesReplaced(action)` - Verify all local images were replaced

---

### Services

#### `src/services/apiService.js`
**Description**: API communication layer with backend.

**Configuration**:
- `API_PORT` - Backend port (3001)
- `API_BASE_URL` - Base URL for API requests

**Key Functions**:
- `apiUrl(path)` - Build API URL
- `request(endpoint, options)` - Fetch wrapper with error handling

**Image API**:
- `saveTempImage(imageData, filename, imageId)` - Save image to local database
- `validateImageIds(imageIds)` - Validate image IDs exist
- `checkImageConflict(filename, customDate)` - Check if image exists in GitHub
- `uploadImagesToGitHub(imageIds, conflictResolutions)` - Batch upload images

**Page API**:
- `getPages(filters)` - Get all pages with optional filters
- `getPage(id)` - Get single page
- `createPage(pageData)` - Create new page
- `updatePage(id, pageData)` - Update page by ID
- `updatePageByFilename(filename, pageData)` - Update by filename
- `uploadPageToGitHub(id)` - Upload page to GitHub
- `deletePage(id)` - Delete page
- `reorderPages(pageIds)` - Reorder pages

**Group API**:
- `getGroups()` - Get all groups
- `createGroup(groupData)` - Create group
- `updateGroup(id, groupData)` - Update group
- `deleteGroup(id)` - Delete group
- `syncGroupsPush()` - Push groups to GitHub
- `syncGroupsPull()` - Pull groups from GitHub
- `syncGroupsSmart()` - Smart sync groups

**GitHub API**:
- `getGitHubStatus()` - Get GitHub connection status
- `pullAllFromGitHub()` - Pull all pages from GitHub
- `getGitHubSettings()` - Get GitHub settings
- `saveGitHubSettings(settings)` - Save GitHub settings
- `testGitHubConnection(settings)` - Test GitHub connection

---

#### `src/services/imageBlockService.js`
**Description**: Image block operations and HTML generation.

**Key Functions**:
- `addImageBlock(context, src, sourceType)` - Add normal image block
- `addFullWidthImageBlock(context, src, sourceType)` - Add fullwidth image block
- `addFloatImageBlock(context, src, sourceType)` - Add float image block
- `processImageUpload(file, imageType, context, onSuccess, onError)` - Process image file upload
- `addImageFromUrl(url, imageType, context)` - Add image from URL
- `getImageBlockCSS()` - Generate CSS for image blocks
- `buildImageBlockHTML(block)` - Build HTML for normal image block
- `buildFullwidthImageBlockHTML(block)` - Build HTML for fullwidth image
- `buildFloatImageBlockHTML(block)` - Build HTML for float image

**Source Types**:
- `url` - External URL
- `local` - Local database (localhost)
- `github` - GitHub Pages URL
- `upload` - Newly uploaded file

---

#### `src/services/imageProcessingService.js`
**Description**: Unified image upload and processing service.

**Key Functions**:
- `uploadImage(file, filename)` - Upload image file (converts to AVIF on backend)
- `uploadImageFromDataUrl(dataUrl, filename)` - Upload from data URL

**Upload Flow**:
1. Validate file type
2. Read file as data URL
3. Send to backend → Backend converts to AVIF
4. Save to database with UUID
5. Return local:// URL for storage

---

#### `src/services/parallaxService.js`
**Description**: Parallax section management and HTML generation.

**Key Functions**:

**Section Management**:
- `createParallaxSection()` - Create new parallax section
- `addSlide(section)` - Add slide to section
- `removeSlide(section, index)` - Remove slide
- `updateSlideBg(section, index, url)` - Update slide background
- `handleUploadBg(section, index, file)` - Upload background image

**Slide Content**:
- `addTextToSlide(section, slideIndex)` - Add text block to slide
- `removeBlockFromSlide(section, slideIndex, blockId)` - Remove block

**Cleanup**:
- `revokeParallaxBlobs(sections)` - Revoke blob URLs

**HTML Generation**:
- `buildParallaxSectionHTML(section)` - Build HTML for parallax section
- `buildParallaxSectionForExport(section)` - Build HTML for export
- `getParallaxCSS()` - Generate CSS styles
- `getParallaxJavaScript()` - Generate JavaScript for scrolling effect

**Image Management**:
- `collectParallaxImageIds(sections, extractImageId)` - Collect image IDs
- `collectParallaxImageDetails(sections, extractImageId)` - Collect image details
- `replaceParallaxLocalUrls(sections, urlMapping, extractImageId)` - Replace URLs
- `prepareParallaxSectionsForSave(sections, blobUrlToBase64)` - Prepare for save

---

#### `src/services/videoBlockService.js`
**Description**: YouTube video embed management.

**Key Functions**:
- `extractYouTubeId(url)` - Extract video ID from YouTube URL
- `createVideoBlock(url)` - Create video block object
- `updateVideoDimensions(block, width, height, keepRatio)` - Update video dimensions
- `buildVideoBlockHTML(block)` - Build HTML for video embed

**Supported URL Formats**:
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`

---

### Processes

#### `src/processes/html-export/index.js`
**Description**: HTML export main entry point.

**Key Functions**:
- `exportToHTML(sections)` - Export sections to complete HTML document
- Exported helpers: `blobUrlToBase64`, `processSectionsForExport`, `buildCompleteHTML`

---

#### `src/processes/html-export/exportHelpers.js`
**Description**: Helper functions for HTML export.

**Key Functions**:
- `blobUrlToBase64(blobUrl)` - Convert blob URL to base64 data URL
- `processSectionsForExport(sections, blobUrlToBase64)` - Process sections for export (convert blobs)

---

#### `src/processes/html-export/htmlBuilder.js`
**Description**: Build complete HTML document.

**Key Functions**:
- `buildCompleteHTML(sections)` - Build complete HTML with head, styles, and body
- `buildHTMLBody(sections)` - Build HTML body from sections
- `buildSectionHTML(section)` - Build HTML for single section

---

#### `src/processes/html-save/index.js`
**Description**: HTML save process entry point.

**Exported Functions**:
- `saveNewPage` - Save new page to database
- `updateExistingPage` - Update existing page
- `prepareSectionsForSave` - Prepare sections for database storage

---

### Utilities

#### `src/utils/dialog.js`
**Description**: Custom dialog utilities.

**Key Functions**:
- `registerDialog(instance)` - Register dialog component
- `confirm(message, options)` - Show confirmation dialog
- `alert(message, options)` - Show alert dialog
- `warning(message, options)` - Show warning dialog
- `danger(message, options)` - Show danger/delete confirmation
- `success(message, options)` - Show success message
- `error(message, options)` - Show error message
- `info(message, options)` - Show info message

---

#### `src/utils/inputModal.js`
**Description**: Input modal utilities.

**Key Functions**:
- `setInputModalInstance(instance)` - Register modal instance
- `getInputModalInstance()` - Get modal instance
- `slugify(text)` - Convert text to URL-friendly slug
- `promptPageInfo(defaultTitle, defaultFilename)` - Prompt for page title and filename
- `promptInput(options)` - Prompt for single input
- `showCopyText(text, title)` - Show copyable text

---

#### `src/utils/imageUrlUtils.js`
**Description**: Image URL format conversion utilities.

**URL Formats**:
- `local://<id>` - Internal storage format
- `http://localhost:3001/api/images/temp/<id>` - Display URL
- `https://owner.github.io/repo/path` - GitHub Pages URL

**Key Functions**:
- `localhostToLocal(url)` - Convert localhost URL to local:// format
- `localToLocalhost(url)` - Convert local:// to localhost URL
- `convertImageUrlForDisplay(url)` - Convert URL for display
- `extractImageId(url)` - Extract UUID from URL

---

## Setup and Configuration

### Installation

```bash
# Clone repository
git clone <repository-url>
cd capstone-project-25t3-9900-h18e-almond-functions

# Install backend dependencies
cd "Newsworthy Editor/backend"
npm install

# Install frontend dependencies
cd ..
npm install
```

### Running the Application

**Windows**:
```bash
# Start both servers
start-servers.bat

# Stop servers
stop-servers.bat
```

**Linux/Mac**:
```bash
# Start both servers
./start-servers.sh

# Stop servers
./stop-servers.sh
```

**Manual Start**:
```bash
# Backend (in backend folder)
npm start    # or: npm run dev (with watch mode)

# Frontend (in Newsworthy Editor folder)
npm run dev
```

### Configuration

#### GitHub Integration
1. Go to Settings in the editor
2. Enter GitHub credentials:
   - Personal Access Token
   - Repository Owner
   - Repository Name
   - Branch (default: gh-pages)
   - Base URL (auto-generated)
3. Test connection
4. Save settings

**GitHub Token Permissions**:
- `repo` - Full repository access
- `contents` - Read/write repository contents

---

## API Endpoints

> The backend API service runs at `http://localhost:3001/api` by default. All endpoints are prefixed with `/api`.

### Basics
- **Base URL**: `http://localhost:3001/api`
- **Request wrapper**: `request(endpoint, options)` in `src/services/apiService.js` using `fetch`
  - Default `Content-Type: application/json`
  - Unified return: `{ ok: boolean, data?: any, error?: string, response?: Response }`
  - JSON is parsed by default; non-JSON returns plain text in `data`
- **Authentication**: None (local service)

### Health & Status

#### `GET /api/health`
- **Purpose**: Health check endpoint
- **Response**: Health status

#### `GET /api/github/status`
- **Purpose**: Check GitHub configuration status
- **Response**: `{ configured: boolean, owner?: string, repo?: string }`
- **Front-end call**: `getGitHubStatus` (`src/services/apiService.js`)

### GitHub Settings

#### `GET /api/settings/github`
- **Purpose**: Get GitHub settings
- **Response**: `{ configured: boolean, config?: { owner, repo, branch, baseUrl } }`
- **Front-end call**: `getGitHubSettings` (`src/services/apiService.js`)

#### `POST /api/settings/github`
- **Purpose**: Save GitHub settings
- **Request body**:
```json
{
  "token": "ghp_...",
  "owner": "username",
  "repo": "repository-name",
  "branch": "main",
  "baseUrl": "optional-base-url"
}
```
- **Response**: `{ success: true, message }`
- **Front-end call**: `saveGitHubSettings` (`src/components/SettingsPanel.vue`)

#### `POST /api/settings/github/test`
- **Purpose**: Test GitHub connection
- **Request body**: `{ token, owner, repo }`
- **Response**: `{ success: true, message }` or `{ success: false, error }`
- **Front-end call**: `testGitHubConnection` (`src/components/SettingsPanel.vue`)

### Images: Storage & Upload

#### `POST /api/images/temp/save`
- **Purpose**: Save a front-end generated `dataURL` to local backend database (temporary image)
- **Request body**:
```json
{
  "imageData": "data:image/png;base64,...",
  "filename": "my-image.png",
  "imageId": "optional-id"
}
```
- **Response**:
```json
{
  "success": true,
  "imageId": "abc123",
  "localUrl": "http://localhost:3001/api/images/temp/abc123",
  "filename": "my-image.png",
  "originalFilename": "my-image.png"
}
```
- **Front-end call**: `saveTempImage` (`src/services/apiService.js`)
- **Backend**: `backend/imageBlockAPI.js`

#### `GET /api/images/temp/:imageId`
- **Purpose**: Fetch temporary image binary for canvas render and export
- **Response**: `image/*` binary
- **Front-end usage**: `local://` → `http://localhost:3001/api/images/temp/{id}` (`src/processes/html-export/exportHelpers.js`, `src/composables/usePageSave.js`)

#### `GET /api/images/temp`
- **Purpose**: Get all temporary images
- **Response**: Array of temporary image objects

#### `DELETE /api/images/temp/:imageId`
- **Purpose**: Delete temporary image
- **Response**: `{ success: true }`

#### `POST /api/images/temp/validate`
- **Purpose**: Validate existence of a list of temporary image IDs
- **Request body**:
```json
{ "imageIds": ["id1", "id2"] }
```
- **Response**:
```json
{
  "success": true,
  "total": 2,
  "valid": 2,
  "invalid": 0,
  "validation": {
    "valid": [{ "imageId": "id1", "filename": "a.png", "createdAt": "..." }],
    "invalid": []
  }
}
```
- **Front-end call**: `validateImageIds` (`src/services/apiService.js`)
- **Backend**: `backend/imageBlockAPI.js`

#### `POST /api/images/check-conflict`
- **Purpose**: Check if an image conflicts on GitHub
- **Request body**:
```json
{ "filename": "a.png", "customDate": "optional" }
```
- **Response**:
```json
{ "exists": true, "sha": "...", "path": "assets/a.png", "sanitizedFilename": "a.png" }
```
- **Front-end call**: `checkImageConflict` (`src/services/apiService.js`)

#### `POST /api/images/upload-to-github`
- **Purpose**: Upload single image to GitHub
- **Request body**: Image upload data
- **Response**: Upload result with GitHub URL

#### `POST /api/images/temp/upload-to-github`
- **Purpose**: Batch upload temporary images to GitHub, with overwrite/rename strategies
- **Request body**:
```json
{
  "imageIds": ["id1", "id2"],
  "conflictResolutions": {
    "id1": { "action": "overwrite", "sha": "..." },
    "id2": { "action": "rename", "newFilename": "b-v2.png" }
  }
}
```
- **Response** (example):
```json
{
  "success": true,
  "uploaded": 2,
  "failed": 0,
  "conflicts": 0,
  "results": {
    "success": [{ "imageId": "id1", "localUrl": "...", "githubUrl": "...", "filename": "a.png" }],
    "failed": [],
    "conflicts": []
  }
}
```
- **Front-end call**: `uploadImagesToGitHub` (`src/services/apiService.js`)
- **Backend**: `backend/imageBlockAPI.js`

#### `POST /api/images/temp/cleanup`
- **Purpose**: Manual cleanup of old images
- **Response**: `{ success: true, deleted: number }`

#### `POST /api/images/upload`
- **Purpose**: Legacy upload endpoint (deprecated)

### Pages

#### `GET /api/pages`
- **Purpose**: Get all pages (with filters)
- **Query parameters**: `group_id?: number`, `search?: string`
- **Response**: Array of pages (includes `sync_status`)
- **Front-end call**: `getPages` (`src/services/apiService.js`)
- **Backend**: `backend/server.js`

#### `GET /api/pages/:id`
- **Purpose**: Get single page
- **Response**: Single page object
- **Front-end call**: `getPage` (`src/services/apiService.js`)

#### `POST /api/pages`
- **Purpose**: Create a new page (save to database)
- **Request body**:
```json
{
  "title": "My Page",
  "filename": "my-page.html",
  "html_content": "<html>...",
  "sections_data": [{"id":1,"type":"text","html":"..."}],
  "group_id": null,
  "preview_image": "data:image/png;base64,..."
}
```
- **Response**: Page object
- **Front-end call**: `createPage` (`src/processes/html-save/savePage.js` via `src/services/apiService.js`)

#### `PUT /api/pages/:id`
- **Purpose**: Update a page by ID
- **Request body**: Any page fields (`title/filename/html_content/sections_data/group_id/sort_order/preview_image`)
- **Response**: Updated page object
- **Front-end call**: `updatePage` (`src/services/apiService.js`)

#### `PUT /api/pages/by-filename/:filename`
- **Purpose**: Update a page by filename (used by Update Page button)
- **Request body**: `{ title?, html_content?, sections_data? }`
- **Response**: Updated page object
- **Front-end call**: `updatePageByFilename` (`src/components/header/UpdateButton.vue`)

#### `POST /api/pages/reorder`
- **Purpose**: Reorder pages
- **Request body**: `{ pageIds: number[] }` (front-end) or `{ pages: [{ id: number, sort_order: number }] }` (backend expected)
- **Response**: `{ success: true }`
- **Note**: Payload mismatch between front-end and backend; see Notes section below

#### `POST /api/pages/:id/upload`
- **Purpose**: Upload page content to GitHub
- **Response** (example):
```json
{ "github_url": "https://github.com/.../my-page.html", "images_uploaded": 3 }
```
- **Front-end call**: `uploadPageToGitHub` (`src/services/apiService.js`)

#### `DELETE /api/pages/:id`
- **Purpose**: Delete a page
- **Response**: `{ success: true }`
- **Front-end call**: `deletePage` (`src/services/apiService.js`)

### Groups

#### `GET /api/groups`
- **Purpose**: Get all groups
- **Response**: Array `{ id, name, description, color, page_count? }`
- **Front-end call**: `getGroups` (`src/services/apiService.js`)

#### `POST /api/groups`
- **Purpose**: Create a new group
- **Request body**: `{ name, description?, color? }`
- **Response**: Created group object
- **Front-end call**: `createGroup` (`src/services/apiService.js`)

#### `PUT /api/groups/:id`
- **Purpose**: Update a group
- **Request body**: `{ name?, description?, color? }`
- **Response**: Updated group object
- **Front-end call**: `updateGroup` (`src/services/apiService.js`)

#### `DELETE /api/groups/:id`
- **Purpose**: Delete a group
- **Response**: `{ success: true }`
- **Front-end call**: `deleteGroup` (`src/services/apiService.js`)

#### `POST /api/groups/sync/push`
- **Purpose**: Push groups to GitHub
- **Response**: Includes stats or action `action: 'no_change'|'synced'`
- **Front-end call**: `syncGroupsPush` (`src/services/apiService.js`)

#### `POST /api/groups/sync/pull`
- **Purpose**: Pull groups from GitHub
- **Response**: Includes stats
- **Front-end call**: `syncGroupsPull` (`src/services/apiService.js`)

#### `POST /api/groups/sync/smart`
- **Purpose**: Smart sync groups (merge local and GitHub changes)
- **Response**: Includes stats or action
- **Front-end call**: `syncGroupsSmart` (`src/services/apiService.js`)

### GitHub Operations

#### `GET /api/github/files`
- **Purpose**: List all HTML files in repository
- **Response**: Array of file paths

#### `GET /api/github/file/:path`
- **Purpose**: Get specific file content
- **Response**: File content

#### `GET /api/github/files/all`
- **Purpose**: Get all files with content
- **Response**: Array of files with their content

#### `POST /api/github/pull-all`
- **Purpose**: Pull all pages from GitHub
- **Response** (example):
```json
{ "success": true, "files": ["a.html", "b.html"], "stats": { "total": 10, "saved": 9 } }
```
- **Front-end call**: `pullAllFromGitHub` (`src/components/storage/PullAllButton.vue`)

#### `POST /api/github/sync`
- **Purpose**: Sync specific file
- **Request body**: `{ path: string }`
- **Response**: Sync result

#### `POST /api/github/pull`
- **Purpose**: Pull single file
- **Request body**: `{ path: string }`
- **Response**: Pull result

### Status Codes & Errors
- **2xx**: Success; returns JSON or binary resources
- **4xx**: Client errors; `apiService.request` wraps into `{ ok: false, error }`
- **5xx**: Server errors; front-end shows messages via `src/utils/dialog.js`

### API Implementation Notes

#### Front-end Service Wrapper
- **Service wrapper**: `src/services/apiService.js`
- **Image flow**: `src/services/imageBlockService.js`, `src/services/imageProcessingService.js`, `src/processes/html-export/exportHelpers.js`, `src/composables/usePageSave.js`
- **Page save/update**: `src/processes/html-save/savePage.js`, `src/processes/html-save/updatePage.js`, `src/components/header/UpdateButton.vue`
- **Storage manager**: `src/components/StorageManager.vue`, `src/components/storage/PullAllButton.vue`
- **GitHub settings**: `src/components/SettingsPanel.vue`

#### Known Issues
- **`POST /api/pages/reorder` payload mismatch**:
  - Front-end sends: `{ pageIds: number[] }`
  - Backend expects: `{ pages: [{ id, sort_order }] }`
  - **Recommendation**: Update front-end to send `{ id, sort_order }` pairs or make backend accept current payload

#### Runtime Requirements
- Start local backend at `http://localhost:3001` (see `backend/server.js`)
- Start front-end with `npm run dev` to interact with the backend APIs

---

## Development Notes

### Image Storage Strategy
1. **Local Database**: Temporary storage during editing (SQLite)
2. **GitHub**: Permanent storage after publishing
3. **URL Formats**:
   - Editor stores: `local://<uuid>`
   - Display uses: `http://localhost:3001/api/images/temp/<uuid>`
   - Published uses: `https://owner.github.io/repo/YYYY/MM/images/filename.avif`

### Automatic Cleanup
- Temporary images older than 24 hours are automatically deleted
- Scheduled cleanup runs daily at midnight (Asia/Shanghai timezone)
- Manual cleanup available via API: `POST /api/images/temp/cleanup`

### Sync Status
- **local-only**: Page only exists in local database
- **synced**: Local and GitHub versions match
- **out-of-sync**: Local was modified after last GitHub upload

### Date-Based Organization
GitHub files are organized by date:
- `YYYY/MM/page.html` - HTML pages
- `YYYY/MM/images/image.avif` - Images

This structure helps with:
- Content organization
- Archive management
- Performance (smaller directory listings)

---

## License
[Project License Information]

## Contributors
[Project Contributors]

