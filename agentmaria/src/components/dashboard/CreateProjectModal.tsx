import React, { useState } from 'react';
import { X, Plus, Clipboard } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [brief, setBrief] = useState('');
  const addProject = useStore((state) => state.addProject);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      addProject(name, brief);
      setName('');
      setBrief('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-bg-secondary border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-border flex items-center justify-between bg-bg-tertiary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/10 text-brand rounded-xl">
              <Plus size={20} />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Create New Project</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-bg-tertiary rounded-full transition-colors text-text-tertiary hover:text-text-primary"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary ml-1">Project Name</label>
            <input 
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. NextGen E-commerce Platform"
              className="w-full bg-bg-primary border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all placeholder:text-text-tertiary"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary ml-1">Initial Brief</label>
            <textarea 
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Describe the project goals, tech stack, and core features..."
              className="w-full bg-bg-primary border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all h-32 resize-none placeholder:text-text-tertiary"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-brand/20 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Clipboard size={18} />
            Initialize Project
          </button>
        </form>
      </div>
    </div>
  );
};
