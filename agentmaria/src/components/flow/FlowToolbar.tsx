import { 
  Play, 
  ArrowLeft, 
  ClipboardList, 
  Search, 
  Palette, 
  Code2, 
  CheckSquare, 
  FileText 
} from 'lucide-react';
import { useStore } from '../../store/useStore';

const nodeTypes = [
  { type: 'planner', name: 'Planner', icon: ClipboardList, color: 'text-emerald-500' },
  { type: 'researcher', name: 'Researcher', icon: Search, color: 'text-cyan-500' },
  { type: 'designer', name: 'Designer', icon: Palette, color: 'text-purple-500' },
  { type: 'developer', name: 'Developer', icon: Code2, color: 'text-blue-500' },
  { type: 'tester', name: 'Tester', icon: CheckSquare, color: 'text-orange-500' },
  { type: 'writer', name: 'Writer', icon: FileText, color: 'text-pink-500' },
];

interface FlowToolbarProps {
  onSimulate: () => void;
  isSimulating: boolean;
}

export const FlowToolbar: React.FC<FlowToolbarProps> = ({ onSimulate, isSimulating }) => {
  const setActiveProject = useStore((state) => state.setActiveProject);
  const addNode = useStore((state) => state.addNode);

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[50] flex items-center gap-4 px-4 py-3 bg-bg-secondary/80 backdrop-blur-xl border border-border rounded-2xl shadow-2xl">
      <button 
        onClick={() => setActiveProject(null)}
        className="p-2 hover:bg-bg-tertiary rounded-xl text-text-tertiary hover:text-text-primary transition-all border border-transparent hover:border-border"
        title="Back to Dashboard"
      >
        <ArrowLeft size={20} />
      </button>

      <div className="w-px h-6 bg-border mx-2" />

      <div className="flex items-center gap-2">
        {nodeTypes.map((node) => (
          <button
            key={node.type}
            onClick={() => addNode(node.type, { x: 100, y: 100 })}
            className="flex items-center gap-2 px-3 py-2 bg-bg-primary border border-border rounded-xl text-xs font-bold hover:bg-bg-tertiary transition-all hover:scale-105"
          >
            <node.icon className={node.color} size={14} />
            {node.name}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-border mx-2" />

      <button 
        onClick={onSimulate}
        disabled={isSimulating}
        className="flex items-center gap-2 bg-brand hover:bg-brand-hover disabled:bg-brand/50 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-brand/20 transition-all active:scale-95 whitespace-nowrap"
      >
        {isSimulating ? (
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
        ) : (
          <>
            <Play size={16} fill="white" />
            Run Simulation
          </>
        )}
      </button>
    </div>
  );
};
