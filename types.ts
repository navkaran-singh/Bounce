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

// v8 Behavior-Based Stage Initialization
export type InitialFamiliarity = 'NEW' | 'INCONSISTENT' | 'BASIC' | 'REGULAR' | 'IDENTITY';

export interface IdentityProfile {
  type: IdentityType | null;
  stage: IdentityStage;
  stageEnteredAt: string | null; // ISO (YYYY-MM-DD)
  weeksInStage: number;
  initialFamiliarity?: InitialFamiliarity; // v8: Set during onboarding
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
  _dirty?: boolean; // 🛡️ COST SAFETY: Marks log for sync - NOT persisted to Firebase
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

// Identity Branching Logic
export interface IdentityBranching {
  showBranching: boolean;
  options: string[];
  reason?: string;
}

// Full Weekly Plan Structure
export interface WeeklyEvolutionPlan {
  high: string[];
  medium: string[];
  low: string[];
  narrative: string;
  habitAdjustments?: string[];
  stageAdvice?: string;
  summary?: string;
}

// Persona-Aware Evolution Option
export type EvolutionOptionId =
  | 'INCREASE_DIFFICULTY' | 'ADD_VARIATION' | 'BRANCH_IDENTITY' | 'START_MASTERY_WEEK'
  | 'MAINTAIN' | 'SOFTER_HABIT' | 'TECHNIQUE_WEEK' | 'REDUCE_SCOPE'
  | 'REST_WEEK' | 'REDUCE_DIFFICULTY' | 'FRICTION_REMOVAL' | 'STABILIZATION_WEEK'
  | 'FRESH_START_WEEK' | 'FRESH_START' | 'CHANGE_IDENTITY' | 'SOFTER_WEEK'
  | 'ATOMIC_RESCUE'       // Ghost Loop Protection
  | 'PULLBACK_RECOVERY'   // Overreach Detection
  | 'VARIATION_WEEK';     // Titan Saturation replacement

export interface EvolutionOption {
  id: EvolutionOptionId;
  label: string;
  description: string;
  impact: {
    stageChange?: IdentityStage;
    difficultyAdjustment?: number; // +1 = harder, -1 = easier
    identityShift?: boolean;
    isFreshStart?: boolean;  // 🛠️ FIX: Added for Fresh Start detection
    isRescueMode?: boolean;  // 🛡️ Ghost Loop Protection: Atomic Rescue mode
  };
}

export interface WeeklyReviewState {
  available: boolean;
  startDate: string;
  endDate: string;
  weekKey?: string; // 🛡️ COST SAFETY: Tracks which week this review belongs to (YYYY-MM-DD of Sunday)
  totalCompletions: number;
  weeklyMomentumScore: number; // 0.0 to 21.0 (7 days * 3.0 max per day)
  persona: WeeklyPersona;
  missedHabits: Record<string, number>; // Habit Name -> Miss Count
  // Identity Evolution fields
  identityType?: IdentityType | null;
  identityStage?: IdentityStage;
  evolutionSuggestion?: EvolutionSuggestion | null; // Legacy - keeping for compatibility
  evolutionOptions?: EvolutionOption[]; // NEW: Persona-aware options
  isGhostRecovery?: boolean; // NEW: True if persona is GHOST
  stageReason?: string;
  // NEW: Identity Progress & Caching
  progressionPercent?: number;
  weeksInStage?: number;
  identityBranching?: IdentityBranching;
  cachedIdentityReflection?: string | null;
  cachedArchetype?: string | null;
  cachedWeeklyPlan?: WeeklyEvolutionPlan | null;
  selectedOptionId?: EvolutionOptionId | null; // User's selected evolution option
  advancedIdentity?: string | null; // AI-suggested next identity for evolution
  overreach?: boolean; // Overreach Detection: user pushed too hard last week
  isNoveltyWeek?: boolean; // Novelty Injection: true if due for novelty
  stageProgress?: {
    stage: IdentityStage;
    weeks: number;
    label: string;
    description: string;
    progress: number; // 0-1
    totalWeeks: number;
  };
  // v8 Stage Gatekeeper fields
  suggestedStage?: IdentityStage | null; // Stage user can upgrade to (needs confirmation)
  resonanceStatements?: string[] | null; // Statements to help user confirm readiness
  stageMessage?: string | null; // Message about stage (auto-promotion or suggestion)
}

// Firebase User type (simplified for state)
export interface AppUser {
  uid: string;
  email?: string | null;
  photoURL?: string | null;
}

export interface UserState {
  // Premium Status
  isPremium: boolean;
  premiumExpiryDate: number | null;
  subscriptionId?: string | null; // For Dodo subscription management
  subscriptionStatus?: 'active' | 'cancelled' | 'expired' | null;
  paymentType?: 'subscription' | 'one_time' | null; // Matches webhook field
  user: AppUser | null;

