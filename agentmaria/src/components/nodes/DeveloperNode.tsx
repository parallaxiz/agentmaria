import { BaseNode } from './BaseNode';
import { Code2 } from 'lucide-react';

export const DeveloperNode = ({ id, data, selected }: any) => {
  return (
    <BaseNode 
      id={id}
      icon={Code2} 
      title="Developer" 
      selected={selected}
      status={data.status}
    />
  );
};
