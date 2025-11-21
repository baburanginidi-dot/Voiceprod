
import { Stage, User, KnowledgeFile, KPI, GlobalSettings, FunnelStep, Bottleneck, VoiceQualityMetrics, ChatSession, SessionDetails, TranscriptMessage } from '../types';
import { STAGES as INITIAL_STAGES } from '../constants';

// Mock Store to simulate Backend DB
class Store {
  private stages: Stage[] = [...INITIAL_STAGES];
  
  private globalSettings: GlobalSettings = {
    baseSystemInstruction: "You are an efficient, secure, and friendly AI Onboarding Assistant for NxtWave. Your goal is to guide students through the payment and KYC process quickly while making them feel secure."
  };
  
  private users: User[] = [
    { id: '1', name: 'Alex Rivera', phoneNumber: '555-0123', currentStageId: 1, lastActive: '2 mins ago', joinedAt: '2023-10-24', status: 'active' },
    { id: '2', name: 'Sarah Chen', phoneNumber: '555-0199', currentStageId: 3, lastActive: '1 hour ago', joinedAt: '2023-10-20', status: 'idle' },
    { id: '3', name: 'Mike Johnson', phoneNumber: '555-0255', currentStageId: 4, lastActive: '1 day ago', joinedAt: '2023-10-15', status: 'offline' },
  ];

  private files: KnowledgeFile[] = [
    { id: 'f1', filename: 'NxtWave_Fee_Structure_2024.pdf', size: '2.4 MB', uploadDate: 'Oct 24, 2023', scope: 3, uri: 'gs://mock/fees' },
    { id: 'f2', filename: 'Loan_Agreement_Template.pdf', size: '1.1 MB', uploadDate: 'Oct 10, 2023', scope: 4, uri: 'gs://mock/loan' },
    { id: 'f3', filename: 'KYC_Guidelines.pdf', size: '0.8 MB', uploadDate: 'Oct 12, 2023', scope: 5, uri: 'gs://mock/kyc' },
  ];

  // SETTINGS
  getGlobalSettings() { return this.globalSettings; }
  updateGlobalSettings(settings: GlobalSettings) { this.globalSettings = settings; }

  // STAGES
  getStages() { return this.stages; }
  
  updateStage(updatedStage: Stage) {
    this.stages = this.stages.map(s => s.id === updatedStage.id ? updatedStage : s);
    this.stages.sort((a, b) => a.order_index - b.order_index);
  }

  createStage(stage: Omit<Stage, 'id'>) {
    const newId = this.stages.length > 0 ? Math.max(...this.stages.map(s => s.id)) + 1 : 1;
    const newStage = { ...stage, id: newId };
    this.stages.push(newStage);
    this.stages.sort((a, b) => a.order_index - b.order_index);
  }

  deleteStage(id: number) {
    this.stages = this.stages.filter(s => s.id !== id);
  }

  // USERS
  getUsers() { 
    // Sort users by last active (mock logic)
    return [...this.users].sort((a, b) => {
       const statusOrder = { 'active': 0, 'idle': 1, 'offline': 2 };
       return statusOrder[a.status] - statusOrder[b.status];
    }); 
  }
  
  updateUserStage(userId: string, stageId: number) {
    this.users = this.users.map(u => u.id === userId ? { ...u, currentStageId: stageId } : u);
  }

  // FILES
  getFiles() { return this.files; }

  // Get files relevant to a specific stage (Global + Stage Specific)
  getFilesForStage(stageId: number) {
    return this.files.filter(f => f.scope === 'GLOBAL' || f.scope === stageId);
  }

  addFile(file: Omit<KnowledgeFile, 'id' | 'uploadDate' | 'uri'>) {
    const newId = `f${Date.now()}`;
    const newFile: KnowledgeFile = {
      ...file,
      id: newId,
      uploadDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      uri: `gs://mock-bucket/${newId}/${file.filename}`
    };
    this.files.push(newFile);
  }

  deleteFile(id: string) {
    this.files = this.files.filter(f => f.id !== id);
  }

  // DASHBOARD ANALYTICS

  getKPIs(): KPI[] {
    // Matched to screenshot
    return [
      { label: 'Active Conversations', value: '1,284', subtext: 'Unique users today', trend: '+12%', trendUp: true },
      { label: 'Completion Rate', value: '68.4%', subtext: 'Reached "Complete"', trend: '+4.2%', trendUp: true },
      { label: 'Avg Duration', value: '04:12', subtext: 'Time to complete', trend: '-15s', trendUp: true },
      { label: 'Stage Drop Rate', value: '23.1%', subtext: 'Abandoned mid-flow', trend: '-2.5%', trendUp: true },
    ];
  }

