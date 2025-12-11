import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Icons } from './components/Icons';
import { Button } from './components/Button';
import { LandingPage } from './components/LandingPage';
import { Editor, EditorHandle } from './components/Editor';
import { Sidebar } from './components/SidebarNew';
import { ExportDialog } from './components/ExportDialog';
import { StatsPage } from './components/StatsPage';
import { HelpDialog } from './components/HelpDialog';
import { TutorialDialog } from './components/TutorialDialog';
import { FloatingToolbar } from './components/FloatingToolbar';
import { PlanningPanel } from './components/PlanningPanel';
import { FindReplace } from './components/FindReplace';
import { AppState, FileNode, NodeType, FileCategory, ViewMode, Book, ExportConfig, WritingStats } from './types';

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
  const [showHelp, setShowHelp] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showPlanning, setShowPlanning] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // --- Writing Stats State ---
  const getInitialStats = (): WritingStats => {
    const saved = localStorage.getItem('better-writer-stats');
    if (saved) return JSON.parse(saved);
    return {
      dailyGoal: 1000,
      weeklyGoal: 7000,
      currentStreak: 0,
      longestStreak: 0,
      totalTimeMinutes: 0,
      dailyHistory: [],
      lastWriteDate: ''
    };
  };

  const [stats, setStats] = useState<WritingStats>(getInitialStats);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionWordCount, setSessionWordCount] = useState(0);
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<EditorHandle>(null);
  const autoSaveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Dark Mode Sync ---
  useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.darkMode]);

  // Activity Monitor (Mouse position tracking for focus mode navbar)
  useEffect(() => {
    const handleActivity = (e: MouseEvent) => {
      // In focus mode, only show navbar if mouse is in top 80px of screen
      if (state.focusMode) {
        const isAtTop = e.clientY < 80;
        setUserActivity(isAtTop);
      } else {
        // In normal mode, always show navbar on mouse movement
        setUserActivity(true);
        if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
        activityTimeoutRef.current = setTimeout(() => {
          setUserActivity(false);
        }, 3000);
      }
    };

    // Only track mouse movement, not keydown
    window.addEventListener('mousemove', handleActivity);

    // Initial trigger - set to false in focus mode, true otherwise
    setUserActivity(!state.focusMode);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
    };
  }, [state.focusMode]);

  // --- Stats Persistence ---
  useEffect(() => {
    localStorage.setItem('better-writer-stats', JSON.stringify(stats));
  }, [stats]);

  // --- Session Time Tracking ---
  useEffect(() => {
    if (state.activeFileId && state.view === ViewMode.EDITOR) {
      // Start session timer
      if (!sessionStartTime) {
        setSessionStartTime(Date.now());
      }

      // Update time every minute
      sessionTimerRef.current = setInterval(() => {
        setStats(prev => ({
          ...prev,
          totalTimeMinutes: prev.totalTimeMinutes + 1
        }));
      }, 60000); // Every minute

      return () => {
        if (sessionTimerRef.current) {
          clearInterval(sessionTimerRef.current);
        }
      };
    } else {
      // Reset session when leaving editor
      setSessionStartTime(null);
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    }
  }, [state.activeFileId, state.view, sessionStartTime]);

  // --- Update Stats When Words Change ---
  const updateDailyStats = (wordCount: number) => {
    const today = new Date().toISOString().split('T')[0];

    setStats(prev => {
      const history = [...prev.dailyHistory];
      const todayIndex = history.findIndex(d => d.date === today);

      if (todayIndex >= 0) {
        history[todayIndex] = {
          ...history[todayIndex],
          wordCount: wordCount
        };
      } else {
        history.push({
          date: today,
          wordCount: wordCount,
          timeMinutes: 0
        });
      }

      // Calculate streak
      let currentStreak = 0;
      let longestStreak = prev.longestStreak;

      if (history.length > 0) {
        const sortedHistory = [...history].sort((a, b) => b.date.localeCompare(a.date));

        // Check if we wrote today or yesterday
        const lastDate = new Date(sortedHistory[0].date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff <= 1) {
          // Continue or start streak
          currentStreak = 1;
          for (let i = 1; i < sortedHistory.length; i++) {
            const currentDate = new Date(sortedHistory[i - 1].date);
            const prevDate = new Date(sortedHistory[i].date);
            const diff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

            if (diff === 1 && sortedHistory[i].wordCount > 0) {
              currentStreak++;
            } else {
              break;
            }
          }
        }

        longestStreak = Math.max(longestStreak, currentStreak);
      }

      return {
        ...prev,
        dailyHistory: history,
        currentStreak,
        longestStreak,
        lastWriteDate: today
      };
    });
  };

  // ... (existing helper effects) ...

  const verifyPermission = async (fileHandle: FileSystemFileHandle, readWrite: boolean) => {
    // @ts-ignore
    const options: any = { mode: readWrite ? 'readwrite' : 'read' };
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

      // Handle "New/Untitled" files or Legacy Files (No Handle)
      if (!handle) {
        if (manual) {
          // SAFARI/FIREFOX CHECK: If API is missing, download IMMEDIATELY.
          // @ts-ignore
          if (typeof window.showSaveFilePicker !== 'function') {
            // Synchronous-like fallback for Safari
            const blob = new Blob([fileNode.content || ''], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileNode.title}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setLastSaved(Date.now());
            return;
          }

          // CHROME/EDGE: Try API
          try {
            // @ts-ignore
            const newHandle = await window.showSaveFilePicker({
              types: [{ description: 'Text Files', accept: { 'text/plain': ['.txt'] } }],
              suggestedName: fileNode.title || 'Untitled'
            });
            if (!newHandle) return;

            handle = newHandle;
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
          } catch (cancelErr) {
            return; // User cancelled prompt
          }

        } else {
          return; // Cannot auto-save legacy files silently
        }
      }

      // If we have a handle (from now or before), write to it
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

  const handleExit = () => {
    // Clear persistence of view state to ensure true landing logic next time
    const s = { ...state, view: ViewMode.LANDING, activeFileId: null };
    setState(s);
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

  const handleCreateBook = () => {
    const name = prompt("Enter project name:");
    if (!name) return;

    const bookId = generateId();
    const rootId = generateId();

    const newBook: Book = {
      id: bookId,
      title: name,
      rootFolderId: rootId,
      status: 'Drafting'
    };

    const newRoot: FileNode = {
      id: rootId,
      parentId: null,
      title: name,
      type: NodeType.FOLDER,
      children: [],
      lastModified: Date.now(),
      isOpen: true
    };

    setState(prev => ({
      ...prev,
      books: [...prev.books, newBook],
      fileMap: { ...prev.fileMap, [rootId]: newRoot },
      activeBookId: bookId,
      // Switch to this new project
      sidebarOpen: true
    }));
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // --- Legacy Fallbacks ---
  const handleLegacyFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const content = await file.text();
      const newId = generateId();
      const newFile: FileNode = {
        id: newId,
        parentId: null, // Legacy opens as independent file
        title: file.name.replace(/\.(txt|md)$/, ''),
        type: NodeType.FILE,
        category: FileCategory.CHAPTER,
        content: content,
        wordCount: content.split(/\s+/).length,
        lastModified: file.lastModified
      };

      setState(prev => {
        const { rootId, newState } = ensureActiveContext(prev);
        // Attach to workspace root
        const root = newState.fileMap[rootId];
        newState.fileMap[rootId] = {
          ...root,
          children: [...(root.children || []), newId],
          isOpen: true
        };
        newState.fileMap[newId] = { ...newFile, parentId: rootId };
        newState.activeFileId = newId;
        newState.sidebarOpen = true;
        return newState;
      });
    }
    // Reset
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLegacyFolderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const bookId = generateId();
    const rootId = generateId();
    // First part of the path is the root folder name
    const rootName = e.target.files[0].webkitRelativePath.split('/')[0] || 'Imported Folder';

    const map: Record<string, FileNode> = {};
    const rootChildren: string[] = [];
    let firstFileId: string | null = null;

    // Map to track created folders by their relative path "Root/Sub/etc" -> NodeID
    const pathMap: Record<string, string> = {};

    // Initialize Root
    pathMap[rootName] = rootId;
    map[rootId] = {
      id: rootId,
      parentId: null,
      title: rootName,
      type: NodeType.FOLDER,
      children: [],
      lastModified: Date.now(),
      isOpen: true
    };


    // Helper to ensure a folder exists for a given path array ["Project", "Chapter 1"]
    const ensurePath = (parts: string[]): string => {
      let currentPath = parts[0]; // "Project"
      let parentId = pathMap[currentPath]; // rootId

      // Iterate through the sub-folders
      for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        const fullPath = currentPath + '/' + part;

        if (!pathMap[fullPath]) {
          // Create new folder node
          const newFolderId = generateId();
          pathMap[fullPath] = newFolderId;

          // Add to map
          map[newFolderId] = {
            id: newFolderId,
            parentId: parentId,
            title: part,
            type: NodeType.FOLDER,
            children: [],
            lastModified: Date.now(),
            isOpen: false // Collapsed by default
          };

          // Add to parent's children
          if (map[parentId]) {
            map[parentId] = {
              ...map[parentId],
              children: [...(map[parentId].children || []), newFolderId]
            };
          }
        }

        parentId = pathMap[fullPath]; // Step down
        currentPath = fullPath;
      }

      return parentId;
    };

    for (let i = 0; i < e.target.files.length; i++) {
      const file = e.target.files[i];
      // Skip dotfiles and non-text
      if (file.name.startsWith('.') || (!file.name.endsWith('.txt') && !file.name.endsWith('.md'))) continue;

      // Process path: "Project/Chapter 1/file.txt" -> ["Project", "Chapter 1"] + "file.txt"
      const pathParts = file.webkitRelativePath.split('/');
      const fileName = pathParts.pop(); // Remove file name
      if (!fileName) continue;

      // Ensure parent folder exists
      const parentFolderId = ensurePath(pathParts);

      // Create File Node
      const content = await file.text();
      const fileId = generateId();
      map[fileId] = {
        id: fileId,
        parentId: parentFolderId,
        title: fileName.replace(/\.(txt|md)$/, ''),
        type: NodeType.FILE,
        category: FileCategory.CHAPTER,
        content,
        wordCount: content.split(/\s+/).length,
        lastModified: file.lastModified
      };

      // Link to parent
      if (map[parentFolderId]) {
        map[parentFolderId] = {
          ...map[parentFolderId],
          children: [...(map[parentFolderId].children || []), fileId]
        };
      }

      if (!firstFileId) firstFileId = fileId;
    }

    const newBook: Book = {
      id: bookId,
      title: rootName,
      rootFolderId: rootId,
      status: 'Drafting'
    };

    setState(prev => ({
      ...prev,
      books: [...prev.books, newBook],
      fileMap: { ...prev.fileMap, ...map },
      activeBookId: bookId,
      activeFileId: firstFileId,
      sidebarOpen: true
    }));

    if (folderInputRef.current) folderInputRef.current.value = '';
  }


  const handleOpenFile = async () => {
    // Check for API Support
    // @ts-ignore
    if (typeof window.showOpenFilePicker !== 'function') {
      fileInputRef.current?.click();
      return;
    }

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
      if ((e as Error).name !== 'AbortError') {
        console.warn("Open file cancelled/failed", e);
        alert("Error opening file. Please try the standard upload button if this persists.");
      }
    }
  };

  // Directory Scanner
  const handleOpenFolder = async () => {
    // Check for API Support
    // @ts-ignore
    if (typeof window.showDirectoryPicker !== 'function') {
      folderInputRef.current?.click();
      return;
    }

    try {
      // @ts-ignore
      const dirHandle = await window.showDirectoryPicker();

      const bookId = generateId();
      const rootId = generateId();
      let firstFileId: string | null = null;

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
            if (!firstFileId) firstFileId = fileId;
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
        activeFileId: firstFileId, // Auto-open first file found!
        sidebarOpen: true
      }));

    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        console.warn("Folder open failed", e);
        alert("Error opening folder. Please try again.");
      }
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
  };

  const handleReorganize = (sourceId: string, targetParentId: string) => {
    setState(prev => {
      const sourceNode = prev.fileMap[sourceId];
      if (!sourceNode) return prev;

      const oldParentId = sourceNode.parentId;
      if (!oldParentId || oldParentId === targetParentId) return prev;

      const newMap = { ...prev.fileMap };

      // Remove from old parent
      const oldParent = newMap[oldParentId];
      if (oldParent) {
        newMap[oldParentId] = {
          ...oldParent,
          children: oldParent.children?.filter(c => c !== sourceId) || []
        };
      }

      // Add to new parent
      const newParent = newMap[targetParentId];
      if (newParent) {
        newMap[targetParentId] = {
          ...newParent,
          children: [...(newParent.children || []), sourceId],
          isOpen: true
        };
      }

      // Update source node's parentId
      newMap[sourceId] = {
        ...sourceNode,
        parentId: targetParentId
      };

      return { ...prev, fileMap: newMap };
    });
  };

  const handleUpdateTags = (id: string, tags: string[]) => {
    setState(prev => ({
      ...prev,
      fileMap: {
        ...prev.fileMap,
        [id]: {
          ...prev.fileMap[id],
          tags
        }
      }
    }));
  };

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

  if (state.view === ViewMode.STATS) {
    // Simplified stats component usage
    return (
      <div className="relative">
        <div className="fixed top-4 right-4 z-50">
          <Button onClick={() => setState(s => ({ ...s, view: ViewMode.EDITOR }))} variant="ghost">
            <Icons.X size={24} /> Close
          </Button>
        </div>
        <StatsPage
          books={state.books}
          fileMap={state.fileMap}
          stats={stats}
          onUpdateGoals={(daily, weekly) => {
            setStats(prev => ({
              ...prev,
              dailyGoal: daily,
              weeklyGoal: weekly
            }));
          }}
        />
      </div>
    );
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
        onReorganize={handleReorganize}
        onOpenFolder={handleOpenFolder}
        onCreateBook={handleCreateBook}
        onSwitchBook={(id) => setState(s => ({ ...s, activeBookId: id }))}
        onDeleteBook={handleDeleteBook}
        onRenameBook={(id, title) => setState(s => ({ ...s, books: s.books.map(b => b.id === id ? { ...b, title } : b) }))}
        onUpdateTags={handleUpdateTags}
      />

      <div className="flex-1 flex flex-col relative min-w-0 bg-white dark:bg-neutral-800 transition-all duration-300">

        {/* Fixed Top-Left Logo and Sidebar Toggle */}
        <div className="fixed top-4 left-4 z-50 flex items-center gap-3">
          <button
            onClick={() => setState(s => ({ ...s, sidebarOpen: !s.sidebarOpen }))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-neutral-800/80 backdrop-blur shadow-sm"
          >
            {state.sidebarOpen ? <Icons.Menu size={20} /> : <Icons.ChevronRight size={20} />}
          </button>
          <span className="font-serif font-bold text-xl text-gold-600 bg-white/80 dark:bg-neutral-800/80 backdrop-blur px-3 py-2 rounded-lg shadow-sm">Better Writer</span>
        </div>

        {/* Navbar */}
        <nav className={`w-full flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-white/5 bg-white/50 dark:bg-neutral-800/50 backdrop-blur top-0 z-40 transition-all
              ${state.focusMode ? (userActivity ? 'opacity-100' : 'opacity-0 pointer-events-none') : 'opacity-100'}
          `}>
          <div className="flex-1"></div>

          <div className="flex items-center gap-2">
            {/* Export Menu - Only show when file is active */}
            {activeFile && (
              <div className="relative mr-2">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 hover:text-gold-600 flex items-center gap-2 text-sm font-medium"
                >
                  <Icons.Download size={14} />
                  Export
                </button>
                {showExportMenu && (
                  <div className="absolute top-full right-0 mt-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl py-1 min-w-[140px] z-50">
                    <button
                      onClick={async () => {
                        const { ExportService } = await import('./services/ExportService');
                        await ExportService.exportDocument('TXT', { title: activeFile.title, content: activeFile.content || '' });
                        setShowExportMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-white/10 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                    >
                      <Icons.FileText size={14} />
                      TXT
                    </button>
                    <button
                      onClick={async () => {
                        const { ExportService } = await import('./services/ExportService');
                        await ExportService.exportDocument('PDF', { title: activeFile.title, content: activeFile.content || '' });
                        setShowExportMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-white/10 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                    >
                      <Icons.FileText size={14} />
                      PDF
                    </button>
                    <button
                      onClick={async () => {
                        const { ExportService } = await import('./services/ExportService');
                        await ExportService.exportDocument('DOCX', { title: activeFile.title, content: activeFile.content || '' });
                        setShowExportMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-white/10 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                    >
                      <Icons.FileText size={14} />
                      DOCX
                    </button>
                    <button
                      onClick={async () => {
                        const { ExportService } = await import('./services/ExportService');
                        await ExportService.exportDocument('EPUB', { title: activeFile.title, content: activeFile.content || '' });
                        setShowExportMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-white/10 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                    >
                      <Icons.BookOpen size={14} />
                      EPUB
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Actions */}
            {!state.focusMode && (
              <div className="flex gap-2 border-r border-gray-200 dark:border-gray-600 pr-2 mr-2">
                <Button onClick={handleOpenFolder} size="sm" variant="ghost" className="hidden md:flex text-gray-500 hover:text-gold-600">
                  <Icons.FolderPlus className="mr-2" size={16} /> Open Folder
                </Button>
                <Button onClick={() => setState(s => ({ ...s, view: ViewMode.STATS }))} variant="ghost" size="sm" className="hidden md:flex text-gray-500 hover:text-gold-600">
                  <Icons.BarChart2 className="mr-2" size={16} /> Stats
                </Button>
                <Button onClick={() => setShowPlanning(true)} variant="ghost" size="sm" className="hidden md:flex text-gray-500 hover:text-gold-600">
                  <Icons.Layout className="mr-2" size={16} /> Planning
                </Button>
              </div>
            )}

            {activeFile && (
              <Button onClick={() => saveFile(true)} size="sm" variant={lastSaved > Date.now() - 2000 ? "primary" : "ghost"} className="transition-all">
                <Icons.Save className="mr-2" size={16} />
                {lastSaved > Date.now() - 2000 ? "Saved!" : "Save"}
              </Button>
            )}

            <button onClick={() => setShowTutorial(true)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5" title="Tutorial">
              <Icons.BookOpen size={20} />
            </button>

            <button onClick={() => setShowHelp(true)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5" title="Browser Info">
              <Icons.HelpCircle size={20} />
            </button>

            <button onClick={() => setState(s => ({ ...s, darkMode: !s.darkMode }))} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5" title="Toggle Theme">
              {state.darkMode ? <Icons.Sun size={20} /> : <Icons.Moon size={20} />}
            </button>

            <button onClick={() => setState(s => ({ ...s, focusMode: !s.focusMode }))} className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${state.focusMode ? 'bg-gold-500 text-white shadow-md' : 'bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-400 hover:bg-gold-100 dark:hover:bg-gold-900/20'}`} title="Focus Mode">
              <Icons.Focus size={18} />
              <span className="text-sm font-medium hidden md:inline">Zen Focus Mode</span>
            </button>

            {!state.focusMode && (
              <button onClick={handleExit} className="p-2 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 ml-2" title="Exit to Home">
                <Icons.LogOut size={20} />
              </button>
            )}
          </div>
        </nav>

        {/* Warning Message */}
        {permissionMessage && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm shadow-xl z-50 flex items-center gap-2 animate-in slide-in-from-top-2">
            <Icons.Info size={16} /> {permissionMessage}
          </div>
        )}


        {/* Find & Replace Dialog */}
        {
          showFindReplace && activeFile && (
            <FindReplace
              content={activeFile.content || ''}
              onReplace={(newContent) => {
                setState(s => ({
                  ...s,
                  fileMap: {
                    ...s.fileMap,
                    [activeFile.id]: {
                      ...s.fileMap[activeFile.id],
                      content: newContent
                    }
                  }
                }));
              }}
              onClose={() => setShowFindReplace(false)}
              onNavigate={(index) => {
                const ta = editorRef.current?.getTextarea();
                if (ta) {
                  ta.setSelectionRange(index, index + 10);
                  ta.focus();
                }
              }}
            />
          )
        }

        {/* Content */}
        <main className="flex-1 overflow-y-auto relative" onClick={() => {
          if (state.sidebarOpen && window.innerWidth < 768) setState(s => ({ ...s, sidebarOpen: false }));
        }}>
          {activeFile ? (
            <Editor
              ref={editorRef}
              content={activeFile.content || ''}
              onChange={(c) => {
                const newWordCount = c.split(/\s+/).filter(w => w.length > 0).length;
                setState(s => ({
                  ...s,
                  fileMap: {
                    ...s.fileMap,
                    [activeFile.id]: {
                      ...s.fileMap[activeFile.id],
                      content: c,
                      wordCount: newWordCount,
                      lastModified: Date.now()
                    }
                  }
                }));
                updateDailyStats(newWordCount);
              }}
              title={activeFile.title}
              onTitleChange={(t) => setState(s => ({ ...s, fileMap: { ...s.fileMap, [activeFile.id]: { ...s.fileMap[activeFile.id], title: t } } }))}
              focusMode={state.focusMode}
              active={userActivity}
              sidebarOpen={state.sidebarOpen}
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
      </div >

      {showHelp && <HelpDialog onClose={() => setShowHelp(false)} />}

      {showTutorial && <TutorialDialog onClose={() => setShowTutorial(false)} />}

      {
        showPlanning && (
          <PlanningPanel
            fileMap={state.fileMap}
            onClose={() => setShowPlanning(false)}
          />
        )
      }

      {
        showExport && (
          <ExportDialog
            isOpen={showExport}
            onClose={() => setShowExport(false)}
            onExport={async (config) => {
              // ... (Simulated export)
              alert("Export complete!");
              setShowExport(false);
            }}
            bookTitle={activeBook?.title || 'Unknown Project'}
          />
        )
      }

      {/* Hidden Inputs for Legacy Support */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleLegacyFileChange}
        className="hidden"
        accept=".txt,.md"
      />
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleLegacyFolderChange}
        className="hidden"
        // @ts-ignore
        webkitdirectory=""
        directory=""
        multiple
      />
    </div >
  );
};

export default App;