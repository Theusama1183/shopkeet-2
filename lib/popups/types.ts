/**
 * Popup trigger and display condition types.
 * Triggers define *when* a popup fires; conditions define *where* (which pages).
 */

import type { ConditionRule } from "@/lib/templates/conditions";

// ─── Trigger ──────────────────────────────────────────────────────────────────

export type PopupTriggerEvent =
  | "on-load"         // After page load (+ optional delay)
  | "on-scroll"       // After scrolling X% down the page
  | "on-exit-intent"  // Mouse moves toward browser chrome (desktop)
  | "on-click";       // User clicks a CSS-selector-matched element

export type PopupFrequency =
  | "always"            // Every page visit
  | "once-per-session"  // Once per browser session
  | "once-per-user";    // Once ever (stored in localStorage)

export interface PopupTrigger {
  event: PopupTriggerEvent;
  /** Seconds to wait after page load before showing (on-load only) */
  delay?: number;
  /** 0–100 scroll depth percentage (on-scroll only) */
  scrollPercent?: number;
  /**
   * CSS selector for the element that opens the popup (on-click only).
   * e.g. "#open-popup", ".subscribe-btn", "[data-popup]"
   */
  clickSelector?: string;
  frequency: PopupFrequency;
}

export const DEFAULT_TRIGGER: PopupTrigger = {
  event: "on-load",
  delay: 3,
  frequency: "once-per-session",
};

// ─── Full popup conditions object stored in DB ────────────────────────────────

export interface PopupConditions {
  /** ConditionRule[] — same format as template display conditions */
  rules?: ConditionRule[];
}

// ─── Labels ───────────────────────────────────────────────────────────────────

export const TRIGGER_EVENT_LABELS: Record<PopupTriggerEvent, string> = {
  "on-load":        "On Page Load",
  "on-scroll":      "On Scroll",
  "on-exit-intent": "On Exit Intent",
  "on-click":       "On Element Click",
};

export const TRIGGER_FREQUENCY_LABELS: Record<PopupFrequency, string> = {
  "always":           "Every visit",
  "once-per-session": "Once per session",
  "once-per-user":    "Once per user",
};
