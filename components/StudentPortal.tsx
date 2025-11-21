
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Square, CheckCircle2, LogOut, ExternalLink } from 'lucide-react';
import LumiAvatar from './LumiAvatar';
import StageProgress from './StageProgress';
import { ConnectionState, AvatarState } from '../types';
import { GeminiLiveService } from '../services/geminiLiveService';
import { store } from '../services/store';

interface StudentPortalProps {
  onLogout: () => void;
}

const StudentPortal: React.FC<StudentPortalProps> = ({ onLogout }) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [volume, setVolume] = useState(0);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  
  const stages = store.getStages();
  const currentStage = stages[currentStageIndex];
  const liveServiceRef = useRef<GeminiLiveService | null>(null);
  const isConnected = connectionState === ConnectionState.CONNECTED;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      liveServiceRef.current?.disconnect();
    };
  }, []);

  const handleStagePromotion = useCallback((increment: number) => {
    if (currentStageIndex < stages.length - 1) {
      liveServiceRef.current?.disconnect();
      setCurrentStageIndex(prev => prev + 1);
      setConnectionState(ConnectionState.DISCONNECTED);
      // In a real app, we would update the user's progress in the store/backend here
    }
  }, [currentStageIndex, stages.length]);

  const toggleConnection = async () => {
    if (isConnected || connectionState === ConnectionState.CONNECTING) {
      await liveServiceRef.current?.disconnect();
    } else {
      if (!liveServiceRef.current) {
        liveServiceRef.current = new GeminiLiveService(
          setConnectionState,
          setVolume,
          handleStagePromotion,
          setIsAiSpeaking
        );
      }
      const globalSettings = store.getGlobalSettings();
      // Retrieve files for RAG
      const knowledgeFiles = store.getFilesForStage(currentStage.id);
      
      await liveServiceRef.current.connect(currentStage, globalSettings.baseSystemInstruction, knowledgeFiles);
    }
  };

  let avatarState = AvatarState.IDLE;
  if (isConnected) {
    if (isAiSpeaking) {
      avatarState = AvatarState.SPEAKING;
    } else if (volume > 0.05) { 
      avatarState = AvatarState.LISTENING;
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      
      <button 
        onClick={onLogout}
        className="absolute top-6 right-6 flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition-colors z-20"
      >
        <LogOut size={16} />
        Exit
      </button>

      {/* Progress Header */}
      <div className="absolute top-10 w-full flex justify-center z-10 pointer-events-none">
        <StageProgress currentStageId={currentStage.id} stages={stages} />
      </div>

      {/* Main Floating Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] p-8 md:p-16 w-full max-w-2xl flex flex-col items-center transition-all duration-500 border border-white/50 relative z-10">
        
        {/* Status Indicator */}
        <div className="absolute top-8 right-8 flex items-center gap-2">
           {connectionState === ConnectionState.CONNECTING && (
             <div className="flex gap-1">
               <span className="w-1.5 h-1.5 bg-brand-purple rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
               <span className="w-1.5 h-1.5 bg-brand-purple rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
               <span className="w-1.5 h-1.5 bg-brand-purple rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
             </div>
           )}
           {isConnected && (
             <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium border border-green-100">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                LIVE
             </div>
           )}
        </div>

        {/* Header Content */}
        <div className="text-center mb-12 space-y-2">
          <div className="inline-flex items-center gap-2 text-brand-purple/80 bg-brand-purple/5 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
             <CheckCircle2 size={16} />
             <span>Secure Payment Assistant</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-800 tracking-tight">
            {currentStage.title}
          </h1>
          <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
             {isConnected 
               ? isAiSpeaking ? "Lumi is speaking..." : "Listening to you..."
               : "Press the microphone to begin your session."
             }
          </p>
        </div>

        {/* Avatar Container */}
        <div className="mb-12 transform transition-transform duration-700 hover:scale-105">
          <LumiAvatar state={avatarState} volume={volume} />
        </div>

        {/* Action Area */}
        <div className="w-full max-w-xs flex flex-col gap-4 items-center">
           
           {/* Dynamic Stage CTA */}
           {currentStage.cta_label && (
             <a 
               href={currentStage.cta_url}
               target="_blank"
               rel="noopener noreferrer"
               className="mb-4 px-6 py-2.5 bg-white border border-gray-200 hover:border-brand-purple text-brand-purple font-medium rounded-xl shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 text-sm"
             >
               {currentStage.cta_label}
               <ExternalLink size={14} />
             </a>
           )}

           <button
            onClick={toggleConnection}
            disabled={connectionState === ConnectionState.CONNECTING}
            className={`
              group relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300
              ${isConnected 
                ? 'bg-red-50 hover:bg-red-100 text-red-500' 
                : 'bg-brand-purple hover:bg-brand-purpleHover text-white shadow-lg hover:shadow-brand-purple/30 shadow-brand-purple/20'
              }
            `}
           >
             {isConnected && (
               <div className="absolute inset-0 rounded-full border border-red-200 animate-ping opacity-75"/>
             )}
             {isConnected ? <Square fill="currentColor" size={24} /> : <Mic size={32} strokeWidth={2} />}
           </button>

           <span className="text-sm text-slate-400 font-medium">
             {isConnected ? "End Session" : "Tap to Speak"}
           </span>

           {isConnected && (
             <button 
                onClick={() => handleStagePromotion(1)}
                className="mt-4 text-xs text-slate-300 hover:text-brand-purple underline decoration-dotted"
             >
               Simulate Payment Success
             </button>
           )}
        </div>

        {connectionState === ConnectionState.ERROR && (
          <div className="mt-6 px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            Connection failed. Please check your internet or API key.
          </div>
        )}

      </div>
    </div>
  );
};

export default StudentPortal;
