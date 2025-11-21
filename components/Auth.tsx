
import React, { useState } from 'react';
import { AuthMode } from '../types';
import { User, Shield, ArrowRight, Sparkles, Lock } from 'lucide-react';

interface AuthProps {
  onLogin: (mode: AuthMode) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('STUDENT');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Fake network delay
    setTimeout(() => {
      setIsLoading(false);
      onLogin(mode);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
         <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-brand-purple/5 rounded-full blur-3xl animate-float" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Card */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/50 p-8 rounded-[2rem] shadow-2xl w-full max-w-md relative overflow-hidden">
        
        {/* Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100/50 p-1 rounded-full flex relative">
            <div 
              className={`absolute top-1 bottom-1 w-[50%] bg-white rounded-full shadow-sm transition-all duration-300 ${mode === 'ADMIN' ? 'left-[48%]' : 'left-1'}`}
            />
            <button 
              onClick={() => setMode('STUDENT')}
              className={`relative z-10 px-6 py-2 text-sm font-medium rounded-full transition-colors ${mode === 'STUDENT' ? 'text-slate-800' : 'text-slate-400'}`}
            >
              Student
            </button>
            <button 
              onClick={() => setMode('ADMIN')}
              className={`relative z-10 px-6 py-2 text-sm font-medium rounded-full transition-colors ${mode === 'ADMIN' ? 'text-slate-800' : 'text-slate-400'}`}
            >
              Admin
            </button>
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-purple/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-brand-purple">
            {mode === 'STUDENT' ? <Sparkles size={32} /> : <Shield size={32} />}
          </div>
          <h1 className="text-2xl font-semibold text-slate-800 mb-2">
            {mode === 'STUDENT' ? 'Welcome Back' : 'Admin Portal'}
          </h1>
          <p className="text-slate-500 text-sm">
            {mode === 'STUDENT' 
              ? 'Enter your phone number to continue your learning journey.' 
              : 'Secure access for curriculum management.'}
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">
              {mode === 'STUDENT' ? 'Phone Number' : 'Email Address'}
            </label>
            <input 
              type={mode === 'STUDENT' ? "tel" : "email"}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={mode === 'STUDENT' ? "+1 (555) 000-0000" : "admin@portal.com"}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple/50 transition-all"
            />
          </div>

          {mode === 'ADMIN' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">
                Password
              </label>
              <input 
                type="password"
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple/50 transition-all"
              />
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-purple hover:bg-brand-purpleHover text-white py-3.5 rounded-xl font-medium shadow-lg shadow-brand-purple/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {mode === 'STUDENT' ? 'Start Learning' : 'Login to Dashboard'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
             <Lock size={12} />
             <span>Secure 256-bit Encrypted Connection</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Auth;
