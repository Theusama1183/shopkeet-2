/**
 * Template Display Conditions
 *
 * Elementor-style display conditions — each rule targets a "location type"
 * with an optional sub-selector (specific product/page/post IDs, or "all").
 *
 * A template is shown when ANY rule matches (OR logic between rules).
 * An empty rules array = show on entire site (default).
 */

// ─── Location types ───────────────────────────────────────────────────────────

export type ConditionLocationType =
  | "entire-site"          // Every page on the storefront
  | "front-page"           // The home page
  | "single-page"          // A specific custom page (sub: page ID or "all")
  | "single-product"       // A product detail page (sub: product ID or "all")
  | "archive-products"     // The products listing/archive page
  | "single-post"          // A blog post page (sub: post ID or "all")
  | "archive-blog"         // The blog listing/archive page
  | "cart"                 // The cart page
  | "search"               // Search results page
  | "not-found";           // 404 page

/** Whether this rule includes or excludes the matched location */
export type ConditionOperator = "include" | "exclude";

/** A single display condition rule */
export interface ConditionRule {
  operator: ConditionOperator;
  locationType: ConditionLocationType;
  /**
   * Sub-selector for location types that support it.
   * - "all"        → matches all items of that type
   * - "<id>"       → matches a specific item by ID
   * - undefined    → treated as "all"
   */
  subType?: "all" | string;
}

/**
 * Popup-specific trigger settings (only used when template.type === "popup")
 */
export interface PopupTrigger {
  /** When to show the popup */
  event: "on-load" | "on-scroll" | "on-exit-intent" | "on-click";
  /** Delay in seconds before showing (for on-load) */
  delay?: number;
  /** Scroll percentage (0–100) to trigger (for on-scroll) */
  scrollPercent?: number;
  /** CSS selector for the element that triggers the popup (for on-click) */
  clickSelector?: string;
  /** How often to show: always, once-per-session, once-per-user */
  frequency?: "always" | "once-per-session" | "once-per-user";
}

/**
 * Full conditions object stored in the DB.
 * - `rules`   — display condition rules (empty = entire site)
 * - `popup`   — popup trigger settings (only for popup templates)
 */
export interface TemplateConditions {
  /** Display condition rules. Empty array or missing = show everywhere. */
  rules?: ConditionRule[];
  /** Popup trigger config (only relevant for type === "popup") */
  popup?: PopupTrigger;

  // ── Legacy fields (kept for backwards compatibility) ──────────────────────
  /** @deprecated Use rules instead */
  show?: "all" | "only" | "none";
  /** @deprecated Use rules instead */
  except?: string[];
  /** @deprecated Use rules instead */
  pages?: string[];
}

// ─── Location type metadata ───────────────────────────────────────────────────

export interface LocationTypeMeta {
  label: string;
  group: string;
  hasSubSelector: boolean;
  subSelectorType?: "pages" | "products" | "posts";
  subSelectorLabel?: string;
}

export const LOCATION_TYPE_META: Record<ConditionLocationType, LocationTypeMeta> = {
  "entire-site":      { label: "Entire Site",        group: "Global",   hasSubSelector: false },
  "front-page":       { label: "Front Page",          group: "Global",   hasSubSelector: false },
  "single-page":      { label: "Specific Page",       group: "Pages",    hasSubSelector: true, subSelectorType: "pages",    subSelectorLabel: "Select page" },
  "single-product":   { label: "Single Product",      group: "Products", hasSubSelector: true, subSelectorType: "products", subSelectorLabel: "Select product" },
  "archive-products": { label: "Products Archive",    group: "Products", hasSubSelector: false },
  "single-post":      { label: "Single Post",         group: "Blog",     hasSubSelector: true, subSelectorType: "posts",    subSelectorLabel: "Select post" },
  "archive-blog":     { label: "Blog Archive",        group: "Blog",     hasSubSelector: false },
  "cart":             { label: "Cart Page",            group: "Commerce", hasSubSelector: false },
  "search":           { label: "Search Results",      group: "Commerce", hasSubSelector: false },
  "not-found":        { label: "404 Page",             group: "System",   hasSubSelector: false },
};

