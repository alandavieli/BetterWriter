import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Icons } from './components/Icons';
import { Button } from './components/Button';
import { LandingPage } from './components/LandingPage';
import { Editor, EditorHandle } from './components/Editor';
import { AppState, FileNode, NodeType, FileCategory, ViewMode } from './types';

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
  sidebarOpen: false, // Default closed as we are moving to file-based
  assistantOpen: false,
  assistantHistory: []
};

// Start with a clean slate for the file-based approach, but preserver theme
const getInitialState = (): AppState => {
  const savedState = localStorage.getItem('better-writer-state');
  let initialState = savedState ? JSON.parse(savedState) : defaultState;

  // Reset critical validation states
  initialState.view = ViewMode.LANDING;
  initialState.activeFileId = null;

  // Auto-detect system theme preference if not saved
  if (!savedState) {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      initialState.darkMode = true;
    }
  }

  return initialState;
};

const App: React.FC = () => {
  // --- Mobile Blocker State ---
  const [isMobile, setIsMobile] = useState(false);

  // --- Main State ---
  const [state, setState] = useState<AppState>(getInitialState);
  const [userActivity, setUserActivity] = useState(true);
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<number>(Date.now());

  // Timer for focus mode activity detection
  const activityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<EditorHandle>(null);
  const autoSaveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Mobile Checker Effect ---
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

  // --- Theme Management ---
  useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('better-writer-state', JSON.stringify(state));
  }, [state]);

  // --- Focus Mode Mouse Tracking ---
  useEffect(() => {
    if (!state.focusMode) return;

    const handleActivity = () => {
      setUserActivity(true);
      if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
      activityTimeoutRef.current = setTimeout(() => {
        setUserActivity(false);
      }, 1500);
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


  // --- File System Access API & Saving Logic ---

  /**
   * Explainer: The File System Access API allows web apps to read/write directly to files on the user's device.
   * 1. Window.showslOpenFilePicker() -> Prompts user to pick a file -> Returns a FileSystemFileHandle.
   * 2. Window.showSaveFilePicker() -> Prompts user to pick separate location -> Returns a FileSystemFileHandle.
   * 3. handle.createWritable() -> Creates a writable stream to save content.
   * 
   * Security: The browser requires user gesture (click) for the first access. 
   * Subsequent writes may need permission verification `handle.requestPermission()`.
   */

  const verifyPermission = async (fileHandle: FileSystemFileHandle, readWrite: boolean) => {
    const options: FileSystemHandlePermissionDescriptor = {
      mode: readWrite ? 'readwrite' : 'read'
    };

    // Check if permission was already granted.
    if ((await fileHandle.queryPermission(options)) === 'granted') {
      return true;
    }

    // Show helper message to user before the scary browser prompt
    setPermissionMessage("Please click 'Allow' to let BetterWriter save your changes accurately.");

    // Request permission. If the developer doesn't handle the error, the browser may show a prompt.
    const result = await fileHandle.requestPermission(options);

    setPermissionMessage(null); // Hide message after interaction

    return result === 'granted';
  };

  const saveFile = async (manual: boolean = false) => {
    if (!state.activeFileId) return;
    const fileNode = state.fileMap[state.activeFileId];
    if (!fileNode) return;

    try {
      let handle = fileNode.fileHandle;

      // If no handle (New File), we must prompt user to save to disk first
      if (!handle) {
        if (manual) {
          // For manual save on a new file, show Save Picker
          // @ts-ignore - Typescript might not have full File System Access API types by default
          handle = await window.showSaveFilePicker({
            types: [{
              description: 'Text Files',
              accept: { 'text/plain': ['.txt'] },
            }],
          });

          if (!handle) return; // User cancelled

          // Update state with new handle
          setState(prev => ({
            ...prev,
            fileMap: {
              ...prev.fileMap,
              [fileNode.id]: {
                ...prev.fileMap[fileNode.id],
                fileHandle: handle,
                title: handle.name.replace('.txt', '')
              }
            }
          }));
        } else {
          // If auto-save and no handle, we simply cannot save yet. 
          // We don't want to prompt user unexpectedly during auto-save.
          console.log("Skipping auto-save for unsaved new file");
          return;
        }
      }

      if (!handle) return;

      // Have handle, verify permission and write
      const hasPermission = await verifyPermission(handle, true);
      if (!hasPermission) return;

      const writable = await handle.createWritable();
      await writable.write(fileNode.content || '');
      await writable.close();

      setLastSaved(Date.now());
      if (manual) {
        // Maybe show a small toast?
        // alert("Saved!"); // Too intrusive, prefer subtle UI indication
      }

    } catch (err) {
      console.error("Error saving file:", err);
      // Could handle "User cancelled" error specially
    }
  };

  // --- Auto-Save Effect ---
  // Using a Ref for the current state to access in the interval without re-binding.
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const saveFileFromRef = async () => {
    const currentState = stateRef.current;
    if (!currentState.activeFileId) return;
    const fileNode = currentState.fileMap[currentState.activeFileId];
    if (!fileNode || !fileNode.fileHandle) return; // Only auto-save if we have a handle

    try {
      const handle = fileNode.fileHandle;
      // We assume permission is persistent for the session usually

      // @ts-ignore
      const options = { mode: 'readwrite' };
      // @ts-ignore
      if ((await handle.queryPermission(options)) === 'granted') {
        // @ts-ignore
        const writable = await handle.createWritable();
        await writable.write(fileNode.content || '');
        await writable.close();
        setLastSaved(Date.now());
        console.log("Auto-saved successfully");
      }
    } catch (e) {
      console.error("Auto-save failed", e);
    }
  };

  useEffect(() => {
    autoSaveIntervalRef.current = setInterval(saveFileFromRef, 5 * 60 * 1000);
    return () => {
      if (autoSaveIntervalRef.current) clearInterval(autoSaveIntervalRef.current);
    }
  }, []); // Empty dependency, uses Ref


  // --- Actions ---

  const handleStart = () => {
    setState(prev => ({ ...prev, view: ViewMode.EDITOR }));
  };

  const handleCreateNew = () => {
    const newId = generateId();
    const newFile: FileNode = {
      id: newId,
      parentId: null,
      title: 'Untitled',
      type: NodeType.FILE,
      category: FileCategory.CHAPTER,
      content: '',
      wordCount: 0,
      lastModified: Date.now()
    };

    setState(prev => ({
      ...prev,
      fileMap: { [newId]: newFile }, // Clear old map, focus on single file
      activeFileId: newId
    }));
  };

  const handleOpenFile = async () => {
    try {
      // @ts-ignore
      const [handle] = await window.showOpenFilePicker({
        types: [{
          description: 'Text Files',
          accept: {
            'text/plain': ['.txt', '.md'],
          },
        }],
        multiple: false
      });

      const file = await handle.getFile();
      const content = await file.text();

      const newId = generateId();
      const newFile: FileNode = {
        id: newId,
        parentId: null,
        title: file.name.replace(/\.(txt|md)$/, ''),
        type: NodeType.FILE,
        category: FileCategory.CHAPTER,
        content: content,
        wordCount: content.split(/\s+/).length,
        lastModified: file.lastModified,
        fileHandle: handle
      };

      setState(prev => ({
        ...prev,
        fileMap: { [newId]: newFile },
        activeFileId: newId
      }));

    } catch (err) {
      // Ignore user abort
      console.log("Open file cancelled");
    }
  };

  const updateContent = (content: string) => {
    if (!state.activeFileId) return;
    setState(prev => ({
      ...prev,
      fileMap: {
        ...prev.fileMap,
        [prev.activeFileId!]: {
          ...prev.fileMap[prev.activeFileId!],
          content,
          wordCount: content.trim().split(/\s+/).filter(w => w.length > 0).length,
          lastModified: Date.now()
        }
      }
    }));
  };

  const updateTitle = (title: string) => {
    if (!state.activeFileId) return;
    setState(prev => ({
      ...prev,
      fileMap: {
        ...prev.fileMap,
        [prev.activeFileId!]: {
          ...prev.fileMap[prev.activeFileId!],
          title
        }
      }
    }));
  };


  // --- Render ---

  if (isMobile) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-cream-50 dark:bg-neutral-900 p-8 text-center text-gray-900 dark:text-gray-100">
        <div className="max-w-md">
          <div className="mb-6 flex justify-center text-gold-600">
            <Icons.Monitor size={64} />
          </div>
          <h1 className="text-3xl font-serif font-bold mb-4">
            BetterWriter is a desktop-first tool.
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Please access this site from a computer for the best writing experience.
          </p>
        </div>
      </div>
    );
  }

  if (state.view === ViewMode.LANDING) {
    return (
      <LandingPage
        onStart={handleStart}
        darkMode={state.darkMode}
        toggleTheme={() => setState(s => ({ ...s, darkMode: !s.darkMode }))}
      />
    );
  }

  // Active File Node
  const activeFile = state.activeFileId ? state.fileMap[state.activeFileId] : null;

  return (
    <div className={`h-screen w-full flex flex-col bg-cream-50 dark:bg-neutral-900 text-gray-900 dark:text-cream-100 transition-colors duration-300 font-sans overflow-hidden`}>

      {/* Top Navigation - Minimal */}
      <nav className={`w-full flex items-center justify-between px-6 py-4 z-40 transition-opacity duration-500 min-h-[72px]
         ${state.focusMode && userActivity ? 'opacity-100 bg-cream-50/90 dark:bg-neutral-900/90 backdrop-blur-md' : ''}
         ${state.focusMode && !userActivity ? 'opacity-0 pointer-events-none' : 'opacity-100'}
      `}>
        <div className="flex items-center gap-2">
          <button onClick={() => setState(s => ({ ...s, view: ViewMode.LANDING }))} className="hover:opacity-70 transition-opacity">
            <span className="font-serif font-bold text-xl text-gold-600 dark:text-gold-500">Better Writer</span>
          </button>
          {activeFile && (
            <>
              <span className="text-gray-300 dark:text-gray-700 mx-2">/</span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate max-w-[200px]">{activeFile.title}</span>
            </>
          )}
        </div>

        {activeFile && (
          <div className="flex items-center gap-3">
            {lastSaved > 0 && (
              <span className="text-xs text-gray-400 mr-2 hidden sm:inline">
                Saved
              </span>
            )}

            <Button onClick={() => saveFile(true)} size="sm" variant="ghost">
              <Icons.Save className="mr-2" size={16} />
              Save
            </Button>

            <button
              onClick={() => setState(s => ({ ...s, focusMode: !s.focusMode }))}
              className={`p-2 rounded-lg transition-colors ${state.focusMode ? 'bg-gold-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500'}`}
              title="Focus Mode"
            >
              <Icons.Focus size={20} />
            </button>
          </div>
        )}
      </nav>

      {/* Permission Warning Toast */}
      {permissionMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-4 rounded-full shadow-xl animate-in fade-in slide-in-from-top-4 flex items-center gap-3 border border-blue-400">
          <Icons.Info size={24} className="shrink-0" />
          <div className="text-sm font-medium pr-2">{permissionMessage}</div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {activeFile ? (
          <div className="flex-1 overflow-y-auto">
            <Editor
              ref={editorRef}
              content={activeFile.content || ''}
              onChange={updateContent}
              title={activeFile.title}
              onTitleChange={updateTitle}
              focusMode={state.focusMode}
              active={userActivity}
            />
          </div>
        ) : (
          /* Decision Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="max-w-2xl w-full text-center space-y-12">
              <div className="space-y-4">
                <h2 className="text-4xl font-serif font-bold text-gray-900 dark:text-white">Ready to write?</h2>
                <p className="text-xl text-gray-500 dark:text-gray-400">Start a fresh masterpiece or continue where you left off.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <button
                  onClick={handleCreateNew}
                  className="group flex flex-col items-center p-8 rounded-3xl bg-white dark:bg-neutral-800 border-2 border-transparent hover:border-gold-400 dark:hover:border-gold-500/50 shadow-xl hover:shadow-2xl hover:shadow-gold-500/10 transition-all duration-300 transform hover:-translate-y-1 py-12"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gold-100 dark:bg-gold-500/20 text-gold-600 dark:text-gold-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Icons.FilePlus size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">New Document</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Start with a blank canvas</p>
                </button>

                <button
                  onClick={handleOpenFile}
                  className="group flex flex-col items-center p-8 rounded-3xl bg-white dark:bg-neutral-800 border-2 border-transparent hover:border-gold-400 dark:hover:border-gold-500/50 shadow-xl hover:shadow-2xl hover:shadow-gold-500/10 transition-all duration-300 transform hover:-translate-y-1 py-12"
                >
                  <div className="w-16 h-16 rounded-2xl bg-cream-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Icons.FolderOpen size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Open File</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Select a .txt file from your computer</p>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

    </div>
  );
};

export default App;