import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Icons } from './components/Icons';
import { Button } from './components/Button';
import { StatsPage } from './components/StatsPage';
import { LandingPage } from './components/LandingPage';
import { ExportDialog } from './components/ExportDialog';
import { Sidebar } from './components/Sidebar';
import { Editor, EditorHandle } from './components/Editor';
import { AppState, Book, FileNode, NodeType, FileCategory, ViewMode, User, ExportConfig, AssistantMessage } from './types';

// Utility for ID generation
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// Initial State
const initialBookId = 'book-1';
const initialRootId = 'root-1';
const initialFileId = 'file-1';

const defaultState: AppState = {
  view: ViewMode.LANDING,
  user: null,
  books: [{
    id: initialBookId,
    title: 'The Golden Age',
    rootFolderId: initialRootId,
    status: 'Drafting'
  }],
  fileMap: {
    [initialRootId]: {
      id: initialRootId,
      parentId: null,
      title: 'Root',
      type: NodeType.FOLDER,
      children: [initialFileId],
      lastModified: Date.now(),
      isOpen: true
    },
    [initialFileId]: {
      id: initialFileId,
      parentId: initialRootId,
      title: 'Chapter 1: The Beginning',
      type: NodeType.FILE,
      category: FileCategory.CHAPTER,
      content: '# Chapter 1: The Beginning\n\nThe sun rose over the horizon, casting a golden hue across the valley. It was the start of something new, something... magical.',
      wordCount: 26,
      lastModified: Date.now()
    }
  },
  activeBookId: initialBookId,
  activeFileId: initialFileId,
  darkMode: false,
  focusMode: false,
  sidebarOpen: true,
  assistantOpen: false,
  assistantHistory: []
};

