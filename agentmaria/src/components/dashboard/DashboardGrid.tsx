import React, { useState } from 'react';
import { Plus, LayoutGrid, Search } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ProjectCard } from './ProjectCard';
import { CreateProjectModal } from './CreateProjectModal';

export const DashboardGrid: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const projects = useStore((state) => state.projects);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.brief?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary flex items-center gap-3">
              <LayoutGrid className="text-brand" size={28} />
              Project Management
            </h1>
            <p className="text-text-secondary text-lg">Manage your node-based workflows and team assignments.</p>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-brand hover:bg-brand-hover text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-brand/20 flex items-center justify-center gap-2 active:scale-95"
          >
            <Plus size={20} />
            Create Project
          </button>
        </div>

        {/* Search & Stats */}
        <div className="flex flex-col md:flex-row items-center gap-4 bg-bg-secondary/50 p-2 rounded-2xl border border-border">
          <div className="relative flex-grow w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by name or brief..."
              className="w-full bg-bg-primary/50 border border-transparent focus:border-border rounded-xl pl-12 pr-4 py-3 focus:outline-none transition-all"
            />
          </div>
          <div className="hidden md:flex items-center gap-6 px-4 whitespace-nowrap">
            <div className="flex items-center gap-2">
              <span className="text-text-tertiary text-sm font-medium">Total:</span>
              <span className="text-text-primary font-bold">{projects.length}</span>
            </div>
          </div>
        </div>

        {/* Grid Section */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-bg-secondary/30 border border-dashed border-border rounded-3xl space-y-4">
            <div className="p-4 bg-bg-tertiary rounded-full text-text-tertiary">
              <LayoutGrid size={40} />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-text-primary">No projects found</h3>
              <p className="text-text-secondary">Start by creating your first project workflow.</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-brand font-bold hover:underline"
            >
              Initialize new project →
            </button>
          </div>
        )}
      </div>

      <CreateProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};
