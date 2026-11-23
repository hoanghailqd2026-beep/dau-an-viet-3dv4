export type HapticPattern = 'tick' | 'soft' | 'selection' | 'detent' | 'pulse';

const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  tick: 5,
  soft: 8,
  selection: 12,
  detent: 16,
  pulse: [10, 28, 12],
};

/**
 * Triggers a subtle, safe haptic pulse on devices that support the Web Vibration API.
 * Silently no-ops on unsupported platforms (desktop, iOS Safari) or when reduced motion is enabled.
 */
export function triggerHaptic(pattern: HapticPattern = 'selection'): void {
  try {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    if (typeof navigator.vibrate !== 'function') return;

    const prefersReduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const userActivation = (
      navigator as Navigator & {
        userActivation?: { isActive?: boolean; hasBeenActive?: boolean };
      }
    ).userActivation;
    if (userActivation && !userActivation.isActive && !userActivation.hasBeenActive) {
      return;
    }

    navigator.vibrate(HAPTIC_PATTERNS[pattern]);
  } catch {
    // Ignore errors in restricted iframes or unsupported WebViews
  }
}
