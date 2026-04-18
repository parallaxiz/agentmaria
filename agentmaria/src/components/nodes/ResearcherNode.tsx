import { BaseNode } from './BaseNode';
import { Search } from 'lucide-react';

export const ResearcherNode = ({ id, data, selected }: any) => {
  return (
    <BaseNode 
      id={id}
      icon={Search} 
      title="Researcher" 
      selected={selected}
      status={data.status}
    />
  );
};
