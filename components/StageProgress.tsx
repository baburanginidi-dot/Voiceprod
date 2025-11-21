import React from 'react';
import { Stage } from '../types';
import { Check } from 'lucide-react';

interface StageProgressProps {
  currentStageId: number;
  stages: Stage[];
}

const StageProgress: React.FC<StageProgressProps> = ({ currentStageId, stages }) => {
  return (
    <div className="w-full max-w-md flex items-center justify-between mb-8 px-4">
      {stages.map((stage, index) => {
        const isCompleted = stage.id < currentStageId;
        const isCurrent = stage.id === currentStageId;

        return (
          <div key={stage.id} className="flex flex-col items-center gap-2 group relative">
            {/* Connector Line */}
            {index !== 0 && (
              <div 
                className={`absolute right-[50%] top-3 w-[100px] sm:w-[120px] h-[2px] -z-10 
                ${stage.id <= currentStageId ? 'bg-brand-purple/30' : 'bg-gray-200'}`} 
                style={{ transform: 'translateX(-50%)' }}
              />
            )}

            <div 
              className={`
                w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500
                ${isCompleted ? 'bg-brand-purple text-white scale-100' : ''}
                ${isCurrent ? 'bg-white border-2 border-brand-purple shadow-[0_0_10px_rgba(108,62,255,0.3)] scale-125' : ''}
                ${!isCompleted && !isCurrent ? 'bg-gray-200' : ''}
              `}
            >
              {isCompleted && <Check size={12} strokeWidth={3} />}
              {isCurrent && <div className="w-2 h-2 bg-brand-purple rounded-full animate-pulse" />}
            </div>
            
            <span 
              className={`text-xs font-medium transition-colors duration-300 absolute top-8 w-32 text-center
                ${isCurrent ? 'text-brand-purple' : 'text-gray-400'}
              `}
            >
              {isCurrent ? stage.title.split(':')[0] : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default StageProgress;