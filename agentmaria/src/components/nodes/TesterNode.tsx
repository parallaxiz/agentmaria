import { BaseNode } from './BaseNode';
import { CheckSquare } from 'lucide-react';

export const TesterNode = ({ id, data, selected }: any) => {
  return (
    <BaseNode 
      id={id}
      icon={CheckSquare} 
      title="Tester" 
      selected={selected}
      status={data.status}
    />
  );
};
