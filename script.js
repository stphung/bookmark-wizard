class BookmarkWizard {
    constructor() {
        this.bookmarks = null;
        this.selectedItem = null;
        this.currentFolder = null;
        this.filename = null;
        this.collapsedFolders = new Set();
        this.favoriteFolders = new Set();
        this.compactMode = false;
        this.draggedItem = null;
        this.draggedElement = null;
        this.lastOperation = null; // For undo functionality
        
        this.initEventListeners();
    }

    initEventListeners() {
        // File operations
        document.getElementById('loadBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
        
        document.getElementById('fileInput').addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.loadBookmarkFile(e.target.files[0]);
            }
        });

        // Debug button
        document.getElementById('debugBtn').addEventListener('click', () => {
            const hasConsole = document.getElementById('debugConsole');
            if (hasConsole) {
                hasConsole.remove();
            } else {
                this.showDebugConsole();
            }
        });

        
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveBookmarks();
        });

        // Toolbar actions
        document.getElementById('addFolderBtn').addEventListener('click', () => {
            this.showEditModal('folder');
        });
        
        document.getElementById('addBookmarkBtn').addEventListener('click', () => {
            this.showEditModal('bookmark');
        });
        
        document.getElementById('deleteBtn').addEventListener('click', () => {
            this.deleteSelected();
        });

        document.getElementById('undoBtn').addEventListener('click', () => {
            this.undoLastOperation();
        });

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterBookmarks(e.target.value);
        });

        // Modal
        document.querySelector('.close').addEventListener('click', () => {
            this.hideEditModal();
        });
        
        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.hideEditModal();
        });
        
        document.getElementById('editForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEdit();
        });

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('editModal');
            if (e.target === modal) {
                this.hideEditModal();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return; // Don't handle keyboard nav when in input fields
            }
            
            const folderTree = document.getElementById('folderTree');
            const allItems = [...folderTree.querySelectorAll('.folder-item, .bookmark-item')];
            const selectedItem = folderTree.querySelector('.folder-item.selected, .bookmark-item.selected');
            
            if (allItems.length === 0) return;
            
            let currentIndex = selectedItem ? allItems.indexOf(selectedItem) : -1;
            
            switch(e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    if (currentIndex > 0) {
                        this.selectItemByElement(allItems[currentIndex - 1]);
                    }
                    break;
                    
                case 'ArrowDown':
                    e.preventDefault();
                    if (currentIndex < allItems.length - 1) {
                        this.selectItemByElement(allItems[currentIndex + 1]);
                    } else if (currentIndex === -1 && allItems.length > 0) {
                        this.selectItemByElement(allItems[0]);
                    }
                    break;
                    
                case 'ArrowRight':
                    e.preventDefault();
                    if (selectedItem && selectedItem.classList.contains('folder-item')) {
                        const arrow = selectedItem.querySelector('.folder-arrow');
                        if (arrow && !arrow.classList.contains('expanded')) {
                            arrow.click(); // Expand folder
                        }
                    }
                    break;
                    
                case 'ArrowLeft':
                    e.preventDefault();
                    if (selectedItem && selectedItem.classList.contains('folder-item')) {
                        const arrow = selectedItem.querySelector('.folder-arrow');
                        if (arrow && arrow.classList.contains('expanded')) {
                            arrow.click(); // Collapse folder
                        }
                    }
                    break;
                    
                case 'Enter':
                    e.preventDefault();
                    if (selectedItem) {
                        if (selectedItem.classList.contains('bookmark-item')) {
                            // Open bookmark
                            const bookmark = this.selectedItem;
                            if (bookmark && bookmark.url) {
                                window.open(bookmark.url, '_blank');
                            }
                        } else if (selectedItem.classList.contains('folder-item')) {
                            // Toggle folder
                            const arrow = selectedItem.querySelector('.folder-arrow');
                            if (arrow) {
                                arrow.click();
                            }
                        }
                    }
                    break;
                    
                case 'Delete':
                    e.preventDefault();
                    if (this.selectedItem && this.selectedItem !== this.bookmarks) {
                        this.deleteSelected();
                    }
                    break;
                    
                case 'f':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        document.getElementById('searchInput').focus();
                    }
                    break;
                    
                case 'z':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.undoLastOperation();
                    }
                    break;
            }
        });
    }

    selectItemByElement(element) {
        if (!element) return;
        
        if (element.classList.contains('folder-item')) {
            // Find the folder data
            const folderId = element.dataset.folderId;
            const folder = this.findFolderById(folderId);
            if (folder) {
                this.selectFolder(folder, element);
            }
        } else if (element.classList.contains('bookmark-item')) {
            // This is more complex, we need to find the bookmark data
            // For now, just visually select it
            document.querySelectorAll('.bookmark-item.selected, .folder-item.selected').forEach(el => {
                el.classList.remove('selected');
            });
            element.classList.add('selected');
        }
    }

    findFolderById(folderId, folder = null, parentPath = '') {
        const searchFolder = folder || this.bookmarks;
        const currentId = this.getFolderId(searchFolder, parentPath);
        
        if (currentId === folderId) {
            return searchFolder;
        }
        
        for (let child of searchFolder.children) {
            if (child.type === 'folder') {
                const found = this.findFolderById(folderId, child, currentId);
                if (found) return found;
            }
        }
        
        return null;
    }

    async loadBookmarkFile(file) {
        try {
            const text = await file.text();
            console.log('File loaded, size:', text.length, 'characters');
            console.log('First 500 chars:', text.substring(0, 500));
            
            this.filename = file.name;
            this.bookmarks = this.parseBookmarkHTML(text);
            
            console.log('Parsed bookmarks:', this.bookmarks);
            console.log('Total items found:', this.countItems(this.bookmarks));
            
            if (this.bookmarks.children.length === 0) {
                alert('No bookmarks were found in the file. The file might be empty or in an unsupported format.');
                return;
            }
            
            // Start with all folders collapsed
            this.collapseAll();
            
            this.renderBookmarks();
            this.enableButtons();
        } catch (error) {
            console.error('Error loading bookmark file:', error);
            alert('Error loading bookmark file: ' + error.message);
        }
    }

    countItems(folder) {
        let count = 0;
        if (folder.children) {
            folder.children.forEach(child => {
                count++;
                if (child.type === 'folder') {
                    count += this.countItems(child);
                }
            });
        }
        return count;
    }

    parseBookmarkHTML(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const result = {
            type: 'folder',
            name: 'Bookmarks',
            children: []
        };

        // Recursive function to process DL/DT/DD elements
        const processDL = (dlElement, parentFolder) => {
            if (!dlElement) return;
            
            const children = dlElement.children;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                
                if (child.tagName === 'DT') {
                    // Check for H3 (folder) or A (bookmark)
                    const h3 = child.querySelector('h3, H3');
                    const anchor = child.querySelector('a, A');
                    
                    if (h3) {
                        // This is a folder
                        const folder = {
                            type: 'folder',
                            name: h3.textContent.trim() || 'Unnamed Folder',
                            children: []
                        };
                        parentFolder.children.push(folder);
                        
                        // Look for nested DL in next sibling or within current DT
                        let nestedDL = child.querySelector('dl, DL');
                        if (!nestedDL && i + 1 < children.length) {
                            const nextElement = children[i + 1];
                            if (nextElement && (nextElement.tagName === 'DL' || nextElement.tagName === 'DD')) {
                                nestedDL = nextElement.tagName === 'DL' ? nextElement : nextElement.querySelector('dl, DL');
                                i++; // Skip the next element since we're processing it
                            }
                        }
                        
                        if (nestedDL) {
                            processDL(nestedDL, folder);
                        }
                    } else if (anchor) {
                        // This is a bookmark
                        const bookmark = {
                            type: 'bookmark',
                            name: anchor.textContent.trim() || anchor.href || 'Unnamed Bookmark',
                            url: anchor.href || '#',
                            icon: anchor.getAttribute('ICON') || anchor.getAttribute('icon') || ''
                        };
                        parentFolder.children.push(bookmark);
                    }
                } else if (child.tagName === 'DL') {
                    // Process nested DL directly
                    processDL(child, parentFolder);
                } else if (child.tagName === 'DD') {
                    // Some browsers use DD for nested content
                    const nestedDL = child.querySelector('dl, DL');
                    if (nestedDL) {
                        processDL(nestedDL, parentFolder);
                    }
                }
            }
        };

        // Start processing from all DL elements in the document
        const allDLs = doc.querySelectorAll('dl, DL');
        console.log('Found', allDLs.length, 'DL elements');
        
        if (allDLs.length > 0) {
            // Process the first/main DL
            processDL(allDLs[0], result);
        } else {
            // Fallback: look for any bookmarks directly
            const allBookmarks = doc.querySelectorAll('a[href], A[HREF]');
            console.log('Fallback: Found', allBookmarks.length, 'anchor elements');
            
            allBookmarks.forEach(anchor => {
                if (anchor.href && !anchor.href.startsWith('javascript:')) {
                    const bookmark = {
                        type: 'bookmark',
                        name: anchor.textContent.trim() || anchor.href || 'Unnamed Bookmark',
                        url: anchor.href,
                        icon: anchor.getAttribute('ICON') || anchor.getAttribute('icon') || ''
                    };
                    result.children.push(bookmark);
                }
            });
        }

        return result;
    }

    getFolderId(folder, parentPath = '') {
        return parentPath + '/' + folder.name;
    }

    countFolderItems(folder) {
        let bookmarkCount = 0;
        let folderCount = 0;
        
        folder.children.forEach(child => {
            if (child.type === 'bookmark') {
                bookmarkCount++;
            } else if (child.type === 'folder') {
                folderCount++;
                const childCounts = this.countFolderItems(child);
                bookmarkCount += childCounts.bookmarks;
            }
        });
        
        return { bookmarks: bookmarkCount, folders: folderCount };
    }

    renderFolderTree() {
        const container = document.getElementById('folderTree');
        container.innerHTML = '';
        
        // Add compact mode toggle
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'tree-controls';
        controlsDiv.innerHTML = `
            <button class="tree-btn" id="expandAllBtn" title="Expand All">⊞</button>
            <button class="tree-btn" id="collapseAllBtn" title="Collapse All">⊟</button>
            <button class="tree-btn ${this.compactMode ? 'active' : ''}" id="compactModeBtn" title="Compact Mode">☰</button>
        `;
        container.appendChild(controlsDiv);
        
        // Add favorites section
        if (this.favoriteFolders.size > 0) {
            const favHeader = document.createElement('div');
            favHeader.className = 'favorites-header';
            favHeader.innerHTML = '⭐ Favorites';
            container.appendChild(favHeader);
            
            this.favoriteFolders.forEach(folderId => {
                // Render favorite folders here
            });
            
            const divider = document.createElement('hr');
            divider.className = 'favorites-divider';
            container.appendChild(divider);
        }
        
        const renderFolder = (folder, level = 0, parentPath = '', targetContainer = container) => {
            const folderId = this.getFolderId(folder, parentPath);
            const hasSubfolders = folder.children.some(c => c.type === 'folder');
            const hasBookmarks = folder.children.some(c => c.type === 'bookmark');
            const hasAnyChildren = hasSubfolders || (!this.compactMode && hasBookmarks);
            const isCollapsed = this.collapsedFolders.has(folderId);
            const counts = this.countFolderItems(folder);
            
            const folderEl = document.createElement('div');
            folderEl.className = `folder-item ${this.compactMode ? 'compact' : ''} ${level === 0 ? 'root-folder' : ''}`;
            folderEl.style.marginLeft = `${level * 1}rem`;
            folderEl.dataset.folderId = folderId;
            
            const arrow = hasAnyChildren ? 
                `<span class="folder-arrow ${isCollapsed ? 'collapsed' : 'expanded'}">▶</span>` : 
                '<span class="folder-arrow-placeholder"></span>';
            
            const favoriteBtn = level > 0 ? 
                `<span class="favorite-btn ${this.favoriteFolders.has(folderId) ? 'active' : ''}" title="Add to favorites">☆</span>` : '';
            
            folderEl.innerHTML = `
                ${arrow}
                <span class="folder-icon">📁</span>
                <span class="folder-name">${folder.name}</span>
                <span class="folder-badge">${counts.bookmarks}</span>
                ${favoriteBtn}
            `;
            
            // Make folders draggable (except root)
            if (level > 0) {
                folderEl.draggable = true;
                folderEl.dataset.itemType = 'folder';
                folderEl.dataset.itemData = JSON.stringify(folder);
            }
            
            // Handle arrow click for expand/collapse
            const arrowEl = folderEl.querySelector('.folder-arrow');
            if (arrowEl && hasAnyChildren) {
                arrowEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleFolder(folderId);
                });
            }
            
            // Handle favorite button
            const favBtn = folderEl.querySelector('.favorite-btn');
            if (favBtn) {
                favBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleFavorite(folderId, folder);
                });
            }
            
            // Handle folder selection
            folderEl.addEventListener('click', () => {
                this.selectFolder(folder, folderEl);
            });
            
            // Drag and drop event handlers
            this.addDragHandlers(folderEl, folder);
            this.addDropHandlers(folderEl, folder);
            
            targetContainer.appendChild(folderEl);
            
            // Only show children if not collapsed
            if (!isCollapsed) {
                // Sort children: folders first, then bookmarks
                const sortedChildren = [...folder.children].sort((a, b) => {
                    if (a.type === 'folder' && b.type === 'bookmark') return -1;
                    if (a.type === 'bookmark' && b.type === 'folder') return 1;
                    return 0;
                });
                
                // Create a container for this folder's children
                const childContainer = document.createElement('div');
                childContainer.className = 'folder-children';
                childContainer.dataset.parentId = folderId;
                
                // First pass: Add all subfolders
                sortedChildren.forEach(child => {
                    if (child.type === 'folder') {
                        renderFolder(child, level + 1, folderId, childContainer);
                    }
                });
                
                // Second pass: Add all bookmarks (only if not in compact mode)
                if (!this.compactMode) {
                    sortedChildren.forEach(child => {
                        if (child.type === 'bookmark') {
                            const bookmarkEl = document.createElement('div');
                            bookmarkEl.className = 'bookmark-item';
                            bookmarkEl.style.marginLeft = `${(level + 1) * 1}rem`;
                            bookmarkEl.draggable = true;
                            bookmarkEl.dataset.itemType = 'bookmark';
                            bookmarkEl.dataset.itemData = JSON.stringify(child);
                            
                            const favicon = child.icon ? 
                                `<img class="favicon" src="${child.icon}" alt="" onerror="this.style.display='none'">` :
                                '🔖';
                            
                            bookmarkEl.innerHTML = `
                                ${favicon}
                                <span class="bookmark-name">${child.name}</span>
                            `;
                            
                            bookmarkEl.addEventListener('click', () => {
                                this.selectBookmark(child, bookmarkEl);
                            });
                            
                            // Add drag handlers for bookmarks
                            this.addDragHandlers(bookmarkEl, child);
                            
                            childContainer.appendChild(bookmarkEl);
                        }
                    });
                }
                
                // Only append the child container if it has content
                if (childContainer.children.length > 0) {
                    targetContainer.appendChild(childContainer);
                }
            }
        };

        if (this.bookmarks) {
            renderFolder(this.bookmarks);
        }
        
        // Set up control button handlers
        document.getElementById('expandAllBtn')?.addEventListener('click', () => {
            this.expandAll();
        });
        
        document.getElementById('collapseAllBtn')?.addEventListener('click', () => {
            this.collapseAll();
        });
        
        document.getElementById('compactModeBtn')?.addEventListener('click', () => {
            this.toggleCompactMode();
        });
    }

    toggleFolder(folderId) {
        if (this.collapsedFolders.has(folderId)) {
            this.collapsedFolders.delete(folderId);
        } else {
            this.collapsedFolders.add(folderId);
        }
        this.renderFolderTree();
    }

    expandAll() {
        this.collapsedFolders.clear();
        this.renderFolderTree();
    }

    collapseAll() {
        const addAllFolders = (folder, parentPath = '') => {
            const folderId = this.getFolderId(folder, parentPath);
            // Collapse ANY folder that has children (folders OR bookmarks)
            if (folder.children && folder.children.length > 0) {
                this.collapsedFolders.add(folderId);
            }
            folder.children.forEach(child => {
                if (child.type === 'folder') {
                    addAllFolders(child, folderId);
                }
            });
        };
        
        if (this.bookmarks) {
            addAllFolders(this.bookmarks);
        }
        this.renderFolderTree();
    }

    toggleCompactMode() {
        this.compactMode = !this.compactMode;
        this.renderFolderTree();
    }

    toggleFavorite(folderId, folder) {
        if (this.favoriteFolders.has(folderId)) {
            this.favoriteFolders.delete(folderId);
        } else {
            this.favoriteFolders.add(folderId);
        }
        this.renderFolderTree();
    }

    addDragHandlers(element, item) {
        element.addEventListener('dragstart', (e) => {
            this.draggedItem = item;
            this.draggedElement = element;
            element.classList.add('dragging');
            
            // Set drag data
            e.dataTransfer.setData('text/plain', JSON.stringify(item));
            e.dataTransfer.effectAllowed = 'move';
            
            // Add visual feedback
            setTimeout(() => {
                element.style.opacity = '0.5';
            }, 0);
        });
        
        element.addEventListener('dragend', (e) => {
            element.classList.remove('dragging');
            element.style.opacity = '';
            this.clearDropIndicators();
            this.draggedItem = null;
            this.draggedElement = null;
        });
    }

    addDropHandlers(element, folder) {
        element.addEventListener('dragover', (e) => {
            if (!this.draggedItem || this.draggedItem === folder) return;
            
            // Stop event propagation to prevent parent containers from triggering
            e.stopPropagation();
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            // Prevent dropping folder into itself or its descendants
            if (this.draggedItem.type === 'folder' && this.isDescendant(this.draggedItem, folder)) {
                e.dataTransfer.dropEffect = 'none';
                return;
            }
            
            // Clear other drop zone highlights first
            this.clearDropIndicators();
            element.classList.add('drop-zone-active');
        });
        
        element.addEventListener('dragleave', (e) => {
            e.stopPropagation();
            // Only remove highlight if we're actually leaving this specific element
            const rect = element.getBoundingClientRect();
            const x = e.clientX;
            const y = e.clientY;
            
            if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                element.classList.remove('drop-zone-active');
            }
        });
        
        element.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            element.classList.remove('drop-zone-active');
            
            if (!this.draggedItem || this.draggedItem === folder) return;
            
            // Prevent dropping folder into itself or its descendants
            if (this.draggedItem.type === 'folder' && this.isDescendant(this.draggedItem, folder)) {
                return;
            }
            
            this.moveItem(this.draggedItem, folder);
        });
    }

    isDescendant(possibleAncestor, possibleDescendant) {
        const checkDescendant = (folder) => {
            if (folder === possibleDescendant) return true;
            for (let child of folder.children || []) {
                if (child.type === 'folder' && checkDescendant(child)) {
                    return true;
                }
            }
            return false;
        };
        return checkDescendant(possibleAncestor);
    }

    moveItem(item, targetFolder) {
        // Store operation for undo
        const sourceFolder = this.findParentFolder(item);
        this.lastOperation = {
            type: 'move',
            item: item,
            from: sourceFolder,
            to: targetFolder
        };
        
        // Remove from source
        this.removeItemFromParent(item);
        
        // Add to target
        targetFolder.children.push(item);
        
        // Re-render the interface
        this.renderFolderTree();
        this.renderBookmarks();
        this.updateButtons();
        
        console.log(`Moved ${item.type} "${item.name}" to folder "${targetFolder.name}"`);
    }

    undoLastOperation() {
        if (!this.lastOperation || this.lastOperation.type !== 'move') {
            return;
        }
        
        const { item, from, to } = this.lastOperation;
        
        // Remove from current location
        this.removeItemFromParent(item);
        
        // Add back to original location
        from.children.push(item);
        
        // Clear the operation
        this.lastOperation = null;
        
        // Re-render the interface
        this.renderFolderTree();
        this.renderBookmarks();
        this.updateButtons();
        
        console.log(`Undid move: ${item.type} "${item.name}" back to "${from.name}"`);
    }

    findParentFolder(targetItem, folder = null) {
        const searchFolder = folder || this.bookmarks;
        
        for (let child of searchFolder.children) {
            if (child === targetItem) {
                return searchFolder;
            }
            if (child.type === 'folder') {
                const found = this.findParentFolder(targetItem, child);
                if (found) return found;
            }
        }
        return null;
    }

    removeItemFromParent(targetItem, folder = null) {
        const searchFolder = folder || this.bookmarks;
        
        for (let i = 0; i < searchFolder.children.length; i++) {
            if (searchFolder.children[i] === targetItem) {
                searchFolder.children.splice(i, 1);
                return true;
            }
            if (searchFolder.children[i].type === 'folder') {
                if (this.removeItemFromParent(targetItem, searchFolder.children[i])) {
                    return true;
                }
            }
        }
        return false;
    }

    clearDropIndicators() {
        document.querySelectorAll('.drop-zone-active').forEach(el => {
            el.classList.remove('drop-zone-active');
        });
    }

    renderBookmarks(folder = null) {
        const container = document.getElementById('bookmarkGrid');
        const targetFolder = folder || this.currentFolder || this.bookmarks;
        
        if (!targetFolder) {
            container.innerHTML = '<div class="empty-state"><h3>No bookmarks loaded</h3></div>';
            return;
        }

        const bookmarks = targetFolder.children.filter(child => child.type === 'bookmark');
        
        if (bookmarks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>${targetFolder.name}</h3>
                    <p>This folder contains no bookmarks</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        
        bookmarks.forEach(bookmark => {
            const card = document.createElement('div');
            card.className = 'bookmark-card';
            card.draggable = true;
            card.dataset.itemType = 'bookmark';
            card.dataset.itemData = JSON.stringify(bookmark);
            
            const favicon = bookmark.icon ? 
                `<img class="favicon" src="${bookmark.icon}" alt="" onerror="this.style.display='none'">` :
                '🔖';
            
            card.innerHTML = `
                ${favicon}
                <div class="bookmark-info">
                    <div class="bookmark-title">${bookmark.name}</div>
                    <div class="bookmark-url">${bookmark.url}</div>
                </div>
            `;
            
            card.addEventListener('click', () => {
                this.selectBookmarkCard(bookmark, card);
            });
            
            card.addEventListener('dblclick', () => {
                window.open(bookmark.url, '_blank');
            });
            
            // Add drag handlers for bookmark cards
            this.addDragHandlers(card, bookmark);
            
            container.appendChild(card);
        });
    }

    selectFolder(folder, element) {
        // Remove previous selection
        document.querySelectorAll('.folder-item.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        if (element) {
            element.classList.add('selected');
        }
        this.currentFolder = folder;
        this.selectedItem = folder;
        this.renderBookmarks(folder);
        this.updateBreadcrumb(folder);
        this.updateButtons();
    }

    updateBreadcrumb(folder) {
        const breadcrumb = document.getElementById('breadcrumb');
        if (!breadcrumb) return;
        
        // Build path from root to current folder
        const path = [];
        const buildPath = (current, target) => {
            if (current === target) {
                path.push(current);
                return true;
            }
            if (current.children) {
                for (let child of current.children) {
                    if (child.type === 'folder') {
                        if (buildPath(child, target)) {
                            path.unshift(current);
                            return true;
                        }
                    }
                }
            }
            return false;
        };
        
        if (this.bookmarks) {
            buildPath(this.bookmarks, folder);
        }
        
        // Render breadcrumb
        breadcrumb.innerHTML = '';
        path.forEach((item, index) => {
            const span = document.createElement('span');
            span.className = 'breadcrumb-item';
            span.textContent = item.name === 'Bookmarks' ? 'Home' : item.name;
            span.addEventListener('click', () => {
                this.selectFolder(item, null);
                // Find and highlight the folder in the tree
                const folderEl = document.querySelector(`[data-folder-id="${this.getFolderId(item, '')}"]`);
                if (folderEl) {
                    folderEl.classList.add('selected');
                }
            });
            breadcrumb.appendChild(span);
        });
    }

    selectBookmark(bookmark, element) {
        // Remove previous selection
        document.querySelectorAll('.bookmark-item.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        element.classList.add('selected');
        this.selectedItem = bookmark;
        this.updateButtons();
    }

    selectBookmarkCard(bookmark, element) {
        // Remove previous selection
        document.querySelectorAll('.bookmark-card.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        element.classList.add('selected');
        this.selectedItem = bookmark;
        this.updateButtons();
    }

    updateButtons() {
        const deleteBtn = document.getElementById('deleteBtn');
        const undoBtn = document.getElementById('undoBtn');
        
        deleteBtn.disabled = !this.selectedItem || this.selectedItem === this.bookmarks;
        undoBtn.disabled = !this.lastOperation || this.lastOperation.type !== 'move';
    }

    enableButtons() {
        document.getElementById('saveBtn').disabled = false;
        document.getElementById('addFolderBtn').disabled = false;
        document.getElementById('addBookmarkBtn').disabled = false;
        this.updateButtons(); // This will set the correct state for undo button
    }

    showEditModal(type, item = null) {
        const modal = document.getElementById('editModal');
        const title = document.getElementById('modalTitle');
        const nameInput = document.getElementById('itemName');
        const urlInput = document.getElementById('itemUrl');
        const urlGroup = document.getElementById('urlGroup');
        
        if (type === 'folder') {
            title.textContent = item ? 'Edit Folder' : 'New Folder';
            urlGroup.style.display = 'none';
            nameInput.value = item ? item.name : '';
        } else {
            title.textContent = item ? 'Edit Bookmark' : 'New Bookmark';
            urlGroup.style.display = 'block';
            nameInput.value = item ? item.name : '';
            urlInput.value = item ? item.url : '';
        }
        
        modal.style.display = 'block';
        nameInput.focus();
        
        this.editingItem = item;
        this.editingType = type;
    }

    hideEditModal() {
        document.getElementById('editModal').style.display = 'none';
        this.editingItem = null;
        this.editingType = null;
    }

    saveEdit() {
        const nameInput = document.getElementById('itemName');
        const urlInput = document.getElementById('itemUrl');
        const name = nameInput.value.trim();
        const url = urlInput.value.trim();
        
        if (!name) {
            alert('Name is required');
            return;
        }
        
        if (this.editingType === 'bookmark' && !url) {
            alert('URL is required for bookmarks');
            return;
        }
        
        if (this.editingItem) {
            // Edit existing item
            this.editingItem.name = name;
            if (this.editingType === 'bookmark') {
                this.editingItem.url = url;
            }
        } else {
            // Create new item
            const newItem = {
                type: this.editingType,
                name: name
            };
            
            if (this.editingType === 'bookmark') {
                newItem.url = url;
                newItem.icon = '';
            } else {
                newItem.children = [];
            }
            
            const targetFolder = this.currentFolder || this.bookmarks;
            targetFolder.children.push(newItem);
        }
        
        this.renderFolderTree();
        this.renderBookmarks();
        this.hideEditModal();
    }

    deleteSelected() {
        if (!this.selectedItem || this.selectedItem === this.bookmarks) return;
        
        if (confirm(`Are you sure you want to delete "${this.selectedItem.name}"?`)) {
            this.deleteFromTree(this.bookmarks, this.selectedItem);
            this.selectedItem = null;
            this.renderFolderTree();
            this.renderBookmarks();
            this.updateButtons();
        }
    }

    deleteFromTree(parent, target) {
        for (let i = 0; i < parent.children.length; i++) {
            if (parent.children[i] === target) {
                parent.children.splice(i, 1);
                return true;
            }
            if (parent.children[i].type === 'folder') {
                if (this.deleteFromTree(parent.children[i], target)) {
                    return true;
                }
            }
        }
        return false;
    }

    showDebugConsole() {
        const console = document.createElement('div');
        console.id = 'debugConsole';
        console.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 200px;
            background: #1e1e1e;
            color: #fff;
            padding: 10px;
            overflow-y: auto;
            font-family: monospace;
            font-size: 12px;
            z-index: 9999;
            border-top: 2px solid #333;
        `;
        
        const logs = [
            'Debug Console Opened',
            'Instructions:',
            '1. Try loading your bookmark file',
            '2. Check browser console (F12) for detailed logs',
            '3. You can also drag and drop HTML files onto this window',
            '',
            'Bookmarks loaded: ' + (this.bookmarks ? 'Yes' : 'No'),
            'Total items: ' + (this.bookmarks ? this.countItems(this.bookmarks) : 0)
        ];
        
        console.innerHTML = logs.map(log => `<div>${log}</div>`).join('');
        document.body.appendChild(console);
    }

    filterBookmarks(query) {
        if (!this.bookmarks || !query.trim()) {
            this.renderBookmarks();
            return;
        }
        
        const filteredBookmarks = this.searchBookmarks(this.bookmarks, query.toLowerCase());
        const container = document.getElementById('bookmarkGrid');
        
        if (filteredBookmarks.length === 0) {
            container.innerHTML = '<div class="empty-state"><h3>No bookmarks found</h3></div>';
            return;
        }
        
        container.innerHTML = '';
        
        filteredBookmarks.forEach(bookmark => {
            const card = document.createElement('div');
            card.className = 'bookmark-card';
            
            const favicon = bookmark.icon ? 
                `<img class="favicon" src="${bookmark.icon}" alt="" onerror="this.style.display='none'">` :
                '🔖';
            
            card.innerHTML = `
                ${favicon}
                <div class="bookmark-info">
                    <div class="bookmark-title">${bookmark.name}</div>
                    <div class="bookmark-url">${bookmark.url}</div>
                </div>
            `;
            
            card.addEventListener('click', () => {
                this.selectBookmarkCard(bookmark, card);
            });
            
            card.addEventListener('dblclick', () => {
                window.open(bookmark.url, '_blank');
            });
            
            container.appendChild(card);
        });
    }

    searchBookmarks(folder, query) {
        let results = [];
        
        folder.children.forEach(child => {
            if (child.type === 'bookmark') {
                if (child.name.toLowerCase().includes(query) || 
                    child.url.toLowerCase().includes(query)) {
                    results.push(child);
                }
            } else if (child.type === 'folder') {
                results = results.concat(this.searchBookmarks(child, query));
            }
        });
        
        return results;
    }

    saveBookmarks() {
        if (!this.bookmarks) return;
        
        const html = this.generateBookmarkHTML(this.bookmarks);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = this.filename || 'bookmarks.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    generateBookmarkHTML(bookmarks) {
        const generateFolder = (folder, level = 0) => {
            let html = '';
            const indent = '    '.repeat(level);
            
            folder.children.forEach(child => {
                if (child.type === 'folder') {
                    html += `${indent}<DT><H3>${child.name}</H3>\n`;
                    html += `${indent}<DL><p>\n`;
                    html += generateFolder(child, level + 1);
                    html += `${indent}</DL><p>\n`;
                } else if (child.type === 'bookmark') {
                    const icon = child.icon ? ` ICON="${child.icon}"` : '';
                    html += `${indent}<DT><A HREF="${child.url}"${icon}>${child.name}</A>\n`;
                }
            });
            
            return html;
        };
        
        return `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
${generateFolder(bookmarks, 1)}</DL><p>`;
    }
}

// Initialize the application
const bookmarkWizard = new BookmarkWizard();