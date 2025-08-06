// Accessibility utilities and helpers

export interface AccessibilityOptions {
  announceToScreenReader?: boolean;
  focusManagement?: boolean;
  keyboardNavigation?: boolean;
}

// Screen reader announcement utility
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
) {
  if (typeof window === 'undefined') return;

  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Focus management utilities
export class FocusManager {
  private static focusStack: HTMLElement[] = [];

  static saveFocus() {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement !== document.body) {
      this.focusStack.push(activeElement);
    }
  }

  static restoreFocus() {
    const elementToFocus = this.focusStack.pop();
    if (elementToFocus) {
      elementToFocus.focus();
    }
  }

  static trapFocus(container: HTMLElement) {
    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }

  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
  }
}

// Keyboard navigation utilities
export const KeyboardKeys = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  TAB: 'Tab',
  HOME: 'Home',
  END: 'End',
} as const;

export function handleKeyboardNavigation(
  event: React.KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  onSelectionChange: (index: number) => void,
  onSelect?: (index: number) => void
) {
  switch (event.key) {
    case KeyboardKeys.ARROW_UP:
      event.preventDefault();
      const prevIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
      onSelectionChange(prevIndex);
      items[prevIndex]?.focus();
      break;

    case KeyboardKeys.ARROW_DOWN:
      event.preventDefault();
      const nextIndex = currentIndex >= items.length - 1 ? 0 : currentIndex + 1;
      onSelectionChange(nextIndex);
      items[nextIndex]?.focus();
      break;

    case KeyboardKeys.HOME:
      event.preventDefault();
      onSelectionChange(0);
      items[0]?.focus();
      break;

    case KeyboardKeys.END:
      event.preventDefault();
      const lastIndex = items.length - 1;
      onSelectionChange(lastIndex);
      items[lastIndex]?.focus();
      break;

    case KeyboardKeys.ENTER:
    case KeyboardKeys.SPACE:
      event.preventDefault();
      onSelect?.(currentIndex);
      break;

    case KeyboardKeys.ESCAPE:
      event.preventDefault();
      // Let parent handle escape
      break;
  }
}

// ARIA attributes helpers
export function generateAriaDescribedBy(...ids: string[]): string {
  return ids.filter(Boolean).join(' ');
}

export function generateAriaLabelledBy(...ids: string[]): string {
  return ids.filter(Boolean).join(' ');
}

// Color contrast utilities
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    // This is a simplified version - in production you'd want a more robust implementation
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const [rs, gs, bs] = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsContrastRequirements(
  foreground: string, 
  background: string, 
  level: 'AA' | 'AAA' = 'AA'
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
}

// Reduced motion utilities
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function respectMotionPreference<T>(
  normalValue: T,
  reducedValue: T
): T {
  return prefersReducedMotion() ? reducedValue : normalValue;
}

// High contrast mode detection
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
}

// Screen reader detection
export function isScreenReaderActive(): boolean {
  if (typeof window === 'undefined') return false;
  
  // This is a heuristic - not 100% accurate but covers most cases
  const hasScreenReaderInUserAgent = typeof navigator !== 'undefined' && (
    navigator.userAgent.includes('NVDA') ||
    navigator.userAgent.includes('JAWS') ||
    navigator.userAgent.includes('VoiceOver')
  );
  
  const hasSpeechSynthesis = 'speechSynthesis' in window;
  
  const hasReducedMotionPreference = 'matchMedia' in window && 
    (window as Window & typeof globalThis).matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  return hasScreenReaderInUserAgent || hasSpeechSynthesis || hasReducedMotionPreference;
}

// Skip link utilities
export function createSkipLink(targetId: string, text: string = 'Skip to main content') {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-primary text-primary-foreground p-4 z-50';
  skipLink.textContent = text;
  
  document.body.insertBefore(skipLink, document.body.firstChild);
}

// ARIA live region manager
export class LiveRegionManager {
  private static regions = new Map<string, HTMLElement>();

  static createRegion(id: string, priority: 'polite' | 'assertive' = 'polite') {
    if (this.regions.has(id)) return;

    const region = document.createElement('div');
    region.id = id;
    region.setAttribute('aria-live', priority);
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    
    document.body.appendChild(region);
    this.regions.set(id, region);
  }

  static announce(regionId: string, message: string) {
    const region = this.regions.get(regionId);
    if (region) {
      region.textContent = message;
    }
  }

  static clear(regionId: string) {
    const region = this.regions.get(regionId);
    if (region) {
      region.textContent = '';
    }
  }

  static removeRegion(regionId: string) {
    const region = this.regions.get(regionId);
    if (region) {
      document.body.removeChild(region);
      this.regions.delete(regionId);
    }
  }
}

// Initialize accessibility features
if (typeof window !== 'undefined') {
  // Create default live regions
  LiveRegionManager.createRegion('announcements', 'polite');
  LiveRegionManager.createRegion('alerts', 'assertive');

  // Create skip link for main content
  createSkipLink('main-content');
}