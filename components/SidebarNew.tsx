import React, { useState } from 'react';
import { FileNode, NodeType, Book } from '../types';
import { Icons } from './Icons';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SidebarProps {
  isOpen: boolean;
  books: Book[];
  fileMap: Record<string, FileNode>;
  activeBookId: string;
  activeFileId: string | null;
  rootFolderId: string;
  onCreateNode: (type: NodeType, parentId: string) => void;
  onDeleteNode: (id: string) => void;
  onSelectFile: (id: string) => void;
  onToggleFolder: (id: string) => void;
  onRenameNode: (id: string, newTitle: string) => void;
  onReorganize: (sourceId: string, targetParentId: string, newIndex?: number) => void;
  onOpenFolder: () => void;
  onCreateBook: () => void;
  onSwitchBook: (id: string) => void;
  onDeleteBook: (id: string) => void;
  onRenameBook: (id: string, newTitle: string) => void;
  onUpdateTags: (id: string, tags: string[]) => void;
}

interface SortableItemProps {
  node: FileNode;
  activeFileId: string | null;
  editingId: string | null;
  editTitle: string;
  depth: number;
  onSelect: () => void;
  onToggle: () => void;
  onStartRename: (e: React.MouseEvent) => void;
  onSetEditTitle: (title: string) => void;
  onFinishRename: () => void;
  onCancelRename: () => void;
  onDelete: () => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  children?: React.ReactNode;
}

