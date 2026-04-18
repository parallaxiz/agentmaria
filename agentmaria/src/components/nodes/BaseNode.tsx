import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { type LucideIcon, Plus, ClipboardList, Search, Palette, Code2, CheckSquare, FileText, Bot } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useStore } from '../../store/useStore';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const nodeSelection = [
  { type: 'planner', name: 'Planner', icon: ClipboardList, color: 'text-emerald-500' },
  { type: 'researcher', name: 'Researcher', icon: Search, color: 'text-cyan-500' },
  { type: 'designer', name: 'Designer', icon: Palette, color: 'text-purple-500' },
  { type: 'developer', name: 'Developer', icon: Code2, color: 'text-blue-500' },
  { type: 'tester', name: 'Tester', icon: CheckSquare, color: 'text-orange-500' },
  { type: 'writer', name: 'Writer', icon: FileText, color: 'text-pink-500' },
  { type: 'orchestrator', name: 'Orchestrator', icon: Bot, color: 'text-indigo-400' },
];

interface BaseNodeProps {
  id: string;
  icon: LucideIcon;
  title: string;
  selected?: boolean;
  status?: 'idle' | 'processing' | 'done' | 'error' | 'waiting';
  className?: string;
}

export const BaseNode: React.FC<BaseNodeProps> = ({ 
  id,
  icon: Icon, 
  title, 
  selected, 
  status = 'idle',
  className 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const addNodeAndConnect = useStore((state) => state.addNodeAndConnect);

  const handleQuickAdd = (type: string) => {
    addNodeAndConnect(type, id);
    setShowMenu(false);
  };

  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/reactflow-node', JSON.stringify({ id }));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div 
      draggable
      onDragStart={onDragStart}
      className={cn(
      "group relative flex items-center gap-3 bg-bg-secondary border border-border rounded-full px-3 py-1.5 hover:border-brand/50 transition-all duration-300 shadow-lg",
      selected && "ring-2 ring-brand border-brand/50 scale-105 z-50",
      status === 'processing' && "animate-pulse border-brand",
      status === 'done' && "border-emerald-500/50",
      status === 'error' && "border-red-500 ring-2 ring-red-500/50 bg-red-500/5",
      status === 'waiting' && "border-amber-500 animate-pulse ring-2 ring-amber-500/20",
      className
    )}>
      {/* Input Handle */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!w-2 !h-2 !bg-brand !border-none !-left-1"
      />

      {/* Main Content (Pill Style) */}
      <div className={cn(
        "p-1 rounded-full",
        status === 'done' ? "bg-emerald-500/10 text-emerald-500" : 
        status === 'error' ? "bg-red-500/10 text-red-500" :
        "bg-brand/10 text-brand"
      )}>
        <Icon size={14} />
      </div>
      <span className="text-xs font-bold tracking-tight text-text-primary whitespace-nowrap pr-2">
        {title}
      </span>

      {/* Output Handle styled as Plus Button */}
      <div className="relative">
        <Handle 
          type="source" 
          position={Position.Right} 
          className="!w-4 !h-4 !bg-bg-tertiary !border border-border flex items-center justify-center !-right-2 hover:!bg-brand hover:!border-brand transition-colors cursor-pointer"
          onClick={() => setShowMenu(!showMenu)}
        >
          <Plus size={10} className="text-text-primary pointer-events-none" />
        </Handle>

        {/* Floating Selection Menu */}
        {showMenu && (
          <div className="absolute left-6 top-0 z-[100] w-48 bg-bg-secondary border border-border rounded-xl shadow-2xl p-2 animate-in fade-in zoom-in duration-200">
            <p className="text-[10px] uppercase tracking-widest font-bold text-text-tertiary p-2">Next Step</p>
            {nodeSelection.map((node) => (
              <button
                key={node.type}
                onClick={() => handleQuickAdd(node.type)}
                className="w-full flex items-center gap-3 p-2 hover:bg-bg-tertiary rounded-lg text-xs font-semibold text-text-secondary hover:text-text-primary transition-all"
              >
                <div className={cn("p-1.5 rounded-lg bg-bg-primary", node.color.replace('text', 'bg').replace('500', '500/10'))}>
                  <node.icon size={14} className={node.color} />
                </div>
                {node.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Processing Indicator */}
      {status === 'processing' && (
        <div className="absolute -top-1 -right-1 flex gap-0.5">
          <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" />
          <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:0.2s]" />
          <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:0.4s]" />
        </div>
      )}
    </div>
  );
};
