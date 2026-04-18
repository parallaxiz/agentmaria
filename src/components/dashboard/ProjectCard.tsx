import { Layout, Calendar, Trash2, ArrowRight } from 'lucide-react';
import { type Project, useStore } from '../../store/useStore';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const setActiveProject = useStore((state) => state.setActiveProject);
  const deleteProject = useStore((state) => state.deleteProject);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="group bg-bg-secondary border border-border rounded-2xl p-6 hover:border-brand/40 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(59,130,246,0.05)] flex flex-col h-full relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-500">
        <Layout size={100} className="rotate-12 translate-x-4 -translate-y-4" />
      </div>

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="px-3 py-1 bg-brand/10 text-brand text-[10px] font-bold uppercase tracking-widest rounded-full border border-brand/20">
          Project Workflow
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this project?')) {
              deleteProject(project.id);
            }
          }}
          className="p-2 text-text-tertiary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all relative z-20"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <h3 className="text-xl font-bold mb-2 group-hover:text-brand transition-colors line-clamp-1 relative z-10">
        {project.name}
      </h3>
      
      <p className="text-text-secondary text-sm mb-6 line-clamp-3 flex-grow leading-relaxed">
        {project.brief || 'No description provided.'}
      </p>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
        <div className="flex items-center gap-2 text-text-tertiary text-xs">
          <Calendar size={14} />
          <span>{formatDate(project.createdAt)}</span>
        </div>
        <button 
          onClick={() => setActiveProject(project.id)}
          className="flex items-center gap-2 text-sm font-bold text-brand hover:gap-3 transition-all"
        >
          Open Editor
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
