# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Run the application:**
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000 in your browser.

**Testing:**
Use the included `sample-bookmarks.html` file for testing bookmark import functionality.

## Architecture Overview

This is a client-side JavaScript application for managing browser bookmark HTML files. The app consists of three main files that work together:

### Core Application Structure

**BookmarkWizard Class** (`script.js`):
- Main application controller with state management
- Key state properties: `bookmarks` (parsed tree), `selectedItem`, `currentFolder`, `collapsedFolders`, `favoriteFolders`, `compactMode`
- Handles all user interactions and DOM manipulation

### Key Data Flow

1. **File Import**: `loadBookmarkFile()` → `parseBookmarkHTML()` → renders UI
2. **Navigation**: User clicks folder → `selectFolder()` → updates `currentFolder` → `renderBookmarks()` + `updateBreadcrumb()`
3. **Tree Rendering**: `renderFolderTree()` recursively builds collapsible folder hierarchy
4. **Export**: `saveBookmarks()` → `generateBookmarkHTML()` → downloads file

### Important Implementation Details

**Bookmark Data Structure**: 
- Folders: `{type: 'folder', name: string, children: []}`
- Bookmarks: `{type: 'bookmark', name: string, url: string, icon: string}`

**Folder State Management**:
- `collapsedFolders` Set tracks collapsed state by folder ID path
- `getFolderId()` generates unique IDs: "parentPath/folderName"
- All folders start collapsed on load via `collapseAll()`

**Rendering Logic**:
- `renderFolder()` recursively renders with proper container targeting
- Children sorted: folders first, then bookmarks
- Compact mode hides individual bookmarks in sidebar tree

**Navigation Features**:
- Breadcrumb navigation shows full path to current folder
- Keyboard navigation: arrow keys, Enter, Delete, Ctrl+F
- Favorites system with star icons for quick access

### HTML Parser Requirements

The `parseBookmarkHTML()` method handles various browser export formats:
- Supports both uppercase and lowercase HTML tags (DL/dl, DT/dt, H3/h3, A/a)
- Handles nested folder structures with DT→H3 (folders) and DT→A (bookmarks)
- Falls back to finding all anchor tags if standard structure not found

### UI Components

**Sidebar**: Collapsible folder tree with controls (expand/collapse all, compact mode toggle)
**Main Area**: Breadcrumb navigation + bookmark grid display
**Modal**: Edit dialog for adding/editing bookmarks and folders

### State Persistence

No backend - all state is in-memory. Changes persist until page reload unless exported to HTML file.