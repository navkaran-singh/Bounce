export type AppView = 'onboarding' | 'contract' | 'dashboard' | 'stats' | 'growth' | 'history';
export type ResilienceStatus = 'ACTIVE' | 'CRACKED' | 'BOUNCED' | 'FROZEN' | 'RECOVERING';
export type RecoveryOption = 'one-minute-reset' | 'use-shield' | 'gentle-restart';
export type Theme = 'dark' | 'light' | 'system';
export type EnergyLevel = 'low' | 'medium' | 'high';
export type SoundType = 'rain' | 'forest' | 'stream' | 'volcano' | 'wind';
export type BreathPattern = 'coherence' | 'box' | '478' | 'sigh';
export type WeeklyPersona = 'TITAN' | 'GRINDER' | 'SURVIVOR' | 'GHOST';

export interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  type?: 'text' | 'options';
  options?: string[];
}

export interface DailyLog {
  date: string; // ISO Date string (YYYY-MM-DD)
  completedIndices: number[];
  completedHabitNames?: string[]; // Snapshot of actual habit text at completion time
  dailyScore?: number; // Weighted average score (0.0 to 3.0) - calculated once and persisted
  energy?: EnergyLevel;
  note?: string;
  intention?: string;
}

export interface Badge {
  id: string;
  label: string;
  icon: string;
  unlocked: boolean;
  requirement: number;
}

export interface Goal {
  type: 'weekly';
  target: number;
}

export interface WeeklyInsight {
  id: string;
  startDate: string;
  endDate: string;
  story: string[];
  pattern: string;
  suggestion: string;
  viewed: boolean;
}

export interface WeeklyReviewState {
  available: boolean;
  startDate: string;
  endDate: string;
  totalCompletions: number;
  weeklyMomentumScore: number; // 0.0 to 21.0 (7 days * 3.0 max per day)
  persona: WeeklyPersona;
  missedHabits: Record<string, number>; // Habit Name -> Miss Count
}

// Firebase User type (simplified for state)
export interface AppUser {
  uid: string;
  email?: string | null;
}

export interface UserState {
  // Premium Status
  isPremium: boolean;
  premiumExpiryDate: number | null;
  user: AppUser | null;

  setUser: (user: AppUser | null) => void;
  logout: () => Promise<void>;
  getExportData: () => string;

  // Navigation
  currentView: AppView;

  // Settings
  theme: Theme;
  setTheme: (theme: Theme) => void;
  soundEnabled: boolean;
  soundType: SoundType;
  soundVolume: number;
  toggleSound: () => void;
  setSoundType: (type: SoundType) => void;
  setSoundVolume: (volume: number) => void;

  // User Data
  identity: string;
  microHabits: string[];
  habitRepository: Record<EnergyLevel, string[]>;
  currentHabitIndex: number;
  energyTime: string;
  currentEnergyLevel: EnergyLevel | null;
  dailyPlanMessage: string | null;

  // Goals
  goal: Goal;
  setGoal: (target: number) => void;

  // Onboarding State
  dismissedTooltips: string[];
  dismissTooltip: (id: string) => void;
  dismissDailyPlanMessage: () => void;

  // Progress
  resilienceScore: number;
  resilienceStatus: ResilienceStatus;
  streak: number;
  shields: number;
  totalCompletions: number;
  lastCompletedDate: string | null;
  lastDailyPlanDate: string | null;
  missedYesterday: boolean;
  dailyCompletedIndices: number[];

  // Historical Data
  history: Record<string, DailyLog>;
  weeklyInsights: WeeklyInsight[];
  
  // Weekly Review (Sunday Ritual)
  weeklyReview: WeeklyReviewState | null;
  lastWeeklyReviewDate: string | null;

  // Undo Capabilities
  undoState: Partial<UserState> | null;
  saveUndoState: () => void;
  restoreUndoState: () => void;

  // Freeze Protocol
  isFrozen: boolean;
  freezeExpiry: number | null;

  // Recovery Mode (Resilience Engine 2.0)
  recoveryMode: boolean;
  consecutiveMisses: number;
  lastMissedDate: string | null;

  // Actions
  setIdentity: (identity: string) => void;
  setMicroHabits: (habits: string[]) => void;
  setHabitsWithLevels: (habits: Record<EnergyLevel, string[]>) => void;
  cycleMicroHabit: () => void;
  setEnergyTime: (time: string) => void;
  setEnergyLevel: (level: EnergyLevel) => void;
  completeDailyBounce: () => void;
  updateResilience: (updates: Partial<Pick<UserState, 'resilienceScore' | 'resilienceStatus' | 'streak' | 'shields' | 'lastCompletedDate' | 'missedYesterday' | 'dailyCompletedIndices' | 'totalCompletions'>>) => void;
  logReflection: (date: string, energy: EnergyLevel, note: string) => void;
  setDailyIntention: (date: string, intention: string) => void;
  toggleFreeze: (active: boolean) => void;
  setView: (view: AppView) => void;

  // Recovery Mode Actions
  activateRecoveryMode: () => void;
  dismissRecoveryMode: () => void;
  applyRecoveryOption: (option: 'one-minute-reset' | 'use-shield' | 'gentle-restart') => void;
  checkMissedDay: () => void;
  checkNewDay: () => Promise<void>;
  checkWeeklyReview: () => void;
  completeWeeklyReview: () => void;
  optimizeWeeklyRoutine: (type: 'LEVEL_UP' | 'RESET') => Promise<void>;
  resetProgress: () => void;
  importData: (data: string) => boolean;
  generateWeeklyReview: () => void;
  markReviewViewed: (id: string) => void;
  handleVoiceLog: (text: string, type: 'note' | 'habit' | 'intention') => void;
  addMicroHabit: (habit: string) => void;

  // Cloud Sync (Firebase)
  initializeAuth: () => (() => void) | void;
  loadFromFirebase: () => Promise<void>;
  syncToFirebase: (forceSync?: boolean) => Promise<void>;

  // Premium Actions
  upgradeToPremium: () => Promise<void>;
  checkSubscriptionStatus: () => void;
}
