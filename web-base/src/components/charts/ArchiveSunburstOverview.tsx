import React from 'react';

interface SunburstNode {
  name: string;
  value?: number;
  children?: SunburstNode[];
}

const ArchiveSunburstOverview: React.FC<{
  data: SunburstNode[];
  onSelect?: (path: string[]) => void;
}> = ({ data, onSelect }) => {
  const colors = [
    'rgba(59, 130, 246, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(236, 72, 153, 0.8)',
    'rgba(14, 165, 233, 0.8)',
    'rgba(34, 197, 94, 0.8)',
    'rgba(249, 115, 22, 0.8)',
  ];

  const renderNode = (node: SunburstNode, depth: number = 0, colorIdx: number = 0): React.ReactNode => {
    const color = colors[colorIdx % colors.length];
    
    return (
      <div key={node.name} className="flex flex-col">
        <div
          className="px-2 py-1 rounded text-xs font-mono cursor-pointer hover:opacity-80 transition-opacity"
          style={{
            backgroundColor: color,
            marginLeft: depth * 12,
          }}
          onClick={() => onSelect?.([node.name])}
        >
          {node.name} {node.value !== undefined && `(${node.value})`}
        </div>
        {node.children && (
          <div className="flex flex-col gap-1 mt-1">
            {node.children.map((child, i) => renderNode(child, depth + 1, colorIdx + i + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full p-2 overflow-auto" style={{ height: 320 }}>
      <div className="flex flex-col gap-2">
        {data.map((node, idx) => renderNode(node, 0, idx))}
      </div>
    </div>
  );
};

export default ArchiveSunburstOverview;
