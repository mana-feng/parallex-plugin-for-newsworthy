# Backend API Documentation (Newsworthy Editor)

> Consolidated API documentation based on codebase analysis and backend routes. The service runs at `http://localhost:3001/api` by default.

## Basics
- Base URL: `http://localhost:3001/api`
- Request wrapper: `request(endpoint, options)` in `src/services/apiService.js` using `fetch`
  - Default `Content-Type: application/json`
  - Unified return: `{ ok: boolean, data?: any, error?: string, response?: Response }`
  - JSON is parsed by default; non-JSON returns plain text in `data`
- Auth: none (local service)

## Images: storage / upload
### POST `/images/temp/save`
- Purpose: Save a front-end generated `dataURL` to local backend database (temporary image)
- Request body:
```json
{
  "imageData": "data:image/png;base64,...",
  "filename": "my-image.png",
  "imageId": "optional-id"
}
```
- Response:
```json
{
  "success": true,
  "imageId": "abc123",
  "localUrl": "http://localhost:3001/api/images/temp/abc123",
  "filename": "my-image.png",
  "originalFilename": "my-image.png"
}
```
- Front-end call: `saveTempImage` (`src/services/apiService.js`)
- Backend: `backend/imageBlockAPI.js`

### GET `/images/temp/:imageId`
- Purpose: Fetch temporary image binary for canvas render and export
- Response: `image/*` binary
- Front-end usage: `local://` → `http://localhost:3001/api/images/temp/{id}` (`src/processes/html-export/exportHelpers.js`, `src/composables/usePageSave.js`)

### POST `/images/temp/validate`
- Purpose: Validate existence of a list of temporary image IDs
- Request body:
```json
{ "imageIds": ["id1", "id2"] }
```
- Response:
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
- Front-end call: `validateImageIds` (`src/services/apiService.js`)
- Backend: `backend/imageBlockAPI.js`

### POST `/images/check-conflict`
- Purpose: Check if an image conflicts on GitHub
- Request body:
```json
{ "filename": "a.png", "customDate": "optional" }
```
- Response:
```json
{ "exists": true, "sha": "...", "path": "assets/a.png", "sanitizedFilename": "a.png" }
```
- Front-end call: `checkImageConflict` (`src/services/apiService.js`)

### POST `/images/temp/upload-to-github`
- Purpose: Batch upload temporary images to GitHub, with overwrite/rename strategies
- Request body:
```json
{
  "imageIds": ["id1", "id2"],
  "conflictResolutions": {
    "id1": { "action": "overwrite", "sha": "..." },
    "id2": { "action": "rename", "newFilename": "b-v2.png" }
  }
}
```
- Response (example):
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
- Front-end call: `uploadImagesToGitHub` (`src/services/apiService.js`)
- Backend: `backend/imageBlockAPI.js`

## Pages
### GET `/pages`
- Query: `group_id?: number`, `search?: string`
- Response: array of pages (includes `sync_status`)
- Front-end call: `getPages` (`src/services/apiService.js`)
- Backend: `backend/server.js`

### GET `/pages/:id`
- Response: single page object
- Front-end call: `getPage`

### POST `/pages`
- Purpose: create a new page
- Request body:
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
- Response: page object
- Front-end call: `createPage` (`src/processes/html-save/savePage.js` via `src/services/apiService.js`)

### PUT `/pages/:id`
- Purpose: update a page by ID
- Request body: any page fields (`title/filename/html_content/sections_data/group_id/sort_order/preview_image`)
- Response: updated page object
- Front-end call: `updatePage`

### PUT `/pages/by-filename/:filename`
- Purpose: update a page by filename (used by Update Page button)
- Request body: `{ title?, html_content?, sections_data? }`
- Front-end call: `updatePageByFilename` (`src/components/header/UpdateButton.vue`)

### POST `/pages/reorder`
- Purpose: reorder pages
- Front-end current payload: `{ pageIds: number[] }`
- Backend expected payload: `{ pages: [{ id: number, sort_order: number }] }`
- Response: `{ success: true }`
- Note: payload mismatch; see Notes

### POST `/pages/:id/upload`
- Purpose: upload page content to GitHub
- Response (example):
```json
{ "github_url": "https://github.com/.../my-page.html", "images_uploaded": 3 }
```
- Front-end call: `uploadPageToGitHub`

### DELETE `/pages/:id`
- Response: `{ success: true }`
- Front-end call: `deletePage`

## Groups
### GET `/groups`
- Response: array `{ id, name, description, color, page_count? }`
- Front-end call: `getGroups`

### POST `/groups`
- Request body: `{ name, description?, color? }`
- Response: created group object
- Front-end call: `createGroup`

### PUT `/groups/:id`
- Request body: `{ name?, description?, color? }`
- Response: updated group object
- Front-end call: `updateGroup`

### DELETE `/groups/:id`
- Response: `{ success: true }`
- Front-end call: `deleteGroup`

### Sync to GitHub
- POST `/groups/sync/push` → `syncGroupsPush`
- POST `/groups/sync/pull` → `syncGroupsPull`
- POST `/groups/sync/smart` → `syncGroupsSmart`
- Response includes stats `stats` or action `action: 'no_change'|'synced'`

## GitHub status / operations
### GET `/github/status`
- Response: `{ configured: boolean, owner?: string, repo?: string }`
- Front-end call: `getGitHubStatus`

### POST `/github/pull-all`
- Purpose: pull all pages from GitHub
- Response (example):
```json
{ "success": true, "files": ["a.html", "b.html"], "stats": { "total": 10, "saved": 9 } }
```
- Front-end call: `pullAllFromGitHub`

### GET `/settings/github`
- Response: `{ configured: boolean, config?: { owner, repo, branch, baseUrl } }`
- Front-end call: `getGitHubSettings`

### POST `/settings/github`
- Request body: `{ token, owner, repo, branch, baseUrl? }`
- Response: `{ success: true, message }`
- Front-end call: `saveGitHubSettings`

### POST `/settings/github/test`
- Request body: `{ token, owner, repo }`
- Response: `{ success: true, message }` or `{ success: false, error }`
- Front-end call: `testGitHubConnection`

## Status codes & errors
- 2xx: success; returns JSON or binary resources
- 4xx: client errors; `apiService.request` wraps into `{ ok: false, error }`
- 5xx: server errors; front-end shows messages via `src/utils/dialog.js`

## Notes
- `POST /pages/reorder` payload mismatch between front-end and backend:
  - Front-end: `{ pageIds: number[] }`
  - Backend: `{ pages: [{ id, sort_order }] }`
  - Recommendation: update front-end to send `{ id, sort_order }` pairs or make backend accept current payload

## Front-end call index
- Service wrapper: `src/services/apiService.js`
- Image flow: `src/services/imageBlockService.js`, `src/services/imageProcessingService.js`, `src/processes/html-export/exportHelpers.js`, `src/composables/usePageSave.js`
- Page save/update: `src/processes/html-save/savePage.js`, `src/processes/html-save/updatePage.js`, `src/components/header/UpdateButton.vue`
- Storage manager: `src/components/StorageManager.vue`, `src/components/storage/PullAllButton.vue`
- GitHub settings: `src/components/SettingsPanel.vue`

## Runtime requirements
- Start local backend at `http://localhost:3001` (see `backend/server.js`)
- Start front-end with `npm run dev` to interact with the backend APIs