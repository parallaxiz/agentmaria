import { BaseNode } from './BaseNode';
import { FileText } from 'lucide-react';

export const TechnicalWriterNode = ({ id, data, selected }: any) => {
  return (
    <BaseNode 
      id={id}
      icon={FileText} 
      title="Writer" 
      selected={selected}
      status={data.status}
    />
  );
};
