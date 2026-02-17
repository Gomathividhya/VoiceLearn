
import React, { useEffect, useState } from 'react';

interface WaveformProps {
  isPlaying: boolean;
  color?: string;
}

const Waveform: React.FC<WaveformProps> = ({ isPlaying, color = 'bg-primary' }) => {
  const [bars, setBars] = useState<number[]>(new Array(20).fill(4));

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setBars(prev => prev.map(() => Math.floor(Math.random() * 24) + 4));
      }, 100);
    } else {
      setBars(new Array(20).fill(4));
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="flex items-end justify-center gap-1 h-12">
      {bars.map((height, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full transition-all duration-100 ${color}`}
          style={{ height: `${height}px` }}
        ></div>
      ))}
    </div>
  );
};

export default Waveform;