export const LOCATION_TYPE_GROUPS = ["Global", "Pages", "Products", "Blog", "Commerce", "System"] as const;

// ─── Evaluator ────────────────────────────────────────────────────────────────

export interface EvaluationContext {
  /** Current page type (maps to ConditionLocationType) */
  locationType: ConditionLocationType;
  /** ID of the specific item (product ID, page ID, post ID) if applicable */
  itemId?: string | null;
  /** Whether this is the front/home page */
  isFrontPage?: boolean;
}

/**
 * Evaluate whether a template should be shown given the current context.
 * Rules are evaluated with OR logic — any matching include rule shows the template.
 * Exclude rules take precedence over include rules.
 */
export function shouldShowTemplate(
  conditions: TemplateConditions | null | undefined,
  // Legacy signature: (conditions, pageId) — kept for backwards compat
  pageIdOrContext?: string | null | EvaluationContext
): boolean {
  if (!conditions) return true;

  // ── Legacy path ──────────────────────────────────────────────────────────
  if (typeof pageIdOrContext === "string" || pageIdOrContext === null || pageIdOrContext === undefined) {
    const pageId = pageIdOrContext ?? null;

    // New rules-based conditions
    if (conditions.rules && conditions.rules.length > 0) {
      return evaluateRules(conditions.rules, {
        locationType: "single-page",
        itemId: pageId,
      });
    }

    // Old show/except/pages format
    const { show = "all", except = [], pages = [] } = conditions;
    switch (show) {
      case "none": return false;
      case "only": return pageId ? pages.includes(pageId) : false;
      case "all":
      default:     return pageId ? !except.includes(pageId) : true;
    }
  }

  // ── New context-based path ────────────────────────────────────────────────
  const ctx = pageIdOrContext;

  if (!conditions.rules || conditions.rules.length === 0) return true;

  return evaluateRules(conditions.rules, ctx);
}

function evaluateRules(rules: ConditionRule[], ctx: EvaluationContext): boolean {
  const includeRules = rules.filter(r => r.operator === "include");
  const excludeRules = rules.filter(r => r.operator === "exclude");

  // Check excludes first — if any exclude matches, hide
  for (const rule of excludeRules) {
    if (ruleMatches(rule, ctx)) return false;
  }

  // If no include rules, default to show (only excludes were set)
  if (includeRules.length === 0) return true;

  // Show if any include rule matches
  return includeRules.some(rule => ruleMatches(rule, ctx));
}

function ruleMatches(rule: ConditionRule, ctx: EvaluationContext): boolean {
  if (rule.locationType === "entire-site") return true;

  if (rule.locationType === "front-page") return !!ctx.isFrontPage;

  if (rule.locationType !== ctx.locationType) return false;

  // Location type matches — check sub-selector
  const sub = rule.subType ?? "all";
  if (sub === "all") return true;

  return ctx.itemId === sub;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Summarise conditions for display in the UI */
export function summariseConditions(conditions: TemplateConditions | null | undefined): string {
  if (!conditions) return "Entire Site";

  // New rules format
  if (conditions.rules && conditions.rules.length > 0) {
    const includes = conditions.rules.filter(r => r.operator === "include");
    const excludes = conditions.rules.filter(r => r.operator === "exclude");
    if (includes.length === 1 && includes[0].locationType === "entire-site") return "Entire Site";
    const parts: string[] = [];
    if (includes.length > 0) parts.push(`${includes.length} include${includes.length > 1 ? "s" : ""}`);
    if (excludes.length > 0) parts.push(`${excludes.length} exclude${excludes.length > 1 ? "s" : ""}`);
    return parts.join(", ") || "Entire Site";
  }

  // Legacy format
  if (conditions.show === "none") return "Hidden";
  if (conditions.show === "only" && conditions.pages?.length) {
    return `${conditions.pages.length} page${conditions.pages.length > 1 ? "s" : ""}`;
  }
  if (conditions.show === "all" && conditions.except?.length) {
    return `All except ${conditions.except.length}`;
  }
  return "Entire Site";
}
