
import React, { useState, useRef, useEffect } from 'react';
import { store } from '../services/store';
import { Stage, User, KnowledgeFile, FunnelStep, ChatSession, SessionDetails } from '../types';
import { 
  LayoutDashboard, 
  GitMerge, 
  FileText, 
  Users, 
  LogOut, 
  Plus, 
  Edit2, 
  Trash2, 
  UploadCloud, 
  MoreHorizontal, 
  PlayCircle, 
  X, 
  Settings, 
  Save, 
  File, 
  Loader2,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Server,
  MessageSquare,
  Filter,
  ChevronDown,
  Check,
  Download,
  Share2,
  Flag,
  UserCircle
} from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
}

type Tab = 'OVERVIEW' | 'FUNNEL' | 'KNOWLEDGE' | 'USERS' | 'SETTINGS';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('OVERVIEW');
  
  // Data State
  const [stages, setStages] = useState(store.getStages());
  const [users, setUsers] = useState(store.getUsers());
  const [files, setFiles] = useState(store.getFiles());
  const [globalSettings, setGlobalSettings] = useState(store.getGlobalSettings());

  // UI States
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Date Filter State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState({ 
    label: 'Today', 
    start: new Date().toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  });

  // Modal States
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<Partial<Stage> | null>(null);
  const [stageToDelete, setStageToDelete] = useState<Stage | null>(null);

  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [newFile, setNewFile] = useState<{filename: string, scope: string}>({ filename: '', scope: 'GLOBAL' });
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stage Detail Modal State
  const [selectedFunnelStage, setSelectedFunnelStage] = useState<FunnelStep | null>(null);
  const [stageSessions, setStageSessions] = useState<ChatSession[]>([]);
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  
  // Transcript Modal State
  const [selectedTranscriptUser, setSelectedTranscriptUser] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);

  // Analytics Data (In a real app, these would be fetched based on dateRange)
  const kpis = store.getKPIs();
  const funnelMetrics = store.getFunnelMetrics();
  const bottlenecks = store.getBottlenecks();
  const voiceMetrics = store.getVoiceQualityMetrics();

  // --- Date Picker Logic ---
  const handleDateSelect = (preset: 'Today' | 'Yesterday' | 'Last 7 Days' | 'Last 30 Days' | 'Custom') => {
    const end = new Date();
    const start = new Date();

    if (preset === 'Today') {
      // Start and end are today
    } else if (preset === 'Yesterday') {
      start.setDate(end.getDate() - 1);
      end.setDate(end.getDate() - 1);
    } else if (preset === 'Last 7 Days') {
      start.setDate(end.getDate() - 7);
    } else if (preset === 'Last 30 Days') {
      start.setDate(end.getDate() - 30);
    }

    if (preset !== 'Custom') {
      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];
      setDateRange({ label: preset, start: startStr, end: endStr });
      setShowDatePicker(false);
    } else {
      setDateRange({ ...dateRange, label: 'Custom' });
    }
  };

  const handleCustomDateChange = (type: 'start' | 'end', value: string) => {
    setDateRange(prev => ({ ...prev, [type]: value, label: 'Custom' }));
  };

  // --- Stage Management ---
  const handleOpenStageModal = (stage?: Stage) => {
    if (stage) {
      setEditingStage(stage);
    } else {
      setEditingStage({
        order_index: stages.length + 1,
        title: '',
        system_instruction: '',
        validation_criteria: '',
        cta_label: 'Next Step',
        cta_url: '#'
      });
    }
    setIsStageModalOpen(true);
  };

  const handleSaveStage = () => {
    if (!editingStage || !editingStage.title) return;
    
    if (editingStage.id) {
      store.updateStage(editingStage as Stage);
    } else {
      store.createStage(editingStage as Omit<Stage, 'id'>);
    }
    setStages([...store.getStages()]);
    setIsStageModalOpen(false);
    setEditingStage(null);
  };

  const initiateDeleteStage = (stage: Stage) => {
    setStageToDelete(stage);
  };

  const confirmDeleteStage = () => {
    if (stageToDelete) {
      store.deleteStage(stageToDelete.id);
      setStages([...store.getStages()]);
      setStageToDelete(null);
    }
  };

  // --- Funnel Interaction ---
  const handleFunnelClick = (step: FunnelStep) => {
    // Initialize modal with the global date range or defaults
    setFilterStartDate(dateRange.start);
    setFilterEndDate(dateRange.end);
    setSelectedFunnelStage(step);
    setStageSessions(store.getStageSessions(step.stageId, dateRange.start, dateRange.end));
  };

  const handleModalDateFilterChange = (start: string, end: string) => {
    setFilterStartDate(start);
    setFilterEndDate(end);
    if (selectedFunnelStage) {
       setStageSessions(store.getStageSessions(selectedFunnelStage.stageId, start, end));
    }
  };

  // --- File Management ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewFile({ ...newFile, filename: file.name });
      setSelectedFileObj(file);
    }
  };

  const handleAddFile = () => {
    if (!newFile.filename || !selectedFileObj) return;
    
    setIsUploading(true);
    
    setTimeout(() => {
        const scopeValue = newFile.scope === 'GLOBAL' ? 'GLOBAL' : parseInt(newFile.scope);
        const sizeMB = (selectedFileObj.size / (1024 * 1024)).toFixed(1);
        const sizeStr = sizeMB === "0.0" ? "< 0.1 MB" : `${sizeMB} MB`;

        store.addFile({
          filename: newFile.filename,
          scope: scopeValue,
          size: sizeStr
        });
        
        setFiles([...store.getFiles()]);
        setIsFileModalOpen(false);
        setNewFile({ filename: '', scope: 'GLOBAL' });
        setSelectedFileObj(null);
        setIsUploading(false);
    }, 1500);
  };

  const handleDeleteFile = (id: string) => {
    store.deleteFile(id);
    setFiles([...store.getFiles()]);
  };

  // --- User Management ---
  const handleViewTranscript = (userId: string) => {
    const details = store.getSessionDetails(userId);
    setSessionDetails(details);
    setSelectedTranscriptUser(userId);
  };

  // --- Settings ---
  const handleSaveSettings = () => {
    setIsSavingSettings(true);
    store.updateGlobalSettings(globalSettings);
    setTimeout(() => {
      setIsSavingSettings(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex bg-brand-bg text-slate-800 font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col fixed h-full z-10">
        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-purple rounded-lg flex items-center justify-center text-white">
              <LayoutDashboard size={18} />
            </div>
            Portal Admin
          </h2>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Overview" active={activeTab === 'OVERVIEW'} onClick={() => setActiveTab('OVERVIEW')} />
          <SidebarItem icon={<Settings size={20} />} label="Global Settings" active={activeTab === 'SETTINGS'} onClick={() => setActiveTab('SETTINGS')} />
          <SidebarItem icon={<GitMerge size={20} />} label="Stages & Funnel" active={activeTab === 'FUNNEL'} onClick={() => setActiveTab('FUNNEL')} />
          <SidebarItem icon={<FileText size={20} />} label="Knowledge Base" active={activeTab === 'KNOWLEDGE'} onClick={() => setActiveTab('KNOWLEDGE')} />
          <SidebarItem icon={<Users size={20} />} label="Recent Users" active={activeTab === 'USERS'} onClick={() => setActiveTab('USERS')} />
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl w-full transition-colors text-sm font-medium">
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 md:p-10 overflow-y-auto">
        
        {/* App Header */}
        <header className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-1">
              {activeTab === 'OVERVIEW' && 'Onboarding Status'}
              {activeTab === 'FUNNEL' && 'Stages & Funnel Configuration'}
              {activeTab === 'KNOWLEDGE' && 'Knowledge Base'}
              {activeTab === 'USERS' && 'Recent Users'}
              {activeTab === 'SETTINGS' && 'Global Configuration'}
            </h1>
            <p className="text-slate-500 text-sm">Monitor the voice-first onboarding & payment agent.</p>
          </div>
          <div className="flex items-center gap-4">
             {/* Functional Date Picker */}
             <div className="relative">
               <button 
                 onClick={() => setShowDatePicker(!showDatePicker)}
                 className={`flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm font-medium text-slate-600 cursor-pointer hover:border-brand-purple transition-all shadow-sm ${showDatePicker ? 'border-brand-purple ring-2 ring-brand-purple/10' : 'border-gray-200'}`}
               >
                 <Calendar size={16} />
                 <span>{dateRange.label}</span>
                 <ChevronDown size={14} className={`transition-transform duration-200 ${showDatePicker ? 'rotate-180' : ''}`} />
               </button>

               {showDatePicker && (
                 <div className="absolute right-0 top-12 bg-white rounded-xl shadow-xl border border-gray-100 p-4 w-80 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                   <div className="grid grid-cols-2 gap-2 mb-4">
                     {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days'].map((preset) => (
                       <button 
                         key={preset}
                         onClick={() => handleDateSelect(preset as any)}
                         className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${dateRange.label === preset ? 'bg-brand-purple text-white' : 'bg-gray-50 text-slate-600 hover:bg-gray-100'}`}
                       >
                         {preset}
                       </button>
                     ))}
                   </div>
                   <div className="space-y-3 pt-3 border-t border-gray-100">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-slate-400 uppercase">From</span>
                        <input 
                          type="date" 
                          value={dateRange.start}
                          onChange={(e) => handleCustomDateChange('start', e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-purple transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-slate-400 uppercase">To</span>
                        <input 
                          type="date" 
                          value={dateRange.end}
                          onChange={(e) => handleCustomDateChange('end', e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-purple transition-colors"
                        />
                      </div>
                      <button 
                        onClick={() => setShowDatePicker(false)}
                        className="w-full mt-2 bg-brand-purple hover:bg-brand-purpleHover text-white py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Apply Custom Range
                      </button>
                   </div>
                 </div>
               )}
             </div>
             
             {/* Environment Badge */}
             <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">
               PROD
             </div>
             
             {/* User Avatar */}
             <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
               <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" />
             </div>
          </div>
        </header>

        {/* OVERVIEW TAB */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-8">
             
             {/* Section A: KPIs */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {kpis.map((kpi, idx) => (
                 <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-2 relative z-10">
                      <p className="text-sm text-slate-500 font-medium">{kpi.label}</p>
                      {idx === 0 && <Activity size={18} className="text-brand-purple" />}
                      {idx === 1 && <CheckCircle2 size={18} className="text-emerald-500" />}
                      {idx === 2 && <Clock size={18} className="text-blue-500" />}
                      {idx === 3 && <AlertTriangle size={18} className="text-orange-500" />}
                    </div>
                    <div className="flex items-end gap-3 relative z-10">
                      <h3 className="text-3xl font-bold text-slate-800">{kpi.value}</h3>
                      <span className={`text-xs font-bold px-2 py-1 rounded-md mb-1 ${kpi.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {kpi.trend}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 relative z-10">{kpi.subtext}</p>
                 </div>
               ))}
             </div>

             {/* Section B: Stage-Based Funnel */}
             <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <GitMerge size={20} className="text-slate-400"/>
                    Stage Conversion Funnel
                  </h3>
                  <button className="text-sm text-brand-purple font-medium hover:underline" onClick={() => setActiveTab('FUNNEL')}>
                    View Configuration
                  </button>
                </div>

                {/* Horizontal Funnel Viz (Screenshot Style) */}
                <div className="relative flex items-stretch justify-between gap-4 overflow-x-auto pb-4 mb-8 scrollbar-hide">
                   {funnelMetrics.slice(0, 4).map((step, i) => ( // Showing top 4 for space like screenshot
                     <div key={step.stageId} onClick={() => handleFunnelClick(step)} className="flex-1 min-w-[200px] group cursor-pointer">
                       <div className={`
                          relative bg-white border rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-300 hover:scale-105 hover:shadow-lg h-full justify-between
                          ${step.status === 'healthy' ? 'border-emerald-100 shadow-emerald-50/50' : step.status === 'warning' ? 'border-amber-100 shadow-amber-50/50' : 'border-red-100 shadow-red-50/50'}
                       `}>
                          <div className={`
                            mb-4 text-xs font-bold px-3 py-1.5 rounded-full
                            ${step.status === 'healthy' ? 'bg-emerald-50 text-emerald-600' : step.status === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}
                          `}>
                            {step.dropOffRate}% Drop
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-base mb-2">{step.stageName}</h4>
                            <div className="text-3xl font-bold text-slate-700">{step.usersEntered}</div>
                            <div className="text-xs text-slate-400 mt-1">users entered</div>
                          </div>
                       </div>
                     </div>
                   ))}
                </div>

                {/* Bottlenecks Table */}
                <div className="mt-6">
                   <h4 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-wide">Today's Bottlenecks</h4>
                   <div className="overflow-hidden rounded-xl border border-gray-100">
                     <table className="w-full text-left text-sm">
                       <thead className="bg-gray-50/50 text-slate-500">
                         <tr>
                           <th className="px-6 py-3 font-medium">Stage</th>
                           <th className="px-6 py-3 font-medium">Drop Rate</th>
                           <th className="px-6 py-3 font-medium">Impact</th>
                           <th className="px-6 py-3 font-medium">Top Reason / Error</th>
                           <th className="px-6 py-3 font-medium text-right">Action</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                         {bottlenecks.length > 0 ? bottlenecks.map(b => (
                           <tr key={b.id} className="hover:bg-gray-50/50">
                             <td className="px-6 py-4 font-medium text-slate-800">{b.stageName}</td>
                             <td className="px-6 py-4 text-red-500 font-medium">{b.dropRate}%</td>
                             <td className="px-6 py-4 text-slate-500">{b.affectedUsers} users</td>
                             <td className="px-6 py-4 text-slate-600 truncate max-w-xs">{b.reason}</td>
                             <td className="px-6 py-4 text-right text-brand-purple font-medium cursor-pointer hover:underline">
                               Analyze
                             </td>
                           </tr>
                         )) : (
                           <tr>
                             <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No major bottlenecks detected.</td>
                           </tr>
                         )}
                       </tbody>
                     </table>
                   </div>
                </div>
             </div>

             {/* Section C: Voice Quality & System Health */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Voice Metrics */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Session Quality</h3>
                    <div className="text-xs text-slate-400">Avg last hour</div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="text-slate-400 text-xs font-medium mb-1">Avg Latency</div>
                      <div className="text-xl font-bold text-slate-800">{voiceMetrics.avgLatencyMs}ms</div>
                      <div className="w-full bg-slate-200 h-1 mt-2 rounded-full overflow-hidden">
                        <div className="bg-brand-purple h-full" style={{ width: '40%' }} />
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <div className="text-slate-400 text-xs font-medium mb-1">Interruptions</div>
                       <div className="text-xl font-bold text-slate-800">{voiceMetrics.interruptionRate}%</div>
                       <div className="w-full bg-slate-200 h-1 mt-2 rounded-full overflow-hidden">
                         <div className="bg-orange-400 h-full" style={{ width: '25%' }} />
                       </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <div className="text-slate-400 text-xs font-medium mb-1">Sentiment</div>
                       <div className="text-xl font-bold text-slate-800">{voiceMetrics.sentimentScore}/100</div>
                       <div className="w-full bg-slate-200 h-1 mt-2 rounded-full overflow-hidden">
                         <div className="bg-emerald-500 h-full" style={{ width: '78%' }} />
                       </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <div className="text-slate-400 text-xs font-medium mb-1">Silence</div>
                       <div className="text-xl font-bold text-slate-800">{voiceMetrics.avgSilenceDuration}s</div>
                       <div className="w-full bg-slate-200 h-1 mt-2 rounded-full overflow-hidden">
                         <div className="bg-blue-400 h-full" style={{ width: '20%' }} />
                       </div>
                    </div>
                  </div>
                </div>

                {/* Infrastructure */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                   <h3 className="text-lg font-bold text-slate-800 mb-6">Infra Health</h3>
                   <div className="space-y-4">
                     <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                       <div className="flex items-center gap-3">
                         <Server size={18} className="text-emerald-600" />
                         <span className="text-sm font-medium text-emerald-900">Gemini Live API</span>
                       </div>
                       <span className="text-xs font-bold text-emerald-600 bg-white px-2 py-1 rounded-md">99.9%</span>
                     </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'SETTINGS' && (
          <div className="max-w-4xl">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-800">Global Agent Persona</h3>
                <p className="text-sm text-slate-500 mt-1">
                  This instruction defines the core behavior of the onboarding agent.
                </p>
              </div>
              
              <textarea 
                value={globalSettings.baseSystemInstruction}
                onChange={(e) => setGlobalSettings({...globalSettings, baseSystemInstruction: e.target.value})}
                className="w-full h-64 bg-gray-50 border border-gray-200 rounded-xl p-4 text-slate-800 focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple/50 transition-all font-mono text-sm"
              />

              <div className="flex justify-end mt-6">
                <button 
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                  className={`
                    text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-brand-purple/20 flex items-center gap-2 transition-all
                    ${isSavingSettings ? 'bg-emerald-500' : 'bg-brand-purple hover:bg-brand-purpleHover'}
                  `}
                >
                  {isSavingSettings ? <Check size={18} /> : <Save size={18} />}
                  {isSavingSettings ? 'Saved!' : 'Save Configuration'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FUNNEL CONFIG TAB */}
        {activeTab === 'FUNNEL' && (
          <div>
            <div className="flex justify-end mb-6">
              <button 
                onClick={() => handleOpenStageModal()}
                className="bg-brand-purple hover:bg-brand-purpleHover text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-brand-purple/20 flex items-center gap-2 text-sm transition-all"
              >
                <Plus size={18} /> Add Stage
              </button>
            </div>
            <div className="grid gap-4">
              {stages.map((stage) => (
                <div key={stage.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex justify-between items-start group relative">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-brand-purple/10 text-brand-purple text-xs font-bold px-2 py-1 rounded-md">
                        Stage {stage.order_index}
                      </span>
                      <h3 className="font-semibold text-lg text-slate-800">{stage.title}</h3>
                    </div>
                    <p className="text-slate-500 text-sm line-clamp-2 mb-2">
                      <span className="font-medium text-slate-600">Script:</span> {stage.system_instruction}
                    </p>
                    <p className="text-slate-500 text-sm line-clamp-2 mb-4">
                      <span className="font-medium text-slate-600">Validation:</span> {stage.validation_criteria}
                    </p>
                  </div>
                  <div className="flex gap-2 items-start">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenStageModal(stage); }}
                      className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-slate-400 hover:text-brand-purple transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); initiateDeleteStage(stage); }}
                      className="p-2 bg-gray-50 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KNOWLEDGE TAB */}
        {activeTab === 'KNOWLEDGE' && (
          <div>
             <div 
                onClick={() => setIsFileModalOpen(true)}
                className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-8 flex flex-col items-center justify-center text-slate-400 mb-8 hover:border-brand-purple/50 hover:bg-brand-purple/5 transition-colors cursor-pointer"
             >
                <div className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center mb-4 text-brand-purple">
                  <UploadCloud size={24} />
                </div>
                <p className="font-medium text-slate-600">Upload Knowledge Base File</p>
             </div>
             {/* File Table (Existing) */}
             <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/50 border-b border-gray-100 text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-medium">Document Name</th>
                      <th className="px-6 py-4 font-medium">Stage Scope</th>
                      <th className="px-6 py-4 font-medium">Size</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {files.map(file => (
                      <tr key={file.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                             <FileText size={16} />
                          </div>
                          {file.filename}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${file.scope === 'GLOBAL' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                             {file.scope === 'GLOBAL' ? 'Global' : `Stage ${file.scope}`}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{file.size}</td>
                        <td className="px-6 py-4 text-slate-500">{file.uploadDate}</td>
                        <td className="px-6 py-4 text-right">
                           <button onClick={() => handleDeleteFile(file.id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        )}

        {/* RECENT USERS TAB (Updated Structure) */}
        {activeTab === 'USERS' && (
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 border-b border-gray-100 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium w-1/3">User</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Current Stage</th>
                  <th className="px-6 py-4 font-medium text-right">Transcripts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-brand-purple font-bold">
                             {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{user.name}</p>
                            <p className="text-xs text-slate-400">{user.phoneNumber}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize
                        ${user.status === 'active' ? 'bg-green-50 text-green-600' : 
                          user.status === 'idle' ? 'bg-orange-50 text-orange-600' : 'bg-gray-100 text-gray-500'}
                      `}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-brand-purple/5 text-brand-purple px-2 py-1 rounded-md font-medium text-xs border border-brand-purple/10">
                        Stage {user.currentStageId}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button 
                         onClick={() => handleViewTranscript(user.id)}
                         className="inline-flex items-center gap-2 text-sm text-brand-purple font-medium hover:bg-brand-purple/5 px-3 py-1.5 rounded-lg transition-colors"
                       >
                          <MessageSquare size={16} />
                          View Conversation
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </main>

      {/* --- MODALS --- */}
      
      {/* Transcript Detail Modal */}
      {selectedTranscriptUser && sessionDetails && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-sm transition-opacity">
           <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              
              {/* Header */}
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                 <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-brand-purple font-bold text-lg">
                          {sessionDetails.userName.charAt(0)}
                       </div>
                       <div>
                          <h2 className="text-lg font-bold text-slate-800">{sessionDetails.userName}</h2>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                             <UserCircle size={14} />
                             <span>{sessionDetails.userId}</span>
                          </div>
                       </div>
                    </div>
                    <button onClick={() => setSelectedTranscriptUser(null)} className="p-2 hover:bg-gray-200 rounded-full text-slate-400 transition-colors">
                       <X size={20} />
                    </button>
                 </div>
                 
                 {/* Metadata Grid */}
                 <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                       <div className="text-xs text-slate-400 mb-1">Session ID</div>
                       <div className="font-mono text-xs text-slate-600 truncate">{sessionDetails.sessionId}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                       <div className="text-xs text-slate-400 mb-1">Agent Version</div>
                       <div className="font-medium text-slate-700 flex items-center gap-1">
                          <Server size={12} className="text-brand-purple" />
                          {sessionDetails.agentVersion}
                       </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                       <div className="text-xs text-slate-400 mb-1">Context</div>
                       <div className="font-medium text-slate-700">{sessionDetails.stageAtTime}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                       <div className="text-xs text-slate-400 mb-1">Time & Duration</div>
                       <div className="font-medium text-slate-700">{sessionDetails.date} • {sessionDetails.duration}</div>
                    </div>
                 </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
                 {sessionDetails.messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'AGENT' ? 'justify-start' : 'justify-end'}`}>
                       <div className={`max-w-[85%] ${msg.role === 'AGENT' ? 'order-2' : 'order-1'}`}>
                          {/* Label */}
                          <div className={`text-xs mb-1 ${msg.role === 'AGENT' ? 'text-blue-600 ml-1' : 'text-slate-400 text-right mr-1'}`}>
                             {msg.role === 'AGENT' ? 'AI Agent' : 'User'} • {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                          </div>
                          {/* Bubble */}
                          <div className={`
                             p-4 rounded-2xl text-sm leading-relaxed shadow-sm
                             ${msg.role === 'AGENT' 
                               ? 'bg-blue-50 text-blue-900 rounded-tl-none' 
                               : 'bg-gray-100 text-slate-700 rounded-tr-none'}
                          `}>
                             {msg.text}
                          </div>
                       </div>
                    </div>
                 ))}
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                 <div className="flex gap-2">
                    <button className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-slate-600 text-xs font-medium hover:bg-gray-50 hover:border-brand-purple flex items-center gap-2 transition-colors">
                       <TagIcon /> Tag Issue
                    </button>
                    <button className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-slate-600 text-xs font-medium hover:bg-gray-50 hover:border-brand-purple flex items-center gap-2 transition-colors">
                       <Share2 size={14} /> Share
                    </button>
                 </div>
                 <button className="px-4 py-2 bg-brand-purple hover:bg-brand-purpleHover text-white rounded-lg text-xs font-medium shadow-lg shadow-brand-purple/20 flex items-center gap-2 transition-colors">
                    <Download size={14} /> Export PDF
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Stage Detail Modal (Drill Down) */}
      {selectedFunnelStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col animate-float">
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                 <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold text-slate-800">{selectedFunnelStage.stageName}</h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${selectedFunnelStage.status === 'healthy' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                         {selectedFunnelStage.dropOffRate}% Drop
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm">Detailed analysis of sessions at this stage.</p>
                 </div>
                 <button onClick={() => setSelectedFunnelStage(null)} className="p-2 hover:bg-gray-200 rounded-full text-slate-400">
                    <X size={20} />
                 </button>
              </div>

              {/* Filters */}
              <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-white">
                 <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Filter size={16} />
                    <span className="font-medium">Filter Dates:</span>
                 </div>
                 <input 
                   type="date" 
                   value={filterStartDate}
                   onChange={(e) => handleModalDateFilterChange(e.target.value, filterEndDate)}
                   className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-brand-purple/20 outline-none"
                 />
                 <span className="text-slate-400">-</span>
                 <input 
                   type="date" 
                   value={filterEndDate}
                   onChange={(e) => handleModalDateFilterChange(filterStartDate, e.target.value)}
                   className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-brand-purple/20 outline-none"
                 />
              </div>

              {/* Session Table */}
              <div className="overflow-y-auto flex-1 p-0">
                 <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100 text-slate-500 sticky top-0">
                       <tr>
                          <th className="px-6 py-3 font-medium">User</th>
                          <th className="px-6 py-3 font-medium">Date</th>
                          <th className="px-6 py-3 font-medium">Duration</th>
                          <th className="px-6 py-3 font-medium">Status</th>
                          <th className="px-6 py-3 font-medium">Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {stageSessions.map(session => (
                          <tr key={session.id} className="hover:bg-gray-50/50 group">
                             <td className="px-6 py-4">
                                <div className="font-medium text-slate-800">{session.userName}</div>
                                <div className="text-xs text-slate-400">ID: {session.userId}</div>
                             </td>
                             <td className="px-6 py-4 text-slate-600">
                                <div>{session.date}</div>
                                <div className="text-xs text-slate-400">{session.time}</div>
                             </td>
                             <td className="px-6 py-4 text-slate-600">{session.duration}</td>
                             <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                   session.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                                   session.status === 'Dropped' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'
                                }`}>
                                   {session.status}
                                </span>
                             </td>
                             <td className="px-6 py-4">
                                <button className="text-brand-purple hover:underline text-xs font-medium flex items-center gap-1">
                                   <MessageSquare size={14} /> View Transcript
                                </button>
                             </td>
                          </tr>
                       ))}
                       {stageSessions.length === 0 && (
                          <tr>
                             <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                No sessions found for this date range.
                             </td>
                          </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {stageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-float">
             <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
                <Trash2 size={24} />
             </div>
             <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Stage?</h3>
             <p className="text-slate-500 mb-6 leading-relaxed">
               Are you sure you want to delete <strong>"{stageToDelete.title}"</strong>? 
               This action cannot be undone.
             </p>
             <div className="flex gap-3">
                <button onClick={() => setStageToDelete(null)} className="flex-1 px-6 py-3 text-slate-500 hover:bg-gray-100 rounded-xl font-medium transition-colors">Cancel</button>
                <button onClick={confirmDeleteStage} className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium shadow-lg shadow-red-500/20 transition-colors">Delete</button>
             </div>
          </div>
        </div>
      )}

      {/* Stage Edit Modal */}
      {isStageModalOpen && editingStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-800">
                {editingStage.id ? 'Edit Stage' : 'Create New Stage'}
              </h3>
              <button onClick={() => setIsStageModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Stage Title</label>
                  <input type="text" value={editingStage.title} onChange={e => setEditingStage({...editingStage, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-slate-800 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Stage Instruction</label>
                <textarea value={editingStage.system_instruction} onChange={e => setEditingStage({...editingStage, system_instruction: e.target.value})} className="w-full h-32 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-slate-800 outline-none font-mono text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">CTA Label</label>
                      <input type="text" value={editingStage.cta_label} onChange={e => setEditingStage({...editingStage, cta_label: e.target.value})} placeholder="e.g., View Syllabus" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-slate-800 outline-none" />
                  </div>
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">CTA URL</label>
                      <input type="text" value={editingStage.cta_url} onChange={e => setEditingStage({...editingStage, cta_url: e.target.value})} placeholder="e.g., https://..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-slate-800 outline-none" />
                  </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setIsStageModalOpen(false)} className="px-6 py-2.5 text-slate-500 hover:bg-gray-100 rounded-xl font-medium">Cancel</button>
              <button onClick={handleSaveStage} className="px-6 py-2.5 bg-brand-purple hover:bg-brand-purpleHover text-white rounded-xl font-medium shadow-lg shadow-brand-purple/20">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* File Modal */}
      {isFileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">Upload Document</h3>
                <button onClick={() => setIsFileModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-slate-400"><X size={20} /></button>
             </div>
             <div className="p-8 space-y-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Select File</label>
                  <div className="flex gap-3 items-center">
                    <button onClick={() => fileInputRef.current?.click()} className="bg-gray-100 hover:bg-gray-200 text-slate-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2"><File size={16} /> Choose PDF</button>
                    <span className="text-sm text-slate-600 truncate flex-1">{newFile.filename || "No file selected"}</span>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileSelect} />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 uppercase">Scope</label>
                   <select value={newFile.scope} onChange={e => setNewFile({...newFile, scope: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-slate-800 outline-none appearance-none">
                     <option value="GLOBAL">Global (All Stages)</option>
                     {stages.map(s => (<option key={s.id} value={s.id}>Stage {s.order_index}: {s.title}</option>))}
                   </select>
                </div>
             </div>
             <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => setIsFileModalOpen(false)} className="px-6 py-2.5 text-slate-500 hover:bg-gray-100 rounded-xl font-medium">Cancel</button>
                <button onClick={handleAddFile} disabled={!newFile.filename || isUploading} className="px-6 py-2.5 bg-brand-purple hover:bg-brand-purpleHover text-white rounded-xl font-medium shadow-lg shadow-brand-purple/20 disabled:opacity-50 flex items-center gap-2">{isUploading && <Loader2 size={18} className="animate-spin" />}{isUploading ? "Uploading..." : "Upload"}</button>
             </div>
           </div>
        </div>
      )}

    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
      ${active ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/30' : 'text-slate-500 hover:bg-gray-50 hover:text-slate-800'}
    `}
  >
    {icon}
    {label}
  </button>
);

const TagIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>
);

export default AdminDashboard;
