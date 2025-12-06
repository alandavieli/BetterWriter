import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Icons } from './components/Icons';
import { Button } from './components/Button';
import { LandingPage } from './components/LandingPage';
import { Editor, EditorHandle } from './components/Editor';
import { Sidebar } from './components/Sidebar';
import { ExportDialog } from './components/ExportDialog';
import { AppState, FileNode, NodeType, FileCategory, ViewMode, Book, ExportConfig } from './types';

// Utility for ID generation
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const defaultState: AppState = {
  view: ViewMode.LANDING,
  user: null,
  books: [],
  fileMap: {},
  activeBookId: null,
  activeFileId: null,
  darkMode: false,
  focusMode: false,
  sidebarOpen: true,
  assistantOpen: false,
  assistantHistory: []
};


const getInitialState = (): AppState => {
  const savedState = localStorage.getItem('better-writer-state');
  let initialState = savedState ? JSON.parse(savedState) : defaultState;

  // Ensure sidebar is open by default if we are in editor mode
  if (initialState.view === ViewMode.EDITOR) {
    initialState.sidebarOpen = true;
  }

  // Auto-detect system theme preference if not saved
  if (!savedState) {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      initialState.darkMode = true;
    }
  }

  return initialState;
};

const App: React.FC = () => {
  // --- Mobile Blocker ---
  const [isMobile, setIsMobile] = useState(false);

  // --- Main State ---
  const [state, setState] = useState<AppState>(getInitialState);
  const [userActivity, setUserActivity] = useState(true);
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<number>(0);
  const [showExport, setShowExport] = useState(false);

  const activityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<EditorHandle>(null);
  const autoSaveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Mobile Check ---
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|ipad|iphone|ipod/i.test(userAgent.toLowerCase()) || window.innerWidth < 768;
      setIsMobile(isMobileDevice);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // --- Persistence ---
  useEffect(() => {
    if (state.darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    // We don't persist file handles in localStorage as they are not serializable
    // We only persist the basic structure/content.
    const stateToSave = {
      ...state,
      fileMap: Object.fromEntries(
        Object.entries(state.fileMap).map(([k, v]) => {
          const { fileHandle, ...rest } = v;
          return [k, rest];
        })
      )
    };
    localStorage.setItem('better-writer-state', JSON.stringify(stateToSave));
  }, [state]);

  // --- Focus Mode Logic ---
  useEffect(() => {
    if (!state.focusMode) return;
    const handleActivity = () => {
      setUserActivity(true);
      if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
      activityTimeoutRef.current = setTimeout(() => setUserActivity(false), 1500);
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


  // --- File System Logic ---

  const verifyPermission = async (fileHandle: FileSystemFileHandle, readWrite: boolean) => {
    const options: FileSystemHandlePermissionDescriptor = { mode: readWrite ? 'readwrite' : 'read' };
    // @ts-ignore
    if ((await fileHandle.queryPermission(options)) === 'granted') return true;
    setPermissionMessage("Please click 'Allow' to authorize saving.");
    // @ts-ignore
    const result = await fileHandle.requestPermission(options);
    setPermissionMessage(null);
    return result === 'granted';
  };

  const saveFile = async (manual: boolean = false) => {
    if (!state.activeFileId) return;
    const fileNode = state.fileMap[state.activeFileId];
    if (!fileNode) return;

    try {
      let handle = fileNode.fileHandle;

      // Handle "New/Untitled" files that haven't been saved to disk yet
      if (!handle) {
        if (manual) {
          // @ts-ignore
          handle = await window.showSaveFilePicker({
            types: [{ description: 'Text Files', accept: { 'text/plain': ['.txt'] } }],
            suggestedName: fileNode.title || 'Untitled'
          });
          if (!handle) return;

          // Update state with new handle explicitly
          const newTitle = handle.name.replace('.txt', '');
          setState(prev => ({
            ...prev,
            fileMap: {
              ...prev.fileMap,
              [fileNode.id]: {
                ...prev.fileMap[fileNode.id],
                fileHandle: handle,
                title: newTitle
              }
            }
          }));
          // Continue to save with this new handle
          // NOTE: We need to use 'handle' variable here, 
          // but handle is local. fileNode is stale.
        } else {
          return; // Cannot auto-save
        }
      }

      // If we still don't have a handle (user cancelled save), abort
      if (!handle) return;

      if (await verifyPermission(handle, true)) {
        // @ts-ignore
        const writable = await handle.createWritable();
        await writable.write(fileNode.content || '');
        await writable.close();
        setLastSaved(Date.now());
        console.log("Saved!");
      }

    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  // Auto-save logic
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    autoSaveIntervalRef.current = setInterval(async () => {
      const s = stateRef.current;
      if (s.activeFileId && s.fileMap[s.activeFileId]?.fileHandle) {
        const node = s.fileMap[s.activeFileId];
        try {
          // @ts-ignore
          const opts = { mode: 'readwrite' };
          // @ts-ignore
          if (await node.fileHandle.queryPermission(opts) === 'granted') {
            // @ts-ignore
            const writable = await node.fileHandle.createWritable();
            await writable.write(node.content || '');
            await writable.close();
            setLastSaved(Date.now());
          }
        } catch (e) {
          console.error("Autosave error", e);
        }
      }
    }, 5 * 60 * 1000); // 5 min
    return () => { if (autoSaveIntervalRef.current) clearInterval(autoSaveIntervalRef.current); };
  }, []);


  // --- Actions ---

  const handleStart = () => {
    // Switch view to EDITOR, but ensure activeFile is NULL so "Decision Screen" shows
    setState(prev => ({ ...prev, view: ViewMode.EDITOR, activeFileId: null }));
  };

  // Helper to ensure we have a valid book/root to attach files to
  const ensureActiveContext = (prevState: AppState): { bookId: string, rootId: string, newState: AppState } => {
    let newState = { ...prevState };
    let bookId = newState.activeBookId;
    let rootId = bookId ? newState.books.find(b => b.id === bookId)?.rootFolderId : null;

    if (!bookId || !rootId) {
      // Create default workspace
      bookId = generateId();
      rootId = generateId();
      const newBook: Book = {
        id: bookId,
        title: 'My Workspace',
        rootFolderId: rootId,
        status: 'Drafting'
      };
      const newRoot: FileNode = {
        id: rootId,
        parentId: null,
        title: 'Root',
        type: NodeType.FOLDER,
        children: [],
        lastModified: Date.now(),
        isOpen: true
      };
      newState.books = [...newState.books, newBook];
      newState.fileMap = { ...newState.fileMap, [rootId]: newRoot };
      newState.activeBookId = bookId;
    }
    // @ts-ignore
    return { bookId, rootId, newState };
  };

  const handleCreateNew = () => {
    setState(prev => {
      const { rootId, newState } = ensureActiveContext(prev);

      const newId = generateId();
      const newFile: FileNode = {
        id: newId,
        parentId: rootId,
        title: 'Untitled',
        type: NodeType.FILE,
        category: FileCategory.CHAPTER,
        content: '',
        wordCount: 0,
        lastModified: Date.now()
      };

      const root = newState.fileMap[rootId];
      newState.fileMap[rootId] = {
        ...root,
        children: [...(root.children || []), newId],
        isOpen: true
      };
      newState.fileMap[newId] = newFile;
      newState.activeFileId = newId;
      newState.sidebarOpen = true; // Show sidebar automatically

      return newState;
    });
  };

  const handleOpenFile = async () => {
    try {
      // @ts-ignore
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'Text Files', accept: { 'text/plain': ['.txt', '.md'] } }],
        multiple: false
      });

      const file = await handle.getFile();
      const content = await file.text();

      setState(prev => {
        const { rootId, newState } = ensureActiveContext(prev);
        const newId = generateId();
        const newFile: FileNode = {
          id: newId,
          parentId: rootId,
          title: file.name.replace(/\.(txt|md)$/, ''),
          type: NodeType.FILE,
          category: FileCategory.CHAPTER,
          content: content,
          wordCount: content.split(/\s+/).length,
          lastModified: file.lastModified,
          fileHandle: handle
        };

        const root = newState.fileMap[rootId];
        newState.fileMap[rootId] = {
          ...root,
          children: [...(root.children || []), newId],
          isOpen: true
        };
        newState.fileMap[newId] = newFile;
        newState.activeFileId = newId;
        newState.sidebarOpen = true;

        return newState;
      });

    } catch (e) {
      console.warn("Open file cancelled/failed", e);
    }
  };

  // Directory Scanner
  const handleOpenFolder = async () => {
    try {
      // @ts-ignore
      const dirHandle = await window.showDirectoryPicker();

      const bookId = generateId();
      const rootId = generateId();

      // Recursive scanner
      const scanDir = async (dir: any, parentId: string): Promise<Record<string, FileNode>> => {
        let map: Record<string, FileNode> = {};

        for await (const entry of dir.values()) {
          if (entry.kind === 'file' && (entry.name.endsWith('.txt') || entry.name.endsWith('.md'))) {
            const file = await entry.getFile();
            const content = await file.text();
            const fileId = generateId();
            map[fileId] = {
              id: fileId,
              parentId: parentId,
              title: entry.name.replace(/\.(txt|md)$/, ''),
              type: NodeType.FILE,
              category: FileCategory.CHAPTER,
              content,
              wordCount: content.split(/\s+/).length,
              lastModified: file.lastModified,
              fileHandle: entry
            };
          } else if (entry.kind === 'directory' && !entry.name.startsWith('.')) {
            const dirId = generateId();
            const subMap = await scanDir(entry, dirId);
            map = { ...map, ...subMap };
            map[dirId] = {
              id: dirId,
              parentId: parentId,
              title: entry.name,
              type: NodeType.FOLDER,
              children: Object.values(subMap).filter(n => n.parentId === dirId).map(n => n.id),
              lastModified: Date.now(),
              isOpen: false
            };
          }
        }
        return map;
      };

      const nodes = await scanDir(dirHandle, rootId);

      // Re-assemble root logic
      const rootNode: FileNode = {
        id: rootId,
        parentId: null,
        title: dirHandle.name,
        type: NodeType.FOLDER,
        children: Object.values(nodes).filter(n => n.parentId === rootId).map(n => n.id),
        lastModified: Date.now(),
        isOpen: true
      };
      nodes[rootId] = rootNode;

      const newBook: Book = {
        id: bookId,
        title: dirHandle.name,
        rootFolderId: rootId,
        status: 'Drafting'
      };

      setState(prev => ({
        ...prev,
        books: [...prev.books, newBook],
        fileMap: { ...prev.fileMap, ...nodes },
        activeBookId: bookId,
        sidebarOpen: true
      }));

    } catch (e) {
      console.warn("Folder open failed", e);
    }
  };

  // --- Sidebar Logic Passthrough ---
  const handleCreateNode = (type: NodeType, parentId: string) => {
    // Allow creating "Virtual" nodes in the sidebar
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
      if (!parent) return prev;
      return {
        ...prev,
        fileMap: {
          ...prev.fileMap,
          [parentId]: { ...parent, children: [...(parent.children || []), newId], isOpen: true },
          [newId]: newNode
        },
        activeFileId: type === NodeType.FILE ? newId : prev.activeFileId
      };
    });
  };

  const handleDeleteNode = (id: string) => {
    // NOTE: This only removes from state, NOT from disk (safety)
    setState(prev => {
      const parentId = prev.fileMap[id]?.parentId;
      if (!parentId) return prev; // Don't delete roots

      const newMap = { ...prev.fileMap };
      delete newMap[id];

      const parent = newMap[parentId];
      if (parent) {
        newMap[parentId] = { ...parent, children: parent.children?.filter(c => c !== id) };
      }

      return { ...prev, fileMap: newMap, activeFileId: prev.activeFileId === id ? null : prev.activeFileId };
    });
  };

  const handleDeleteBook = (id: string) => {
    setState(prev => ({
      ...prev,
      books: prev.books.filter(b => b.id !== id),
      activeBookId: prev.activeBookId === id ? (prev.books[0]?.id || null) : prev.activeBookId
    }));
  }

  // --- Render ---

  if (isMobile) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-cream-50 dark:bg-neutral-900 p-8 text-center text-gray-900 dark:text-gray-100">
        <div className="max-w-md">
          <div className="mb-6 flex justify-center text-gold-600"><Icons.Monitor size={64} /></div>
          <h1 className="text-3xl font-serif font-bold mb-4">Desktop Access Only</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">BetterWriter is optimized for desktop writing.</p>
        </div>
      </div>
    );
  }

  if (state.view === ViewMode.LANDING) {
    return <LandingPage onStart={handleStart} darkMode={state.darkMode} toggleTheme={() => setState(s => ({ ...s, darkMode: !s.darkMode }))} />;
  }

  const activeFile = state.activeFileId ? state.fileMap[state.activeFileId] : null;
  const activeBook = state.books.find(b => b.id === state.activeBookId);
  const showSidebar = state.sidebarOpen && !state.focusMode;

  return (
    <div className="h-screen w-full flex overflow-hidden bg-cream-50 dark:bg-neutral-900 text-gray-900 dark:text-cream-100 font-sans transition-colors duration-300">

      {/* Sidebar */}
      <Sidebar
        isOpen={showSidebar}
        books={state.books}
        fileMap={state.fileMap}
        activeBookId={state.activeBookId}
        activeFileId={state.activeFileId}
        rootFolderId={activeBook?.rootFolderId || ''}
        onCreateNode={handleCreateNode}
        onDeleteNode={handleDeleteNode}
        onSelectFile={(id) => setState(s => ({ ...s, activeFileId: id }))}
        onToggleFolder={(id) => setState(s => ({ ...s, fileMap: { ...s.fileMap, [id]: { ...s.fileMap[id], isOpen: !s.fileMap[id].isOpen } } }))}
        onRenameNode={(id, title) => setState(s => ({ ...s, fileMap: { ...s.fileMap, [id]: { ...s.fileMap[id], title } } }))}
        onReorganize={() => { }} // simplified
        onImportFiles={() => { }} // simplified, use main Open instead
        onCreateBook={() => { }} // handled by Open Folder usually
        onSwitchBook={(id) => setState(s => ({ ...s, activeBookId: id }))}
        onDeleteBook={handleDeleteBook}
        onRenameBook={(id, title) => setState(s => ({ ...s, books: s.books.map(b => b.id === id ? { ...b, title } : b) }))}
      />

      <div className={`flex-1 flex flex-col relative min-w-0 bg-white dark:bg-neutral-800 transition-all duration-300 ${showSidebar ? 'pl-72' : ''}`}>

        {/* Navbar */}
        <nav className={`w-full flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-white/5 bg-white/50 dark:bg-neutral-800/50 backdrop-blur top-0 z-40 transition-all
              ${state.focusMode ? (userActivity ? 'opacity-100' : 'opacity-0 pointer-events-none') : 'opacity-100'}
          `}>
          <div className="flex items-center gap-4">
            <button onClick={() => setState(s => ({ ...s, sidebarOpen: !s.sidebarOpen }))} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-500">
              {state.sidebarOpen ? <Icons.Menu size={20} /> : <Icons.ChevronRight size={20} />}
            </button>
            <span className="font-serif font-bold text-xl text-gold-600">Better Writer</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Open/Add Actions */}
            {!state.focusMode && (
              <div className="mr-4 flex gap-2">
                <Button onClick={handleOpenFolder} size="sm" variant="ghost" className="hidden md:flex">
                  <Icons.FolderPlus className="mr-2" size={16} /> Open Folder
                </Button>
                <Button onClick={() => setShowExport(true)} variant="ghost" size="sm">
                  <Icons.Download className="mr-2" size={16} /> Export
                </Button>
              </div>
            )}

            {activeFile && (
              <Button onClick={() => saveFile(true)} size="sm" variant={lastSaved > Date.now() - 2000 ? "primary" : "ghost"} className="transition-all">
                <Icons.Save className="mr-2" size={16} />
                {lastSaved > Date.now() - 2000 ? "Saved!" : "Save"}
              </Button>
            )}

            <button onClick={() => setState(s => ({ ...s, focusMode: !s.focusMode }))} className={`p-2 rounded-lg transition-colors ${state.focusMode ? 'bg-gold-500 text-white' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
              <Icons.Focus size={20} />
            </button>
          </div>
        </nav>

        {/* Warning Message */}
        {permissionMessage && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm shadow-xl z-50 flex items-center gap-2 animate-in slide-in-from-top-2">
            <Icons.Info size={16} /> {permissionMessage}
          </div>
        )}

        {/* Content */}
        <main className="flex-1 overflow-y-auto relative" onClick={() => {
          if (state.sidebarOpen && window.innerWidth < 768) setState(s => ({ ...s, sidebarOpen: false }));
        }}>
          {activeFile ? (
            <Editor
              ref={editorRef}
              content={activeFile.content || ''}
              onChange={(c) => setState(s => ({ ...s, fileMap: { ...s.fileMap, [activeFile.id]: { ...s.fileMap[activeFile.id], content: c, wordCount: c.split(/\s+/).length, lastModified: Date.now() } } }))}
              title={activeFile.title}
              onTitleChange={(t) => setState(s => ({ ...s, fileMap: { ...s.fileMap, [activeFile.id]: { ...s.fileMap[activeFile.id], title: t } } }))}
              focusMode={state.focusMode}
              active={userActivity}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 animate-in fade-in">
              <div className="max-w-3xl w-full text-center space-y-12">
                <h2 className="text-4xl font-serif font-bold text-gray-900 dark:text-white">Workspace</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <button onClick={handleCreateNew} className="p-8 rounded-2xl bg-gray-50 dark:bg-neutral-900/50 hover:bg-white dark:hover:bg-neutral-800 border-2 border-transparent hover:border-gold-400 transition-all group">
                    <div className="w-12 h-12 bg-gold-100 dark:bg-gold-500/20 text-gold-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform"><Icons.FilePlus size={24} /></div>
                    <h3 className="font-bold mb-1">New Doc</h3>
                    <p className="text-xs text-gray-500">Create a scratchpad</p>
                  </button>
                  <button onClick={handleOpenFile} className="p-8 rounded-2xl bg-gray-50 dark:bg-neutral-900/50 hover:bg-white dark:hover:bg-neutral-800 border-2 border-transparent hover:border-gold-400 transition-all group">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform"><Icons.FileText size={24} /></div>
                    <h3 className="font-bold mb-1">Open File</h3>
                    <p className="text-xs text-gray-500">Edit a single .txt/.md</p>
                  </button>
                  <button onClick={handleOpenFolder} className="p-8 rounded-2xl bg-gray-50 dark:bg-neutral-900/50 hover:bg-white dark:hover:bg-neutral-800 border-2 border-transparent hover:border-gold-400 transition-all group">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/20 text-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform"><Icons.FolderOpen size={24} /></div>
                    <h3 className="font-bold mb-1">Open Project</h3>
                    <p className="text-xs text-gray-500">Import a folder</p>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {showExport && (
        <ExportDialog
          onExport={() => alert("Legacy export - Implement new export logic if needed")}
          onClose={() => setShowExport(false)}
          bookTitle={activeBook?.title || 'Untitled'}
        />
      )}
    </div>
  );
};

export default App;