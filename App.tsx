
import React, { useState } from 'react';
import { ViewState, AuthMode } from './types';
import Auth from './components/Auth';
import StudentPortal from './components/StudentPortal';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [view, setView] = useState<ViewState>('AUTH');
  const [hasApiKey] = useState(!!process.env.API_KEY);

  const handleLogin = (mode: AuthMode) => {
    if (mode === 'STUDENT') {
      setView('STUDENT');
    } else {
      setView('ADMIN');
    }
  };

  const handleLogout = () => {
    setView('AUTH');
  };

  if (!hasApiKey) {
     return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
           <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center">
              <h1 className="text-xl font-bold text-red-500 mb-4">Missing API Key</h1>
              <p className="text-gray-600">
                 Please ensure the <code>API_KEY</code> environment variable is set in your build environment to use the Gemini Live API.
              </p>
           </div>
        </div>
     )
  }

  return (
    <>
      {view === 'AUTH' && <Auth onLogin={handleLogin} />}
      {view === 'STUDENT' && <StudentPortal onLogout={handleLogout} />}
      {view === 'ADMIN' && <AdminDashboard onLogout={handleLogout} />}
    </>
  );
}

export default App;
