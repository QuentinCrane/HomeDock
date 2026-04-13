import React from 'react';

interface EchoData {
  date: string;
  text: number;
  image: number;
  audio: number;
}

const EchoRiverChart: React.FC<{
  data: EchoData[];
  currentDate?: string;
  onDateClick?: (date: string) => void;
}> = ({ data, currentDate, onDateClick }) => {
  const colors = {
    text: 'rgba(59, 130, 246, 0.8)',
    image: 'rgba(16, 185, 129, 0.8)',
    audio: 'rgba(139, 92, 246, 0.8)',
  };

  const maxValue = Math.max(
    ...data.map(d => d.text + d.image + d.audio),
    1
  );

  return (
    <div className="w-full overflow-auto" style={{ height: 200 }}>
      <div className="flex items-end gap-1 h-full min-w-full p-2">
        {data.slice(-14).map((item, idx) => {
          const total = item.text + item.image + item.audio;
          const height = Math.max((total / maxValue) * 100, 5);
          const isSelected = item.date === currentDate;

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col gap-0.5 cursor-pointer group"
              onClick={() => onDateClick?.(item.date)}
            >
              <div
                className="relative w-full rounded-t transition-all"
                style={{ height: `${height}%` }}
              >
                {/* Stacked bars */}
                <div
                  className="absolute bottom-0 w-full rounded-t"
                  style={{
                    height: `${(item.text / total) * 100}%`,
                    backgroundColor: colors.text,
                  }}
                />
                <div
                  className="absolute w-full rounded-t"
                  style={{
                    height: `${(item.image / total) * 100}%`,
                    backgroundColor: colors.image,
                    bottom: `${(item.text / total) * 100}%`,
                  }}
                />
                <div
                  className="absolute w-full rounded-t"
                  style={{
                    height: `${(item.audio / total) * 100}%`,
                    backgroundColor: colors.audio,
                    bottom: `${((item.text + item.image) / total) * 100}%`,
                  }}
                />
              </div>
              <div
                className={`text-[8px] font-mono text-center ${isSelected ? 'text-white' : 'text-gray-500'} group-hover:text-white transition-colors`}
              >
                {item.date.slice(5)}
              </div>
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex justify-center gap-4 mt-2">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded" style={{ backgroundColor: colors.text }} />
          <span className="text-[9px] font-mono text-gray-500">文字</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded" style={{ backgroundColor: colors.image }} />
          <span className="text-[9px] font-mono text-gray-500">图片</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded" style={{ backgroundColor: colors.audio }} />
          <span className="text-[9px] font-mono text-gray-500">音频</span>
        </div>
      </div>
    </div>
  );
};

export default EchoRiverChart;
