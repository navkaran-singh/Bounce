export type AppView = 'onboarding' | 'contract' | 'dashboard' | 'stats' | 'growth' | 'history';
export type ResilienceStatus = 'ACTIVE' | 'CRACKED' | 'BOUNCED' | 'FROZEN' | 'RECOVERING';
export type RecoveryOption = 'one-minute-reset' | 'use-shield' | 'gentle-restart';
export type Theme = 'dark' | 'light' | 'system';
export type EnergyLevel = 'low' | 'medium' | 'high';
export type SoundType = 'rain' | 'forest' | 'stream' | 'volcano' | 'wind';
export type BreathPattern = 'coherence' | 'box' | '478' | 'sigh';
export type WeeklyPersona = 'TITAN' | 'GRINDER' | 'SURVIVOR' | 'GHOST';

// ====== IDENTITY EVOLUTION ENGINE TYPES ======

export type IdentityType = 'SKILL' | 'CHARACTER' | 'RECOVERY';

export type IdentityStage =
  | 'INITIATION'
  | 'INTEGRATION'
  | 'EXPANSION'
  | 'MAINTENANCE';

export interface IdentityProfile {
  type: IdentityType | null;
  stage: IdentityStage;
  stageEnteredAt: string | null; // ISO (YYYY-MM-DD)
  weeksInStage: number;
}

export type EvolutionSuggestionType =
  // Skill
  | 'INCREASE_DIFFICULTY'
  | 'ADD_VARIATION'
  | 'SHIFT_IDENTITY'
  | 'TECHNIQUE_WEEK'
  // Character
  | 'ADD_REFLECTION'
  | 'DEEPEN_CONTEXT'
  | 'EMOTIONAL_WEEK'
  // Recovery
  | 'SOFTER_HABIT'
  | 'FRICTION_REMOVAL'
  | 'STABILIZATION_WEEK'
  | 'RELAPSE_PATTERN'
  // Universal
  | 'REST_WEEK'
  | 'MAINTAIN';

export interface EvolutionSuggestion {
  type: EvolutionSuggestionType;
  message: string;   // human-readable, Bounce-tone text
  createdAt: string; // ISO date
  applied: boolean;
}

// ====== END IDENTITY EVOLUTION ENGINE TYPES ======

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
  // Identity Evolution fields
  identityType?: IdentityType | null;
  identityStage?: IdentityStage;
  evolutionSuggestion?: EvolutionSuggestion | null;
  stageReason?: string;
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

  // Identity Evolution Engine
  identityProfile: IdentityProfile;
  lastEvolutionSuggestion: EvolutionSuggestion | null;

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

  // Identity Evolution Engine Actions
  setIdentityProfile: (profile: Partial<IdentityProfile>) => void;
  setLastEvolutionSuggestion: (suggestion: EvolutionSuggestion | null) => void;
  applyEvolutionPlan: () => Promise<{ success: boolean; narrative: string }>;

  // Cloud Sync (Firebase)
  initializeAuth: () => (() => void) | void;
  loadFromFirebase: () => Promise<void>;
  syncToFirebase: (forceSync?: boolean) => Promise<void>;

  // Premium Actions
  // NOTE: upgradeToPremium was REMOVED for security - handled by /api/verify-payment
  checkSubscriptionStatus: () => void;
}