const SortableItem: React.FC<SortableItemProps> = ({
  node,
  activeFileId,
  editingId,
  editTitle,
  depth,
  onSelect,
  onToggle,
  onStartRename,
  onSetEditTitle,
  onFinishRename,
  onCancelRename,
  onDelete,
  onAddTag,
  onRemoveTag,
  children
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState('');

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isActive = activeFileId === node.id;
  const isEditing = editingId === node.id;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onFinishRename();
    if (e.key === 'Escape') onCancelRename();
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      onAddTag(newTag.trim());
      setNewTag('');
      setShowTagInput(false);
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`group flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors cursor-pointer
           ${isActive
            ? 'bg-gold-100 dark:bg-gold-900/20'
            : 'hover:bg-cream-200 dark:hover:bg-white/5'
          }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => node.type === NodeType.FILE ? onSelect() : onToggle()}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="text-gray-300 dark:text-gray-600 hover:text-gold-500 cursor-grab active:cursor-grabbing"
        >
          <Icons.GripVertical size={14} />
        </div>

        {/* Icon */}
        <div className="text-gray-400 dark:text-gray-500 w-3.5 flex justify-center">
          {node.type === NodeType.FOLDER ? (
            node.isOpen ? <Icons.ChevronDown size={14} /> : <Icons.ChevronRight size={14} />
          ) : <div className="w-3.5" />}
        </div>

        {/* Title or Edit Input */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {node.type === NodeType.FOLDER ? (
            <Icons.Folder size={14} className={isActive ? 'text-gold-500' : 'text-gray-400'} />
          ) : (
            <Icons.FileText className={`w-3.5 h-3.5 ${isActive ? 'text-gold-500' : 'text-gray-400'}`} />
          )}

          {isEditing ? (
            <input
              autoFocus
              value={editTitle}
              onChange={(e) => onSetEditTitle(e.target.value)}
              onBlur={onFinishRename}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-white dark:bg-black border border-gold-400 rounded px-1 py-0.5 text-xs text-black dark:text-white focus:outline-none"
            />
          ) : (
            <span className={`truncate text-sm ${isActive ? 'text-gold-900 dark:text-gold-100 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
              {node.title}
            </span>
          )}
        </div>

        {/* Tags Display */}
        {node.tags && node.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {node.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] px-1.5 py-0.5 rounded-full bg-gold-200 dark:bg-gold-800 text-gold-800 dark:text-gold-200 flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                {tag}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveTag(tag);
                  }}
                  className="hover:text-red-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Actions (Hover) */}
        {!isEditing && (
          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowTagInput(!showTagInput);
              }}
              className="p-1.5 text-gray-400 hover:text-blue-600"
              title="Add Tag"
            >
              <Icons.Tag size={12} />
            </button>
            <button
              type="button"
              onClick={onStartRename}
              className="p-1.5 text-gray-400 hover:text-gold-600"
              title="Rename"
            >
              <Icons.Edit3 size={12} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 text-gray-400 hover:text-red-500"
              title="Delete"
            >
              <Icons.Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Tag Input */}
      {showTagInput && (
        <div
          className="ml-8 mt-1 mb-2 flex gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            autoFocus
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddTag();
              if (e.key === 'Escape') setShowTagInput(false);
            }}
            placeholder="Add tag..."
            className="flex-1 bg-white dark:bg-black border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-gold-500"
          />
          <button
            onClick={handleAddTag}
            className="px-2 py-1 bg-gold-500 text-white text-xs rounded hover:bg-gold-600"
          >
            Add
          </button>
        </div>
      )}

      {/* Render children (nested items) */}
      {node.type === NodeType.FOLDER && node.isOpen && children}
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  books,
  fileMap,
  activeBookId,
  activeFileId,
  rootFolderId,
  onCreateNode,
  onDeleteNode,
  onSelectFile,
  onToggleFolder,
  onRenameNode,
  onReorganize,
  onOpenFolder,
  onCreateBook,
  onSwitchBook,
  onDeleteBook,
  onRenameBook,
  onUpdateTags
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle Node Rename
  const startRename = (e: React.MouseEvent, node: FileNode) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingId(node.id);
    setEditTitle(node.title);
  };

  const finishRename = () => {
    if (editingId && editTitle.trim()) {
      onRenameNode(editingId, editTitle);
    }
    setEditingId(null);
  };

  // Handle Project Rename
  const handleProjectRename = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const activeBook = books.find(b => b.id === activeBookId);
    if (!activeBook) return;

    const newName = prompt("Enter new project name:", activeBook.title);
    if (newName && newName.trim()) {
      onRenameBook(activeBookId, newName.trim());
    }
  };

  // Handle Project Delete
  const handleProjectDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const confirmDelete = window.confirm("Are you sure you want to delete this project?");
    if (confirmDelete) {
      onDeleteBook(activeBookId);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const activeNode = fileMap[active.id];
    const overNode = fileMap[over.id];

    if (!activeNode || !overNode) return;

    // Determine the target parent
    let targetParentId = overNode.type === NodeType.FOLDER ? overNode.id : overNode.parentId;

    if (!targetParentId) return;

    // Call reorganize handler
    onReorganize(activeNode.id, targetParentId);
  };

  const handleAddTag = (nodeId: string, tag: string) => {
    const node = fileMap[nodeId];
    const currentTags = node.tags || [];
    if (!currentTags.includes(tag)) {
      onUpdateTags(nodeId, [...currentTags, tag]);
    }
  };

  const handleRemoveTag = (nodeId: string, tag: string) => {
    const node = fileMap[nodeId];
    const currentTags = node.tags || [];
    onUpdateTags(nodeId, currentTags.filter(t => t !== tag));
  };

  const renderTree = (parentId: string, depth = 0): React.ReactNode => {
    const parent = fileMap[parentId];
    if (!parent?.children) return null;

    const childIds = parent.children;

    return (
      <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-0.5">
          {childIds.map(childId => {
            const node = fileMap[childId];
            if (!node) return null;

            return (
              <SortableItem
                key={node.id}
                node={node}
                activeFileId={activeFileId}
                editingId={editingId}
                editTitle={editTitle}
                depth={depth}
                onSelect={() => onSelectFile(node.id)}
                onToggle={() => onToggleFolder(node.id)}
                onStartRename={(e) => startRename(e, node)}
                onSetEditTitle={setEditTitle}
                onFinishRename={finishRename}
                onCancelRename={() => setEditingId(null)}
                onDelete={() => {
                  const confirmDelete = window.confirm(`Are you sure you want to delete "${node.title}"?`);
                  if (confirmDelete) {
                    onDeleteNode(node.id);
                  }
                }}
                onAddTag={(tag) => handleAddTag(node.id, tag)}
                onRemoveTag={(tag) => handleRemoveTag(node.id, tag)}
              >
                {node.type === NodeType.FOLDER && node.isOpen && renderTree(node.id, depth + 1)}
              </SortableItem>
            );
          })}
        </div>
      </SortableContext>
    );
  };

  const activeNode = activeId ? fileMap[activeId] : null;

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-cream-100 dark:bg-neutral-900 border-r border-gold-200/50 dark:border-white/5 w-72 pt-20 transition-all duration-500 z-30 flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* Project Switcher */}
      <div className="px-4 mb-4">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Current Project</label>
        <div className="flex gap-2">
          <select
            value={activeBookId}
            onChange={(e) => onSwitchBook(e.target.value)}
            className="flex-1 bg-white dark:bg-black border border-gray-200 dark:border-neutral-700 rounded-lg px-2 py-1.5 text-sm focus:ring-1 focus:ring-gold-500 focus:outline-none dark:text-white cursor-pointer"
          >
            {books.map(b => (
              <option key={b.id} value={b.id}>{b.title}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={onCreateBook}
            className="p-1.5 bg-gold-500 text-white rounded-lg hover:bg-gold-600 shadow-sm flex-shrink-0"
            title="New Project"
          >
            <Icons.Plus size={16} />
          </button>
        </div>
        <div className="flex justify-end mt-2 gap-3">
          <button
            type="button"
            onClick={handleProjectRename}
            className="text-xs text-gray-500 hover:text-gold-600 flex items-center gap-1.5 px-2 py-1 hover:bg-gold-50 dark:hover:bg-gold-900/20 rounded transition-colors"
          >
            <Icons.Edit3 size={12} /> Rename
          </button>
          <button
            type="button"
            onClick={handleProjectDelete}
            className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1.5 px-2 py-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          >
            <Icons.Trash2 size={12} /> Delete
          </button>
        </div>
      </div>

      <div className="w-full h-px bg-gray-200 dark:bg-white/5 mb-4"></div>

      {/* Toolbar */}
      <div className="px-4 mb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Files</span>
        </div>
        <div className="grid grid-cols-3 gap-1 p-1 bg-white/50 dark:bg-white/5 rounded-lg border border-gold-100 dark:border-white/5">
          <button type="button" onClick={() => onCreateNode(NodeType.FILE, rootFolderId)} className="p-1.5 flex justify-center hover:bg-gold-200 dark:hover:bg-white/10 rounded text-gray-500" title="New File">
            <Icons.Plus size={16} />
          </button>
          <button type="button" onClick={() => onCreateNode(NodeType.FOLDER, rootFolderId)} className="p-1.5 flex justify-center hover:bg-gold-200 dark:hover:bg-white/10 rounded text-gray-500" title="New Folder">
            <Icons.FolderPlus size={16} />
          </button>
          <button
            type="button"
            onClick={onOpenFolder}
            className="p-1.5 flex justify-center hover:bg-gold-200 dark:hover:bg-white/10 rounded text-gray-500"
            title="Import Folder"
          >
            <Icons.Upload size={16} />
          </button>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto px-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {renderTree(rootFolderId)}
          <DragOverlay>
            {activeNode ? (
              <div className="bg-gold-100 dark:bg-gold-900/40 px-3 py-2 rounded-md shadow-lg">
                <span className="text-sm font-medium">{activeNode.title}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Bottom Status */}
      <div className="p-4 border-t border-gold-200/50 dark:border-white/5 text-xs text-gray-400 text-center">
        {fileMap[rootFolderId]?.children?.length || 0} top-level items
      </div>
    </aside>
  );
};
