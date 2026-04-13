/**
 * Sound and Vibration Utilities
 * Uses Web Audio API for simple tones - no audio files needed
 */

// AudioContext singleton - created on first use
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

// Cleanup function to be called on app unload
export function closeAudioContext(): void {
  if (audioContext) {
    if (audioContext.state !== 'closed') {
      audioContext.close().catch(() => {});
    }
    audioContext = null;
  }
}

/**
 * Play a simple tone using Web Audio API
 * @param frequency Frequency in Hz (e.g., 440 for A4)
 * @param duration Duration in seconds
 * @param type Oscillator type: 'sine' | 'square' | 'sawtooth' | 'triangle'
 */
export function playTone(
  frequency: number,
  duration: number = 0.15,
  type: OscillatorType = 'sine'
): void {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    // Fade out to avoid clicks
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('[Sound] Failed to play tone:', e);
  }
}

/**
 * Play success sound - ascending tone
 * 投放成功提示音
 */
export function playSuccessSound(): void {
  playTone(523.25, 0.1, 'sine'); // C5
  setTimeout(() => playTone(659.25, 0.1, 'sine'), 80); // E5
  setTimeout(() => playTone(783.99, 0.15, 'sine'), 160); // G5
}

/**
 * Play echo pick sound - soft ping
 * 回响抽取提示音
 */
export function playEchoPickSound(): void {
  playTone(880, 0.12, 'sine'); // A5
  setTimeout(() => playTone(1108.73, 0.1, 'sine'), 60); // C#6
}

/**
 * Play new capsule arrival sound - gentle notification
 * 新碎片到达提示
 */
export function playNewCapsuleSound(): void {
  playTone(622.25, 0.08, 'sine'); // D#5
  setTimeout(() => playTone(698.46, 0.12, 'sine'), 100); // F5
}

type VibratePattern = number | number[];

/**
 * Trigger vibration if supported and enabled
 * @param pattern Vibration pattern (ms on, ms off, ...) - e.g. [30] for short buzz
 */
export function vibrate(pattern: VibratePattern = [30]): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Vibration not supported or failed - silently ignore
    }
  }
}

/**
 * Short vibration for feedback
 */
export function vibrateFeedback(): void {
  vibrate([30, 50, 30]); // Two short pulses
}

/**
 * Get stored preference for a sound type
 */
export function getSoundPreference(key: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(`sound_${key}`) === 'true';
}

/**
 * Set stored preference for a sound type
 */
export function setSoundPreference(key: string, enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`sound_${key}`, String(enabled));
}

/**
 * Get vibration preference
 */
export function getVibrationPreference(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('vibration_enabled') === 'true';
}

/**
 * Set vibration preference
 */
export function setVibrationPreference(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('vibration_enabled', String(enabled));
}

// Cleanup on app unload - remove first to prevent HMR duplicates
if (typeof window !== 'undefined') {
  window.removeEventListener('beforeunload', closeAudioContext);
  window.addEventListener('beforeunload', closeAudioContext);
}