  setUser: (user: AppUser | null) => void;
  logout: () => Promise<void>;
  getExportData: () => string;
  setWeeklyReview: (update: Partial<WeeklyReviewState>) => void;
  updateProfilePhoto: (url: string | null) => void;

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
  userModifiedHabits: Record<string, string>;  // Key: "level_index" (e.g. "high_0"), Value: user's custom text
  currentHabitIndex: number;
  energyTime: string;
  currentEnergyLevel: EnergyLevel | null;
  dailyPlanMessage: string | null;
  dailyPlanMode: 'GROWTH' | 'STEADY' | 'RECOVERY' | null;

  // Goals
  goal: Goal;
  setGoal: (target: number) => void;

  // Onboarding State
  dismissedTooltips: string[];
  dismissTooltip: (id: string) => void;
  dismissDailyPlanMessage: () => void;
  editHabit: (level: EnergyLevel, index: number, newText: string) => void;

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
  preFreezeStatus: ResilienceStatus | null;
  lastSubscriptionCheck: number | null;

  // Recovery Mode (Resilience Engine 2.0)
  recoveryMode: boolean;
  consecutiveMisses: number;
  lastMissedDate: string | null;

  // Identity Change Flow
  pendingIdentityChange: boolean;

  // Maintenance Completion
  maintenanceComplete: boolean;

  // Ghost Loop Protection
  consecutiveGhostWeeks: number;

  // Titan Saturation + Overreach Detection
  lastSelectedEvolutionOption: string | null;
  consecutiveDifficultyUps: number;

  // Novelty Injection (weekly-count-based system)
  weeklyReviewCount: number;
  lastNoveltyReviewIndex: number | null;

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
  cancelFreeze: () => void;
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
  handleVoiceLog: (text: string, type: 'note' | 'reflection' | 'intention') => void;
  addMicroHabit: (habit: string) => void;

  // Identity Evolution Engine Actions
  setIdentityProfile: (profile: Partial<IdentityProfile>) => void;
  setLastEvolutionSuggestion: (suggestion: EvolutionSuggestion | null) => void;
  applyEvolutionPlan: () => Promise<{ success: boolean; narrative: string }>;
  applySelectedEvolutionOption: (option: EvolutionOption, skipNovelty?: boolean) => Promise<{ success: boolean; message: string; identityChange?: boolean }>;
  initiateIdentityChange: () => void;

  // v8 Stage Gatekeeper Actions
  acceptStagePromotion: () => void;

  // Maintenance Completion Actions
  handleDeepenIdentity: () => void;
  handleEvolveIdentity: (newIdentity: string) => void;
  handleStartNewIdentity: () => void;

  // Cloud Sync (Firebase)
  initializeAuth: () => (() => void) | void;
  loadFromFirebase: () => Promise<void>;
  syncToFirebase: (forceSync?: boolean) => Promise<void>;

  // Premium Actions
  // NOTE: upgradeToPremium was REMOVED for security - handled by /api/verify-payment
  checkSubscriptionStatus: () => void;
  cancelSubscription: () => Promise<void>;
}
