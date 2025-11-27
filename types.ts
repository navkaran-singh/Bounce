
export type AppView = 'onboarding' | 'contract' | 'dashboard' | 'stats' | 'growth' | 'history';
export type ResilienceStatus = 'ACTIVE' | 'CRACKED' | 'BOUNCED' | 'FROZEN';
export type Theme = 'dark' | 'light' | 'system';
export type EnergyLevel = 'low' | 'medium' | 'high';
export type SoundType = 'rain' | 'forest' | 'stream' | 'volcano' | 'wind';
export type BreathPattern = 'coherence' | 'box' | '478' | 'sigh';
import { supabase } from './services/supabase';

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
  energy?: EnergyLevel;
  note?: string;
  intention?: string; // Feature: Morning Anchor
}

export interface Badge {
  id: string;
  label: string;
  icon: string;
  unlocked: boolean;
  requirement: number; // Total completions needed
}

export interface Goal {
  type: 'weekly';
  target: number;
}

export interface WeeklyInsight {
  id: string;
  startDate: string;
  endDate: string;
  story: string[]; // Array of story segments (e.g., "You crushed Monday...", "Wednesday was tough...")
  pattern: string; // "Low energy on Wednesdays"
  suggestion: string; // "Auto-shrink habit..."
  viewed: boolean;
}

import { User } from '@supabase/supabase-js';

export interface UserState {
  // Premium Status
  isPremium: boolean;
  user: User | null; // Supabase User

  // Navigation
  currentView: AppView;

  // Settings
  theme: Theme;
  setTheme: (theme: Theme) => void;
  soundEnabled: boolean;
  soundType: SoundType;
  soundVolume: number; // 0.0 to 1.0
  toggleSound: () => void;
  setSoundType: (type: SoundType) => void;
  setSoundVolume: (volume: number) => void;

  // User Data
  identity: string;
  microHabits: string[]; // Array of 3 variations
  habitRepository: Record<EnergyLevel, string[]>; // Stored habits for each level
  currentHabitIndex: number; // Which variation is active
  energyTime: string;
  currentEnergyLevel: EnergyLevel | null; // For the Smart Energy Check-in

  // Goals
  goal: Goal;
  setGoal: (target: number) => void;

  // Onboarding State
  dismissedTooltips: string[];
  dismissTooltip: (id: string) => void;

  // Progress
  resilienceScore: number;
  resilienceStatus: ResilienceStatus;
  streak: number;
  shields: number;
  totalCompletions: number;
  lastCompletedDate: string | null;
  missedYesterday: boolean;
  dailyCompletedIndices: number[]; // Track which habit indices are done today

  // Historical Data
  history: Record<string, DailyLog>; // YYYY-MM-DD -> Log
  weeklyInsights: WeeklyInsight[]; // Stored weekly reviews

  // Undo Capabilities
  undoState: Partial<UserState> | null;
  saveUndoState: () => void;
  restoreUndoState: () => void;

  // Freeze Protocol
  isFrozen: boolean;
  freezeExpiry: number | null; // Timestamp

  // Actions
  setIdentity: (identity: string) => void;
  setMicroHabits: (habits: string[]) => void;
  setHabitsWithLevels: (habits: Record<EnergyLevel, string[]>) => void;
  cycleMicroHabit: () => void; // Shuffle action
  setEnergyTime: (time: string) => void;
  setEnergyLevel: (level: EnergyLevel) => void; // Smart Energy Action
  completeDailyBounce: () => void;
  updateResilience: (updates: Partial<Pick<UserState, 'resilienceScore' | 'resilienceStatus' | 'streak' | 'shields' | 'lastCompletedDate' | 'missedYesterday' | 'dailyCompletedIndices' | 'totalCompletions'>>) => void;
  logReflection: (date: string, energy: EnergyLevel, note: string) => void;
  setDailyIntention: (date: string, intention: string) => void;
  toggleFreeze: (active: boolean) => void;
  setView: (view: AppView) => void;
  resetProgress: () => void;
  importData: (data: string) => boolean; // Returns success
  generateWeeklyReview: () => void; // Trigger AI analysis
  markReviewViewed: (id: string) => void;
  handleVoiceLog: (text: string, type: 'note' | 'habit' | 'intention') => void;
  addMicroHabit: (habit: string) => void;

  // Supabase Sync
  initializeAuth: () => void;
  loadFromSupabase: () => Promise<void>;
  syncToSupabase: () => Promise<void>;
}
