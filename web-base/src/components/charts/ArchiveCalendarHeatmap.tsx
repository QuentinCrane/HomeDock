import React from 'react';

type HeatmapMode = 'return' | 'create' | 'echo';

interface HeatmapData {
  date: string;
  value: number;
  type: HeatmapMode;
}

const ArchiveCalendarHeatmap: React.FC<{
  data: HeatmapData[];
  mode?: HeatmapMode;
  onDayClick?: (date: string) => void;
}> = ({ data, mode = 'return', onDayClick }) => {
  const modeColors = {
    return: 'rgba(59, 130, 246, 0.9)',
    create: 'rgba(16, 185, 129, 0.9)',
    echo: 'rgba(139, 92, 246, 0.9)',
  };

  const calendarData = data.filter(d => d.type === mode);

  return (
    <div 
      className="w-full flex flex-wrap gap-1 p-2"
      style={{ height: 200 }}
    >
      {calendarData.slice(0, 30).map((item, idx) => (
        <div
          key={idx}
          onClick={() => onDayClick?.(item.date)}
          className="w-4 h-4 rounded-sm cursor-pointer hover:opacity-80 transition-opacity"
          style={{
            backgroundColor: modeColors[mode],
            opacity: Math.min(0.3 + (item.value / 10) * 0.7, 1),
          }}
          title={`${item.date}: ${item.value} items`}
        />
      ))}
    </div>
  );
};

export default ArchiveCalendarHeatmap;
