import { BaseNode } from './BaseNode';
import { ClipboardList } from 'lucide-react';

export const PlannerNode = ({ id, data, selected }: any) => {
  return (
    <BaseNode 
      id={id}
      icon={ClipboardList} 
      title="Planner" 
      selected={selected}
      status={data.status}
    />
  );
};
