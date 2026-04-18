import { Handle, Position } from '@xyflow/react';
import { Bot, Info } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const OrchestratorNode = ({ data, selected }: any) => {
  const updateBlackboard = useStore((state) => state.updateBlackboard);
  const activeProjectId = useStore((state) => state.activeProjectId);
  const project = useStore((state) => state.projects.find(p => p.id === activeProjectId));
  
  const coreGoal = project?.blackboard?.core_goal || { projectName: '', description: '', reference: '' };

  const handleChange = (field: string, value: string) => {
    updateBlackboard('core_goal', { ...coreGoal, [field]: value });
  };

  return (
    <div className={cn(
      "w-72 bg-bg-secondary border border-border rounded-2xl p-4 shadow-2xl transition-all duration-300",
      selected && "ring-2 ring-brand border-brand/50 scale-[1.02]",
      data.status === 'processing' && "animate-pulse border-brand"
    )}>
      <Handle type="target" position={Position.Left} className="!bg-brand !border-none !w-2 !h-8 !rounded-none !-left-[1px]" />
      
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-indigo-400/10 text-indigo-400">
          <Bot size={18} />
        </div>
        <div className="flex-grow">
          <h3 className="text-sm font-bold text-text-primary tracking-tight">Main Orchestrator</h3>
          <p className="text-[10px] text-text-tertiary uppercase font-black tracking-widest leading-none">Initialization Node</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-[9px] uppercase font-black text-text-tertiary tracking-widest pl-1">Project Name</label>
          <input 
            type="text" 
            value={coreGoal.projectName}
            onChange={(e) => handleChange('projectName', e.target.value)}
            placeholder="e.g. Student Manager"
            className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:ring-1 focus:ring-brand outline-none transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] uppercase font-black text-text-tertiary tracking-widest pl-1">Project Description</label>
          <textarea 
            rows={3}
            value={coreGoal.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Deep brief of functionality..."
            className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:ring-1 focus:ring-brand outline-none transition-all resize-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] uppercase font-black text-text-tertiary tracking-widest pl-1 flex items-center gap-1">
            Reference Theme <Info size={10} className="text-text-tertiary" />
          </label>
          <input 
            type="text"
            value={coreGoal.reference}
            onChange={(e) => handleChange('reference', e.target.value)}
            placeholder="Colors, links, UI notes..."
            className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:ring-1 focus:ring-brand outline-none transition-all"
          />
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-brand !border-none !w-2 !h-8 !rounded-none !-right-[1px]" />
    </div>
  );
};
