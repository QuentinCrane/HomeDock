import React from 'react';

const BasePulseChart: React.FC<{
  isActive?: boolean;
  onPulse?: () => void;
}> = ({ isActive = true, onPulse }) => {
  const accentColor = '#4a7a9b';

  return (
    <div
      className="w-full h-full flex items-center justify-center cursor-pointer"
      onClick={onPulse}
    >
      <div
        className="relative w-32 h-32 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: `${accentColor}33`,
          border: `2px solid ${accentColor}33`,
        }}
      >
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: `2px solid ${accentColor}33`,
          }}
        />
        {/* Inner pulse */}
        <div
          className={`w-16 h-16 rounded-full ${isActive ? 'animate-pulse' : ''}`}
          style={{
            backgroundColor: `${accentColor}99`,
            boxShadow: isActive ? `0 0 20px ${accentColor}80` : 'none',
          }}
        />
        {/* Center dot */}
        <div
          className="absolute w-3 h-3 rounded-full"
          style={{
            backgroundColor: `${accentColor}E6`,
          }}
        />
      </div>
    </div>
  );
};

export default BasePulseChart;
