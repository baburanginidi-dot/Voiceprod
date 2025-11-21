import React from 'react';
import { AvatarState } from '../types';

interface LumiAvatarProps {
  state: AvatarState;
  volume: number; // 0 to 1
}

const LumiAvatar: React.FC<LumiAvatarProps> = ({ state, volume }) => {
  const isSpeaking = state === AvatarState.SPEAKING;
  const isListening = state === AvatarState.LISTENING;
  const isIdle = state === AvatarState.IDLE;
  
  // Determine colors based on state
  const getBaseColor = () => {
    switch(state) {
      case AvatarState.SPEAKING: return 'text-pink-500 shadow-pink-500/50';
      case AvatarState.LISTENING: return 'text-emerald-500 shadow-emerald-500/50';
      default: return 'text-cyan-500 shadow-cyan-500/50';
    }
  };

  const getCoreColor = () => {
    switch(state) {
      case AvatarState.SPEAKING: return 'bg-pink-500';
      case AvatarState.LISTENING: return 'bg-emerald-500';
      default: return 'bg-cyan-500';
    }
  };
  
  // Dynamic transforms for speech/volume
  // Exaggerate volume effect when speaking for a "toony" feel
  const coreScale = isSpeaking ? 1 + (volume * 0.5) : 1 + (volume * 0.2);
  
  // Squash and stretch the face container for speech emphasis
  const faceSquash = isSpeaking 
    ? `scale(${1 + volume * 0.15}, ${1 - volume * 0.1})` 
    : 'scale(1)';
    
  const glowOpacity = 0.4 + (volume * 0.6);

  // Mouth Dimensions
  const mouthWidth = isSpeaking ? 30 + (volume * 120) : 12;
  const mouthHeight = isSpeaking ? 10 + (volume * 60) : 4;

  return (
    <div className="relative w-64 h-64 flex items-center justify-center animate-float">
      
      {/* Left Ear Wrapper */}
      <div className="absolute top-0 left-10 transition-transform duration-500 origin-bottom-right"
           style={{ transform: `translateY(${isSpeaking ? volume * -15 : 0}px) rotate(-12deg)` }}>
        <div className={`w-16 h-20 bg-white/20 backdrop-blur-md rounded-full border border-white/40 
                        ${isListening ? 'animate-twitch' : ''}`} />
      </div>

      {/* Right Ear Wrapper */}
      <div className="absolute top-0 right-10 transition-transform duration-500 origin-bottom-left"
           style={{ transform: `translateY(${isSpeaking ? volume * -15 : 0}px) rotate(12deg)` }}>
        <div className={`w-16 h-20 bg-white/20 backdrop-blur-md rounded-full border border-white/40 
                        ${isListening ? 'animate-twitch' : ''}`}
             style={{ animationDelay: '0.15s' }} />
      </div>

      {/* The Sphere Container */}
      <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/30 shadow-2xl overflow-hidden z-10 flex items-center justify-center">
        
        {/* Specular Highlight */}
        <div className="absolute top-4 left-4 w-16 h-8 bg-white/40 rounded-full blur-md transform -rotate-45" />
        
        {/* The Core (Lava lamp blob) */}
        <div 
          className={`absolute w-24 h-24 rounded-full blur-xl transition-colors duration-300 ease-in-out 
                     ${getCoreColor()} ${isIdle ? 'animate-breathe' : ''}`}
          style={{ 
            opacity: glowOpacity,
            transform: isIdle ? undefined : `scale(${coreScale})` 
          }}
        />

        {/* Face Surface */}
        <div className="relative z-20 flex flex-col items-center justify-center gap-3 transition-transform duration-100 origin-center" 
             style={{ transform: faceSquash }}>
          <div className="flex gap-8">
             {/* Eyes */}
            <div className={`w-3 h-8 rounded-full transition-colors duration-500 ${state === AvatarState.SPEAKING ? 'bg-pink-600' : 'bg-slate-800'}`} />
            <div className={`w-3 h-8 rounded-full transition-colors duration-500 ${state === AvatarState.SPEAKING ? 'bg-pink-600' : 'bg-slate-800'}`} />
          </div>
          
          {/* Mouth */}
          <div 
            className={`rounded-full transition-all duration-100 ${state === AvatarState.SPEAKING ? 'bg-pink-700' : 'bg-slate-800'}`}
            style={{
              width: `${mouthWidth}px`,
              height: `${mouthHeight}px`,
            }}
          />
        </div>

        {/* Fresnel Rim Light (Inner Shadow inset) */}
        <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(255,255,255,0.3)] pointer-events-none" />
      </div>

      {/* Outer Glow Aura */}
      <div 
        className={`absolute inset-0 rounded-full blur-3xl -z-10 transition-colors duration-700 opacity-20 ${getCoreColor()}`}
      />
    </div>
  );
};

export default LumiAvatar;