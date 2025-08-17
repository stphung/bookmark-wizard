# Bookmark Wizard

A local web application for managing and organizing browser bookmark HTML files with a familiar browser-like experience.

## Features

- **Load & Parse**: Import standard bookmark HTML files exported from any browser
- **Visual Organization**: Browse bookmarks in a folder tree structure
- **Search**: Quick search across all bookmarks by name or URL
- **Edit**: Add, edit, and delete bookmarks and folders
- **Export**: Save your organized bookmarks back to HTML format
- **Browser-like Interface**: Familiar folder tree sidebar and bookmark grid view

## Getting Started

1. **Open the Application**
   Simply open `index.html` in your web browser.

2. **Load Your Bookmarks**
   - Click "Load Bookmarks" button
   - Select your bookmark HTML file (exported from any browser)
   - Your bookmarks will appear in the folder tree on the left

3. **Organize Your Bookmarks**
   - Click folders in the sidebar to view their contents
   - Use the search box to find specific bookmarks
   - Double-click any bookmark to open it in a new tab

4. **Edit Bookmarks**
   - **Add Folder**: Click "+ New Folder" to create a new folder
   - **Add Bookmark**: Click "+ New Bookmark" to add a new bookmark
   - **Edit**: Select an item and edit its properties
   - **Delete**: Select an item and click "Delete" to remove it

5. **Save Your Changes**
   Click "Save Bookmarks" to download your organized bookmarks as an HTML file.

## File Structure

```
bookmark-wizard/
├── index.html          # Main application page
├── styles.css          # Application styles
├── script.js           # Application logic
├── sample-bookmarks.html # Sample bookmark file for testing
└── README.md           # This file
```

## How to Export Bookmarks from Browsers

### Chrome/Edge
1. Open Bookmark Manager (Ctrl+Shift+O)
2. Click the three dots menu
3. Select "Export bookmarks"

### Firefox
1. Open Bookmark Manager (Ctrl+Shift+O)
2. Click "Import and Backup"
3. Select "Export Bookmarks to HTML"

### Safari
1. File menu → Export → Bookmarks
2. Save as HTML file

## Browser Compatibility

Works with modern browsers including:
- Chrome/Chromium
- Firefox
- Safari
- Edge

## Tips

- **Drag & Drop**: Drag bookmarks and folders to reorganize them between folders
- **Keyboard Shortcuts**: Use arrow keys to navigate, Enter to open, Ctrl+Z to undo moves
- **Double-click** bookmarks to open them in a new tab
- **Search bar** for quick filtering across all bookmarks
- **Undo button** (↶) or Ctrl+Z to reverse the last move operation
- The application saves your bookmark structure when you click "Save Bookmarks"
- Your original bookmark file remains unchanged - a new file is downloaded

## Privacy

This application runs entirely in your browser. No data is sent to any server. Your bookmarks remain private and local to your machine.