const App: React.FC = () => {
  // --- State ---
  const [state, setState] = useState<AppState>(() => {
    // Try to restore full state or just user session
    const savedState = localStorage.getItem('better-writer-state');
    const savedUser = localStorage.getItem('better-writer-user');

    let initialState = savedState ? JSON.parse(savedState) : defaultState;

    // Auto-detect system theme preference if not saved
    if (!savedState) {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        initialState.darkMode = true;
      }
    }

    if (savedUser) {
      initialState.user = JSON.parse(savedUser);
      if (initialState.view === ViewMode.LANDING) {
        initialState.view = ViewMode.EDITOR;
      }
    }

    return initialState;
  });

  const [userActivity, setUserActivity] = useState(true);
  const [showExport, setShowExport] = useState(false);

  // Timer for focus mode activity detection
  const activityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<EditorHandle>(null);

  // --- Effects ---

  // Persist State
  useEffect(() => {
    localStorage.setItem('better-writer-state', JSON.stringify(state));
  }, [state]);

  // Persist User separately for "Real Auth" feel
  useEffect(() => {
    if (state.user) {
      localStorage.setItem('better-writer-user', JSON.stringify(state.user));
    } else {
      localStorage.removeItem('better-writer-user');
    }
  }, [state.user]);

  // Theme Management
  useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.darkMode]);

  // Focus Mode Mouse Tracking
  useEffect(() => {
    if (!state.focusMode) return;

    const handleActivity = () => {
      setUserActivity(true);
      if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
      activityTimeoutRef.current = setTimeout(() => {
        setUserActivity(false);
      }, 1500); // Faster fade out
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
    };
  }, [state.focusMode]);

  // --- Helpers ---

  const activeFile = state.activeFileId ? state.fileMap[state.activeFileId] : null;
  const activeBook = state.books.find(b => b.id === state.activeBookId);

  const updateFileContent = (id: string, content: string) => {
    const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
    setState(prev => ({
      ...prev,
      fileMap: {
        ...prev.fileMap,
        [id]: {
          ...prev.fileMap[id],
          content,
          wordCount,
          lastModified: Date.now()
        }
      }
    }));
  };

  const updateFileTitle = (id: string, title: string) => {
    setState(prev => ({
      ...prev,
      fileMap: {
        ...prev.fileMap,
        [id]: { ...prev.fileMap[id], title }
      }
    }));
  }

  const createNode = (type: NodeType, parentId: string) => {
    const newId = generateId();
    const newNode: FileNode = {
      id: newId,
      parentId,
      title: type === NodeType.FOLDER ? 'New Folder' : 'Untitled',
      type,
      category: FileCategory.IDEA,
      content: type === NodeType.FILE ? '' : undefined,
      children: type === NodeType.FOLDER ? [] : undefined,
      isOpen: true,
      wordCount: 0,
      lastModified: Date.now()
    };

    setState(prev => {
      const parent = prev.fileMap[parentId];
      return {
        ...prev,
        fileMap: {
          ...prev.fileMap,
          [parentId]: {
            ...parent,
            children: [...(parent.children || []), newId],
            isOpen: true // Ensure parent is open when adding child
          },
          [newId]: newNode
        },
        activeFileId: type === NodeType.FILE ? newId : prev.activeFileId
      };
    });
  };

  const deleteNode = (nodeId: string) => {
    // Prevent deletion of root nodes (safeguard)
    if (state.books.some(b => b.rootFolderId === nodeId)) {
      alert("Cannot delete the root folder of a project.");
      return;
    }

    setState(prev => {
      const node = prev.fileMap[nodeId];
      if (!node) return prev;

      // Safety check: if node has no parent, we just remove it from map
      // but if it's not a root, it should have a parent.
      if (!node.parentId) {
        const newFileMap = { ...prev.fileMap };
        delete newFileMap[nodeId];

        // Check if we deleted the active file
        const isActiveDeleted = prev.activeFileId === nodeId;

        return {
          ...prev,
          fileMap: newFileMap,
          activeFileId: isActiveDeleted ? null : prev.activeFileId
        };
      }

      const parent = prev.fileMap[node.parentId];
      if (!parent) return prev; // Should not happen

      // Remove from parent's children
      const newChildren = parent.children?.filter(id => id !== nodeId) || [];

      // Create new file map
      const newFileMap = { ...prev.fileMap };

      // Recursively delete children
      const cleanupChildren = (id: string, map: Record<string, FileNode>) => {
        const item = map[id];
        if (item && item.children) {
          item.children.forEach(childId => cleanupChildren(childId, map));
        }
        delete map[id];
      };

      cleanupChildren(nodeId, newFileMap);

      // Update parent
      newFileMap[node.parentId] = {
        ...parent,
        children: newChildren
      };

      // Check if active file was deleted (directly or via parent)
      const isActiveFileStillExists = !!newFileMap[prev.activeFileId || ''];

      return {
        ...prev,
        fileMap: newFileMap,
        activeFileId: isActiveFileStillExists ? prev.activeFileId : null
      };
    });
  };

  const toggleFolder = (nodeId: string) => {
    setState(prev => ({
      ...prev,
      fileMap: {
        ...prev.fileMap,
        [nodeId]: {
          ...prev.fileMap[nodeId],
          isOpen: !prev.fileMap[nodeId].isOpen
        }
      }
    }));
  };

  const renameNode = (id: string, newTitle: string) => {
    updateFileTitle(id, newTitle);
  };

  // --- Project Management ---

  const createBook = () => {
    const newBookId = generateId();
    const newRootId = generateId();

    const newBook: Book = {
      id: newBookId,
      title: 'New Project',
      rootFolderId: newRootId,
      status: 'Planning'
    };

    const newRoot: FileNode = {
      id: newRootId,
      parentId: null,
      title: 'Root',
      type: NodeType.FOLDER,
      children: [],
      isOpen: true,
      lastModified: Date.now()
    };

    setState(prev => ({
      ...prev,
      books: [...prev.books, newBook],
      fileMap: { ...prev.fileMap, [newRootId]: newRoot },
      activeBookId: newBookId,
      activeFileId: null
    }));
  };

  const deleteBook = (bookId: string) => {
    if (state.books.length <= 1) {
      alert("You must have at least one project.");
      return;
    }

    const confirmDelete = window.confirm("Are you sure you want to delete this project? This cannot be undone.");
    if (!confirmDelete) return;

    setState(prev => {
      const newBooks = prev.books.filter(b => b.id !== bookId);
      // If we deleted the active book, switch to the first available one
      const nextBook = newBooks[0];

      return {
        ...prev,
        books: newBooks,
        activeBookId: prev.activeBookId === bookId ? nextBook.id : prev.activeBookId,
        activeFileId: prev.activeBookId === bookId ? null : prev.activeFileId
      };
    });
  };

  const renameBook = (bookId: string, newTitle: string) => {
    setState(prev => ({
      ...prev,
      books: prev.books.map(b => b.id === bookId ? { ...b, title: newTitle } : b)
    }));
  }

  const switchBook = (bookId: string) => {
    setState(prev => ({
      ...prev,
      activeBookId: bookId,
      activeFileId: null // Reset active file when switching context
    }));
  };

  // Import Handler (Flattened for simplicity)
  const handleImport = (fileList: FileList) => {
    if (!activeBook) return;
    const rootId = activeBook.rootFolderId;

    Array.from(fileList).forEach(file => {
      if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          const newId = generateId();
          const newNode: FileNode = {
            id: newId,
            parentId: rootId,
            title: file.name.replace(/\.(txt|md)$/, ''),
            type: NodeType.FILE,
            content,
            wordCount: content.split(/\s+/).length,
            lastModified: Date.now()
          };

          setState(prev => ({
            ...prev,
            fileMap: {
              ...prev.fileMap,
              [rootId]: {
                ...prev.fileMap[rootId],
                children: [...(prev.fileMap[rootId].children || []), newId]
              },
              [newId]: newNode
            }
          }));
        };
        reader.readAsText(file);
      }
    });
  };

  const handleReorganize = (folders: { name: string; fileIds: string[] }[]) => {
    if (!activeBook) return;
    const rootId = activeBook.rootFolderId;

    setState(prev => {
      let newFileMap = { ...prev.fileMap };
      const root = newFileMap[rootId];
      const currentRootChildren = new Set(root.children);

      folders.forEach(folder => {
        const folderId = generateId();
        const newFolder: FileNode = {
          id: folderId,
          parentId: rootId,
          title: folder.name,
          type: NodeType.FOLDER,
          children: [],
          isOpen: true,
          lastModified: Date.now(),
          wordCount: 0
        };
        newFileMap[folderId] = newFolder;
        currentRootChildren.add(folderId);

        folder.fileIds.forEach(fileId => {
          if (newFileMap[fileId]) {
            currentRootChildren.delete(fileId);
            newFileMap[fileId] = {
              ...newFileMap[fileId],
              parentId: folderId
            };
            newFolder.children!.push(fileId);
          }
        });
      });

      newFileMap[rootId] = {
        ...root,
        children: Array.from(currentRootChildren)
      };

      return { ...prev, fileMap: newFileMap };
    });
  };

  const handleLogin = (user: User) => {
    setState(prev => ({ ...prev, user, view: ViewMode.EDITOR }));
  };

  const handleLogout = () => {
    setState(prev => ({ ...prev, user: null, view: ViewMode.LANDING }));
  };

  const handleExport = (config: ExportConfig) => {
    if (!activeBook) {
      alert("No project selected.");
      return;
    }

    // Recursive function to get all text content in order
    const getAllContent = (nodeId: string): string => {
      const node = state.fileMap[nodeId];
      if (!node) return "";

      let content = "";

      if (node.type === NodeType.FILE && node.content) {
        content += `<h1>${node.title}</h1>\n${node.content}\n\n`;
      }

      if (node.children) {
        node.children.forEach(childId => {
          content += getAllContent(childId);
        });
      }

      return content;
    };

    const fullContent = getAllContent(activeBook.rootFolderId);

    if (!fullContent.trim()) {
      alert("No content to export.");
      return;
    }

    const title = activeBook.title;

    // PDF Export
    if (config.format === 'PDF') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
               <html>
                <head>
                  <title>${title}</title>
                  <style>
                    body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6; max-width: 800px; margin: 0 auto; }
                    h1 { text-align: center; color: #333; page-break-before: always; }
                    h1:first-of-type { page-break-before: auto; }
                    p { text-indent: 20px; margin-bottom: 10px; }
                  </style>
                </head>
                <body>
                  ${fullContent.split('\n').map(line => {
          if (line.startsWith('<h1>')) return line;
          return line.trim() ? `<p>${line}</p>` : '<br/>';
        }).join('')}
                </body>
              </html>
            `);
        printWindow.document.close();
        printWindow.print();
      }
      return;
    }

    // DOCX / EPUB (Simulated with HTML/MD)
    let contentToExport = `
      <html>
        <head>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6; max-width: 800px; margin: 0 auto; }
            h1 { text-align: center; color: #333; page-break-before: always; }
            p { text-indent: 20px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          ${fullContent.split('\n').map(line => {
      if (line.startsWith('<h1>')) return line;
      return line.trim() ? `<p>${line}</p>` : '<br/>';
    }).join('')}
        </body>
      </html>
    `;

    let mimeType = 'text/html';
    let extension = 'html';

    if (config.format === 'DOCX') {
      // Word opens HTML files with .doc/.docx extension surprisingly well
      mimeType = 'application/msword';
      extension = 'doc';
    } else if (config.format === 'EPUB') {
      // Fallback for EPUB
      mimeType = 'text/html';
      extension = 'html';
    }

    // Create Download Link
    const blob = new Blob([contentToExport], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  // --- Render ---

  if (state.view === ViewMode.LANDING) {
    return (
      <LandingPage
        onLogin={handleLogin}
        darkMode={state.darkMode}
        toggleTheme={() => setState(s => ({ ...s, darkMode: !s.darkMode }))}
      />
    );
  }

  // Focus Mode Styles
  const uiOpacity = state.focusMode ? (userActivity ? 'opacity-20 hover:opacity-100 transition-opacity duration-300' : 'opacity-0 pointer-events-none transition-opacity duration-1000') : 'opacity-100';

  const navClasses = `fixed top-0 w-full z-40 flex items-center justify-between px-4 py-3 bg-cream-50/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-gold-200/30 dark:border-white/5 transition-all duration-500
    ${state.focusMode ? 'bg-transparent border-transparent' : ''}
    ${uiOpacity}`;

  return (
    <div className={`h-screen w-full flex overflow-hidden bg-cream-50 dark:bg-neutral-900 text-gray-900 dark:text-cream-100 transition-colors duration-300 font-sans`}>

      {/* Top Navigation */}
      <nav className={navClasses}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setState(s => ({ ...s, sidebarOpen: !s.sidebarOpen }))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-500"
          >
            {state.sidebarOpen ? <Icons.Menu size={20} /> : <Icons.ChevronRight size={20} />}
          </button>
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-lg text-gold-600 dark:text-gold-500">Better Writer</span>
            {!state.focusMode && (
              <>
                <span className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-2"></span>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300 hidden md:inline">{activeBook?.title}</span>
              </>
            )}
          </div>
        </div>

        {/* Center Actions (Only in Editor View) */}
        {state.view === ViewMode.EDITOR && !state.focusMode && (
          <div className="hidden md:flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExport(true)}
            >
              <Icons.Download size={16} className="mr-2" />
              Export Project
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2">

          <Button
            variant={state.view === ViewMode.STATS ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setState(s => ({ ...s, view: s.view === ViewMode.STATS ? ViewMode.EDITOR : ViewMode.STATS }))}
            className={state.focusMode ? 'hidden' : ''}
          >
            <Icons.BarChart2 size={18} className="mr-2" />
            Stats
          </Button>

          <button
            onClick={() => setState(s => ({ ...s, focusMode: !s.focusMode }))}
            className={`p-2 rounded-lg transition-colors ${state.focusMode ? 'bg-gold-500 text-white shadow-lg shadow-gold-500/50' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500'}`}
            title="Focus Mode"
          >
            <Icons.Focus size={20} />
          </button>

          <button
            onClick={() => setState(s => ({ ...s, darkMode: !s.darkMode }))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-500"
            title="Toggle Theme"
          >
            {state.darkMode ? <Icons.Sun size={20} /> : <Icons.Moon size={20} />}
          </button>

          <button
            onClick={handleLogout}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-500 hover:text-red-500 ml-2"
            title="Sign Out"
          >
            <Icons.LogOut size={20} />
          </button>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="flex-1 flex pt-16 relative">
        <Sidebar
          isOpen={state.sidebarOpen && !state.focusMode}
          books={state.books}
          fileMap={state.fileMap}
          activeBookId={state.activeBookId}
          activeFileId={state.activeFileId}
          rootFolderId={activeBook?.rootFolderId || ''}
          onCreateNode={createNode}
          onDeleteNode={deleteNode}
          onSelectFile={(id) => setState(s => ({ ...s, activeFileId: id }))}
          onToggleFolder={toggleFolder}
          onRenameNode={renameNode}
          onReorganize={handleReorganize}
          onImportFiles={handleImport}
          onCreateBook={createBook}
          onSwitchBook={switchBook}
          onDeleteBook={deleteBook}
          onRenameBook={renameBook}
        />

        {/* Content Area */}
        <main
          className={`flex-1 flex flex-col relative min-w-0 bg-white dark:bg-neutral-800 transition-colors duration-300
            ${state.focusMode ? 'items-center justify-center' : ''}
          `}
          onClick={() => {
            if (state.sidebarOpen && window.innerWidth < 768) {
              setState(s => ({ ...s, sidebarOpen: false }));
            }
          }}
        >
          {state.view === ViewMode.EDITOR ? (
            activeFile ? (
              <Editor
                ref={editorRef}
                content={activeFile.content || ''}
                onChange={(val) => updateFileContent(activeFile.id, val)}
                title={activeFile.title}
                onTitleChange={(val) => updateFileTitle(activeFile.id, val)}
                focusMode={state.focusMode}
                active={userActivity}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
                <div className="text-center">
                  <Icons.FileText size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Select a file to start writing</p>
                </div>
              </div>
            )
          ) : state.view === ViewMode.STATS ? (
            <StatsPage
              books={state.books}
              fileMap={state.fileMap}
            />
          ) : null}
        </main>
      </div>

      {/* Export Modal */}
      {showExport && (
        <ExportDialog
          onExport={handleExport}
          onClose={() => setShowExport(false)}
          bookTitle={activeBook?.title || 'Untitled'}
        />
      )}

    </div >
  );
};

export default App;