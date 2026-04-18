import React from 'react';
import { 
  ClipboardList, 
  Search, 
  Palette, 
  Code2, 
  CheckSquare, 
  FileText 
} from 'lucide-react';

const nodeTypes = [
  { type: 'planner', name: 'Planner', icon: ClipboardList, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { type: 'researcher', name: 'Researcher', icon: Search, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  { type: 'designer', name: 'Designer', icon: Palette, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { type: 'developer', name: 'Developer', icon: Code2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { type: 'tester', name: 'Tester', icon: CheckSquare, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { type: 'writer', name: 'Writer', icon: FileText, color: 'text-pink-500', bg: 'bg-pink-500/10' },
];

export const FlowSidebar: React.FC = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-64 bg-bg-secondary border-r border-border p-6 flex flex-col gap-6">
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Node Library</h3>
        <p className="text-xs text-text-tertiary">Drag nodes onto the canvas to build your workflow.</p>
      </div>

      <div className="flex flex-col gap-3">
        {nodeTypes.map((node) => (
          <div
            key={node.type}
            draggable
            onDragStart={(e) => onDragStart(e, node.type)}
            className="flex items-center gap-3 p-3 bg-bg-primary border border-border rounded-xl cursor-grab active:cursor-grabbing hover:border-brand/50 hover:shadow-lg hover:shadow-brand/5 transition-all group"
          >
            <div className={`p-2 rounded-lg ${node.bg} ${node.color} group-hover:scale-110 transition-transform`}>
              <node.icon size={18} />
            </div>
            <span className="text-sm font-semibold text-text-secondary group-hover:text-text-primary transition-colors">
              {node.name}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-auto p-4 bg-bg-tertiary/20 rounded-xl border border-border/50">
        <p className="text-[10px] text-text-tertiary leading-relaxed uppercase tracking-widest font-bold mb-2">Instructions</p>
        <p className="text-[11px] text-text-secondary leading-relaxed">
          1. Select a node type<br/>
          2. Drag it to the canvas<br/>
          3. Connect handles to define data flow
        </p>
      </div>
    </aside>
  );
};
