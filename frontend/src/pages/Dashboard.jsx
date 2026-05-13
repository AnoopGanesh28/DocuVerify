import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, FileText, LayoutDashboard, User as UserIcon } from 'lucide-react';
import { getMe } from '../api';
import Upload from '../components/Upload';
import Chat from '../components/Chat';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getMe();
        setUser(res.data);
      } catch (err) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    };
    
    const localToken = localStorage.getItem('token');
    if (!localToken) {
      navigate('/login');
    } else {
      fetchUser();
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null; // Or a full screen loader

  return (
    <div className="min-h-screen bg-slate-900 flex text-slate-200">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col hidden md:flex shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-700">
          <FileText className="text-blue-500 mr-2" size={24} />
          <span className="text-white font-bold text-lg tracking-wide">DocuVerify</span>
        </div>
        
        <div className="p-4 flex-1">
          <div className="space-y-1">
            <button className="w-full flex items-center px-3 py-2.5 bg-blue-600/10 text-blue-400 rounded-lg font-medium transition-colors">
              <LayoutDashboard size={18} className="mr-3" />
              Workspace
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center mb-4 px-2">
            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center mr-3">
              <UserIcon size={16} className="text-slate-300" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user.username}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-3 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-colors text-sm font-medium"
          >
            <LogOut size={16} className="mr-2" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4">
          <div className="flex items-center">
            <FileText className="text-blue-500 mr-2" size={24} />
            <span className="text-white font-bold text-lg">DocuVerify</span>
          </div>
          <button onClick={handleLogout} className="text-slate-400 hover:text-white p-2">
            <LogOut size={20} />
          </button>
        </div>

        {/* Dashboard Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <header>
              <h1 className="text-2xl font-bold text-white mb-1">Welcome back, {user.username}</h1>
              <p className="text-slate-400">Upload your documents and query them instantly using local AI.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Upload */}
              <div className="lg:col-span-1 space-y-6">
                <Upload onUploadSuccess={() => {
                  // Could trigger a toast or a document list refresh here if implemented
                }} />
                
                {/* Info Card */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                  <h4 className="text-sm font-semibold tracking-wider text-slate-400 uppercase mb-3">How it works</h4>
                  <ul className="text-sm text-slate-300 space-y-3">
                    <li className="flex items-start">
                      <span className="bg-blue-500/20 text-blue-400 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5 shrink-0">1</span>
                      Upload PDF or TXT files
                    </li>
                    <li className="flex items-start">
                      <span className="bg-blue-500/20 text-blue-400 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5 shrink-0">2</span>
                      We securely embed them into ChromaDB
                    </li>
                    <li className="flex items-start">
                      <span className="bg-blue-500/20 text-blue-400 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5 shrink-0">3</span>
                      Ask questions in the chat
                    </li>
                    <li className="flex items-start">
                      <span className="bg-blue-500/20 text-blue-400 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5 shrink-0">4</span>
                      Local Ollama answers with citations
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right Column: Chat */}
              <div className="lg:col-span-2">
                <Chat />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
