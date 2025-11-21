
export interface Stage {
  id: number;
  order_index: number;
  title: string;
  system_instruction: string;
  cta_label: string;
  cta_url: string;
  validation_criteria: string;
}

export interface GlobalSettings {
  baseSystemInstruction: string;
}

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export enum AvatarState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  SPEAKING = 'SPEAKING',
}

export interface AudioVisualizerState {
  volume: number;
}

export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  currentStageId: number;
  lastActive: string;
  joinedAt: string;
  status: 'active' | 'idle' | 'offline';
}

export interface KnowledgeFile {
  id: string;
  filename: string;
  size: string;
  uploadDate: string;
  scope: 'GLOBAL' | number; // 'GLOBAL' or stage_id
  uri: string;
}

export interface KPI {
  label: string;
  subtext?: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon?: any;
}

export interface FunnelStep {
  stageId: number;
  stageName: string;
  usersEntered: number;
  usersExited: number;
  dropOffRate: number; // Percentage 0-100
  avgTimeSpentSeconds: number;
  status: 'healthy' | 'warning' | 'critical'; // <10%, 10-30%, >30%
}

export interface Bottleneck {
  id: string;
  stageName: string;
  dropRate: number;
  affectedUsers: number;
  reason: string;
}

export interface VoiceQualityMetrics {
  avgLatencyMs: number;
  interruptionRate: number; // %
  sentimentScore: number; // 0-100 (positive)
  avgSilenceDuration: number; // seconds
}

export interface ChatSession {
  id: string;
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD
  time: string;
  duration: string;
  status: 'Completed' | 'Dropped' | 'Failed';
  transcriptSnippet: string;
}

export interface TranscriptMessage {
  id: string;
  role: 'AGENT' | 'USER';
  text: string;
  timestamp: string;
}

export interface SessionDetails {
  sessionId: string;
  userId: string;
  userName: string;
  agentVersion: string;
  stageAtTime: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  messages: TranscriptMessage[];
}

export type ViewState = 'AUTH' | 'STUDENT' | 'ADMIN';
export type AuthMode = 'STUDENT' | 'ADMIN';
