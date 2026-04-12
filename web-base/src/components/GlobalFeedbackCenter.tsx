import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';

// ============================================================================
// Types
// ============================================================================

export type MotionLevel = 'full' | 'light' | 'minimal';

// Toast type for feedback
export type FeedbackToastType = 'info' | 'success' | 'error' | 'warning';

export interface FeedbackContextValue {
  // Silent mode
  silentMode: boolean;
  toggleSilentMode: () => void;
  
  // Motion level
  motionLevel: MotionLevel;
  setMotionLevel: (level: MotionLevel) => void;
  
  // Motion enabled state
  motionEnabled: boolean;
  
  // Toast helpers (placeholder - use hooks/useToast for actual toasts)
  addToast: (message: string, type?: FeedbackToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

export interface GlobalFeedbackCenterProps {
  children: ReactNode;
  defaultSilentMode?: boolean;
  defaultMotionLevel?: MotionLevel;
}

// ============================================================================
// Context
// ============================================================================

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within GlobalFeedbackCenter');
  }
  return context;
}

// ============================================================================
// Provider Component
// ============================================================================

function FeedbackProvider({ 
  children, 
  defaultSilentMode = false, 
  defaultMotionLevel = 'full' 
}: GlobalFeedbackCenterProps) {
  // System reduced motion preference
  const prefersReducedMotion = useReducedMotion();

  // Silent mode state
  const [silentMode, setSilentMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('silentMode') === 'true';
    }
    return defaultSilentMode;
  });

  // Motion level state
  const [motionLevel, setMotionLevelState] = useState<MotionLevel>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('motionLevel');
      if (saved === 'full' || saved === 'light' || saved === 'minimal') {
        return saved;
      }
    }
    return defaultMotionLevel;
  });

  // Persist silent mode
  useEffect(() => {
    localStorage.setItem('silentMode', String(silentMode));
  }, [silentMode]);

  // Persist motion level
  useEffect(() => {
    localStorage.setItem('motionLevel', motionLevel);
  }, [motionLevel]);

  // Toggle silent mode
  const toggleSilentMode = useCallback(() => {
    setSilentMode(prev => !prev);
  }, []);

  // Set motion level
  const setMotionLevel = useCallback((level: MotionLevel) => {
    setMotionLevelState(level);
  }, []);

  // Compute if motion is enabled
  const motionEnabled = useMemo(() => {
    if (prefersReducedMotion) return false;
    if (silentMode) return false;
    if (motionLevel === 'minimal') return false;
    return true;
  }, [prefersReducedMotion, silentMode, motionLevel]);

  // Context value
  const contextValue = useMemo<FeedbackContextValue>(() => ({
    silentMode,
    toggleSilentMode,
    motionLevel,
    setMotionLevel,
    motionEnabled,
    addToast: () => { /* placeholder - provided by ToastProvider */ },
    removeToast: () => { /* placeholder - provided by ToastProvider */ },
  }), [silentMode, toggleSilentMode, motionLevel, setMotionLevel, motionEnabled]);

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}
    </FeedbackContext.Provider>
  );
}

// ============================================================================
// GlobalFeedbackCenter - Main Export
// ============================================================================

export function GlobalFeedbackCenter({ 
  children, 
  defaultSilentMode = false, 
  defaultMotionLevel = 'full' 
}: GlobalFeedbackCenterProps) {
  return (
    <FeedbackProvider defaultSilentMode={defaultSilentMode} defaultMotionLevel={defaultMotionLevel}>
      {children}
    </FeedbackProvider>
  );
}

export default GlobalFeedbackCenter;
