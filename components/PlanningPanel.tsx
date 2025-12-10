import React, { useState } from 'react';
import { Icons } from './Icons';
import { FileNode, NodeType } from '../types';

interface Character {
  id: string;
  name: string;
  role: string;
  description: string;
  notes: string;
}

interface Scene {
  id: string;
  title: string;
  summary: string;
  characters: string[];
  location: string;
  notes: string;
}

interface PlanningPanelProps {
  fileMap: Record<string, FileNode>;
  onClose: () => void;
}

export const PlanningPanel: React.FC<PlanningPanelProps> = ({ fileMap, onClose }) => {
  const [activeTab, setActiveTab] = useState<'characters' | 'scenes' | 'outline'>('characters');
  const [characters, setCharacters] = useState<Character[]>(() => {
    const saved = localStorage.getItem('better-writer-characters');
    return saved ? JSON.parse(saved) : [];
  });
  const [scenes, setScenes] = useState<Scene[]>(() => {
    const saved = localStorage.getItem('better-writer-scenes');
    return saved ? JSON.parse(saved) : [];
  });

  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [showCharacterForm, setShowCharacterForm] = useState(false);
  const [showSceneForm, setShowSceneForm] = useState(false);

  // Save to localStorage whenever changes occur
  React.useEffect(() => {
    localStorage.setItem('better-writer-characters', JSON.stringify(characters));
  }, [characters]);

  React.useEffect(() => {
    localStorage.setItem('better-writer-scenes', JSON.stringify(scenes));
  }, [scenes]);

  const handleAddCharacter = () => {
    const newCharacter: Character = {
      id: Date.now().toString(),
      name: '',
      role: '',
      description: '',
      notes: ''
    };
    setEditingCharacter(newCharacter);
    setShowCharacterForm(true);
  };

  const handleSaveCharacter = () => {
    if (!editingCharacter) return;

    const exists = characters.find(c => c.id === editingCharacter.id);
    if (exists) {
      setCharacters(characters.map(c => c.id === editingCharacter.id ? editingCharacter : c));
    } else {
      setCharacters([...characters, editingCharacter]);
    }
    setEditingCharacter(null);
    setShowCharacterForm(false);
  };

  const handleDeleteCharacter = (id: string) => {
    if (confirm('Delete this character?')) {
      setCharacters(characters.filter(c => c.id !== id));
    }
  };

  const handleAddScene = () => {
    const newScene: Scene = {
      id: Date.now().toString(),
      title: '',
      summary: '',
      characters: [],
      location: '',
      notes: ''
    };
    setEditingScene(newScene);
    setShowSceneForm(true);
  };

  const handleSaveScene = () => {
    if (!editingScene) return;

    const exists = scenes.find(s => s.id === editingScene.id);
    if (exists) {
      setScenes(scenes.map(s => s.id === editingScene.id ? editingScene : s));
    } else {
      setScenes([...scenes, editingScene]);
    }
    setEditingScene(null);
    setShowSceneForm(false);
  };

  const handleDeleteScene = (id: string) => {
    if (confirm('Delete this scene?')) {
      setScenes(scenes.filter(s => s.id !== id));
    }
  };

  // Build outline from fileMap
  const buildOutline = (nodeId: string, depth: number = 0): React.ReactNode => {
    const node = fileMap[nodeId];
    if (!node) return null;

    return (
      <div key={node.id} style={{ marginLeft: `${depth * 20}px` }} className="mb-2">
        <div className="flex items-center gap-2 py-1 px-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded">
          {node.type === NodeType.FOLDER ? (
            <>
              <Icons.Folder size={16} className="text-gold-500" />
              <span className="font-medium text-gray-900 dark:text-white">{node.title}</span>
              <span className="text-xs text-gray-400">({node.children?.length || 0} items)</span>
            </>
          ) : (
            <>
              <Icons.FileText size={16} className="text-blue-500" />
              <span className="text-gray-700 dark:text-gray-300">{node.title}</span>
              <span className="text-xs text-gray-400">({node.wordCount || 0} words)</span>
            </>
          )}
        </div>
        {node.type === NodeType.FOLDER && node.children && (
          <div>
            {node.children.map(childId => buildOutline(childId, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootNodes = Object.values(fileMap).filter((n): n is FileNode => !n.parentId);

  return (
    <div className="fixed inset-0 bg-cream-50 dark:bg-neutral-900 z-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-white/10 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Icons.Layout size={28} className="text-gold-500" />
            Planning & Organization
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg"
          >
            <Icons.X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab('characters')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'characters'
              ? 'bg-gold-500 text-white'
              : 'bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600'
              }`}
          >
            Characters
          </button>
          <button
            onClick={() => setActiveTab('scenes')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'scenes'
              ? 'bg-gold-500 text-white'
              : 'bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600'
              }`}
          >
            Scenes
          </button>
          <button
            onClick={() => setActiveTab('outline')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'outline'
              ? 'bg-gold-500 text-white'
              : 'bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600'
              }`}
          >
            Outline
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {activeTab === 'characters' && (
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Character Cards</h3>
              <button
                onClick={handleAddCharacter}
                className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg font-medium flex items-center gap-2"
              >
                <Icons.Plus size={16} />
                Add Character
              </button>
            </div>

            {showCharacterForm && editingCharacter && (
              <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg p-6 mb-6 border border-gold-100 dark:border-white/10">
                <h4 className="font-bold text-lg mb-4">
                  {characters.find(c => c.id === editingCharacter.id) ? 'Edit Character' : 'New Character'}
                </h4>
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input
                      type="text"
                      value={editingCharacter.name}
                      onChange={(e) => setEditingCharacter({ ...editingCharacter, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-white"
                      placeholder="Character name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Role</label>
                    <input
                      type="text"
                      value={editingCharacter.role}
                      onChange={(e) => setEditingCharacter({ ...editingCharacter, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-white"
                      placeholder="e.g., Protagonist, Antagonist, Supporting"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={editingCharacter.description}
                      onChange={(e) => setEditingCharacter({ ...editingCharacter, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-white"
                      rows={3}
                      placeholder="Physical appearance, personality traits..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea
                      value={editingCharacter.notes}
                      onChange={(e) => setEditingCharacter({ ...editingCharacter, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-white"
                      rows={3}
                      placeholder="Goals, backstory, arc ideas..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveCharacter}
                      className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingCharacter(null);
                        setShowCharacterForm(false);
                      }}
                      className="px-4 py-2 bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {characters.map(character => (
                <div
                  key={character.id}
                  className="bg-white dark:bg-neutral-800 rounded-xl shadow p-4 border border-gray-200 dark:border-white/10 hover:border-gold-400 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white">{character.name || 'Unnamed'}</h4>
                      <p className="text-sm text-gold-600">{character.role}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingCharacter(character);
                          setShowCharacterForm(true);
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded"
                      >
                        <Icons.Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteCharacter(character.id)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-500"
                      >
                        <Icons.Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{character.description}</p>
                  {character.notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 italic">{character.notes}</p>
                  )}
                </div>
              ))}
            </div>

            {characters.length === 0 && !showCharacterForm && (
              <div className="text-center py-12 text-gray-500">
                <p>No characters yet. Click "Add Character" to get started!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'scenes' && (
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Scene Cards</h3>
              <button
                onClick={handleAddScene}
                className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg font-medium flex items-center gap-2"
              >
                <Icons.Plus size={16} />
                Add Scene
              </button>
            </div>

            {showSceneForm && editingScene && (
              <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg p-6 mb-6 border border-gold-100 dark:border-white/10">
                <h4 className="font-bold text-lg mb-4">
                  {scenes.find(s => s.id === editingScene.id) ? 'Edit Scene' : 'New Scene'}
                </h4>
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                      type="text"
                      value={editingScene.title}
                      onChange={(e) => setEditingScene({ ...editingScene, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-white"
                      placeholder="Scene title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Summary</label>
                    <textarea
                      value={editingScene.summary}
                      onChange={(e) => setEditingScene({ ...editingScene, summary: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-white"
                      rows={3}
                      placeholder="What happens in this scene?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Location</label>
                    <input
                      type="text"
                      value={editingScene.location}
                      onChange={(e) => setEditingScene({ ...editingScene, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-white"
                      placeholder="Where does this take place?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea
                      value={editingScene.notes}
                      onChange={(e) => setEditingScene({ ...editingScene, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-white"
                      rows={2}
                      placeholder="Additional notes..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveScene}
                      className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingScene(null);
                        setShowSceneForm(false);
                      }}
                      className="px-4 py-2 bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {scenes.map(scene => (
                <div
                  key={scene.id}
                  className="bg-white dark:bg-neutral-800 rounded-xl shadow p-5 border border-gray-200 dark:border-white/10 hover:border-gold-400 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{scene.title || 'Untitled Scene'}</h4>
                      {scene.location && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Icons.Layout size={14} />
                          {scene.location}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingScene(scene);
                          setShowSceneForm(true);
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded"
                      >
                        <Icons.Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteScene(scene.id)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-500"
                      >
                        <Icons.Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{scene.summary}</p>
                  {scene.notes && (
                    <p className="text-xs text-gray-500 italic">{scene.notes}</p>
                  )}
                </div>
              ))}
            </div>

            {scenes.length === 0 && !showSceneForm && (
              <div className="text-center py-12 text-gray-500">
                <p>No scenes yet. Click "Add Scene" to get started!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'outline' && (
          <div className="max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Project Outline</h3>
            <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-white/10">
              {rootNodes.length > 0 ? (
                rootNodes.map((node: FileNode) => buildOutline(node.id))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No files or folders yet. Create some content to see your outline!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