  getFunnelMetrics(): FunnelStep[] {
    // Exact data from screenshot
    const dataMap: Record<string, {users: number, drop: number}> = {
      "Greeting & Identity": { users: 1284, drop: 5.4 },
      "Need & Program Fit": { users: 1156, drop: 9.7 },
      "Payment Options": { users: 1040, drop: 23.3 },
      "NBFC / Loan Offer": { users: 936, drop: 29.2 },
      "KYC Verification": { users: 662, drop: 15.5 },
      "Confirmation": { users: 559, drop: 8.2 },
      "Onboarding Complete": { users: 513, drop: 0 }
    };

    return this.stages.map((stage, index) => {
      const stats = dataMap[stage.title] || { users: 0, drop: 0 };
      const dropRate = stats.drop;
      const entered = stats.users;
      const exited = Math.round(entered * (1 - (dropRate / 100)));
      
      // Status logic from screenshot visual
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (dropRate > 20) status = 'critical';
      else if (dropRate > 10) status = 'warning';

      return {
        stageId: stage.id,
        stageName: stage.title,
        usersEntered: entered,
        usersExited: exited,
        dropOffRate: dropRate,
        avgTimeSpentSeconds: 30 + (index * 15),
        status: status
      };
    });
  }

  getBottlenecks(): Bottleneck[] {
    const potentialBottlenecks: Bottleneck[] = [
      { id: 'b1', stageName: 'NBFC / Loan Offer', dropRate: 35.2, affectedUsers: 300, reason: 'User silence > 10s during income verification' },
      { id: 'b2', stageName: 'Payment Options', dropRate: 22.7, affectedUsers: 250, reason: 'Negative sentiment when "Interest Rate" mentioned' },
    ];

    return potentialBottlenecks;
  }

  getVoiceQualityMetrics(): VoiceQualityMetrics {
    return {
      avgLatencyMs: 850,
      interruptionRate: 14.2,
      sentimentScore: 78,
      avgSilenceDuration: 2.4
    };
  }

  getStageSessions(stageId: number, startDate?: string, endDate?: string): ChatSession[] {
    // Mock sessions generator
    const count = 8;
    const sessions: ChatSession[] = [];
    const statuses: ('Completed' | 'Dropped' | 'Failed')[] = ['Dropped', 'Dropped', 'Completed', 'Failed', 'Dropped'];
    
    for (let i = 0; i < count; i++) {
      // Generate dates between Oct 20 and today (mock)
      const d = new Date();
      d.setDate(d.getDate() - Math.floor(Math.random() * 5));
      const dateStr = d.toISOString().split('T')[0];

      sessions.push({
        id: `s-${stageId}-${i}`,
        userId: `User-${1000+i}`,
        userName: `Student ${1000+i}`,
        date: dateStr,
        time: `${10 + i}:30 AM`,
        duration: `${Math.floor(Math.random() * 5)}m ${Math.floor(Math.random() * 59)}s`,
        status: statuses[i % statuses.length],
        transcriptSnippet: "User: I am not sure about the EMI interest rates... Agent: I can explain the breakdown..."
      });
    }
    
    // Simple filter if dates are provided
    if (startDate && endDate) {
       return sessions.filter(s => s.date >= startDate && s.date <= endDate);
    }
    
    return sessions;
  }

  getSessionDetails(userId: string): SessionDetails {
    const user = this.users.find(u => u.id === userId) || this.users[0];
    const now = new Date();
    const startTime = new Date(now.getTime() - 15 * 60000); // 15 mins ago
    
    // Mock transcript generation
    const messages: TranscriptMessage[] = [
       { id: 'm1', role: 'AGENT', text: "Hello! Welcome to NxtWave. Can you please confirm your name?", timestamp: startTime.toISOString() },
       { id: 'm2', role: 'USER', text: `Hi, I'm ${user.name}.`, timestamp: new Date(startTime.getTime() + 5000).toISOString() },
       { id: 'm3', role: 'AGENT', text: `Thanks ${user.name.split(' ')[0]}. I see you're interested in the CCBP 4.0 program. Is that correct?`, timestamp: new Date(startTime.getTime() + 8000).toISOString() },
       { id: 'm4', role: 'USER', text: "Yes, I want to know about the placements.", timestamp: new Date(startTime.getTime() + 15000).toISOString() },
       { id: 'm5', role: 'AGENT', text: "Absolutely. We've placed thousands of students in top tech companies. Are you ready to look at the fee structure?", timestamp: new Date(startTime.getTime() + 22000).toISOString() },
       { id: 'm6', role: 'USER', text: "What are the EMI options?", timestamp: new Date(startTime.getTime() + 30000).toISOString() },
       { id: 'm7', role: 'AGENT', text: "We have flexible EMI plans starting at just ₹5,000/month with 0% interest for the first 6 months. Does that sound manageable?", timestamp: new Date(startTime.getTime() + 38000).toISOString() },
       { id: 'm8', role: 'USER', text: "Yes, that works.", timestamp: new Date(startTime.getTime() + 45000).toISOString() },
    ];

    return {
      sessionId: `sess-${userId}-${Date.now()}`,
      userId: userId,
      userName: user.name,
      agentVersion: "v2.5-Flash-Live",
      stageAtTime: `Stage ${user.currentStageId}`,
      date: now.toISOString().split('T')[0],
      startTime: startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      endTime: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      duration: "08:45",
      messages: messages
    };
  }
}

export const store = new Store();
