import { BaseNode } from './BaseNode';
import { Palette } from 'lucide-react';

export const DesignerNode = ({ id, data, selected }: any) => {
  return (
    <BaseNode 
      id={id}
      icon={Palette} 
      title="Designer" 
      selected={selected}
      status={data.status}
    />
  );
};
