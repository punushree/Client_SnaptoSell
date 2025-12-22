/**
 * Product Analyzer Configuration
 * Matches Python backend config.py structure
 */

// ============================================================================
// PRODUCT CATEGORIES
// ============================================================================

export const PRODUCT_CATEGORIES = ["electronics", "fashion", "other"] as const;
export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

// ============================================================================
// REASONING LEVELS (per stage per category)
// ============================================================================

export const REASONING_LEVELS = {
  // Stage 0 - Category Detection
  stage0: "low", // Simple classification task
  
  // Electronics
  stage1: "low", // Electronics identification - faster
  stage2: "medium",   // Electronics authentication - balanced
  stage3: "low",    // Electronics pricing (data gathering)
  
  // Fashion
  fashion_stage1: "low", // Fashion identification - faster
  fashion_stage2: "medium",   // Fashion authentication - balanced
  fashion_stage3: "low",    // Fashion pricing
  
  // Other
  other_stage1: "low",   // Generic product details (simple)
  other_stage2: "medium", // Generic product verification
  other_stage3: "medium"  // Generic product pricing
} as const;

export type ReasoningEffort = "low" | "medium" | "high";

// ============================================================================
// VERBOSITY LEVELS (output detail)
// ============================================================================

export const VERBOSITY_LEVELS = {
  stage0: "low",
  stage1: "low",
  stage2: "medium",
  stage3: "medium",
  fashion_stage1: "low",
  fashion_stage2: "medium",
  fashion_stage3: "medium",
  other_stage1: "low",
  other_stage2: "medium",
  other_stage3: "medium"
} as const;

export type VerbosityLevel = "low" | "medium" | "high";

// ============================================================================
// WEB SEARCH CONTROL
// ============================================================================

export const ENABLE_WEB_SEARCH = {
  stage0: false,          // Category detection - no search needed
  stage1: false,          // Electronics ID - pure vision
  stage2: true,           // Electronics verification - needs official specs
  stage3: true,           // Electronics pricing - needs marketplace data
  fashion_stage1: false,  // Fashion ID - pure vision
  fashion_stage2: true,   // Fashion authentication - needs brand info
  fashion_stage3: true,   // Fashion pricing - needs marketplace data
  other_stage1: false,    // Generic product - pure vision
  other_stage2: true,     // Generic product verification - needs web search
  other_stage3: true      // Generic product pricing - needs marketplace data
} as const;

// ============================================================================
// VALIDATION THRESHOLDS
// ============================================================================

// Electronics
export const MIN_CONFIDENCE_SCORE = 50; // Below this = ask for better input

// Fashion
export const FASHION_CONFIG = {
  min_confidence_score: 40, // More lenient than electronics
  brand_tiers: [
    "ultra-luxury",
    "luxury",
    "premium designer",
    "contemporary",
    "athletic premium",
    "athletic mainstream",
    "streetwear",
    "fast fashion",
    "vintage",
    "unbranded"
  ],
  condition_ratings: [
    "NWT",
    "NWOT",
    "like new",
    "excellent pre-owned condition",
    "very good pre-owned condition",
    "good pre-owned condition",
    "fair pre-owned condition",
    "poor condition"
  ],
  valid_genders: ["male", "female", "unisex"],
  // Validation strictness settings
  allow_missing_size: true,
  allow_missing_brand: false,
  max_missing_details_allowed: 5
} as const;

// Generic products
export const OTHER_CONFIG = {
  min_confidence_score: 40 // Lower threshold for generic items
} as const;

// ============================================================================
// IMAGE CONSTRAINTS
// ============================================================================

export const MAX_IMAGES = 10;
export const MIN_IMAGES = 1;
export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// ============================================================================
// STAGE FLOW CONFIGURATION
// ============================================================================

// Which categories support full 3-stage flow
export const SUPPORTS_FULL_FLOW = {
  electronics: true, // Stage 1, 2, 3
  fashion: true,     // Stage 1, 2, 3
  other: true        // Stage 1, 2, 3 (NOW ENABLED)
} as const;

// Which categories have pricing enabled
export const PRICING_ENABLED = {
  electronics: true,
  fashion: true,
  other: true        // NOW ENABLED
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get reasoning level for a specific stage
 */
export function getReasoningLevel(stageKey: keyof typeof REASONING_LEVELS): ReasoningEffort {
  return REASONING_LEVELS[stageKey] as ReasoningEffort;
}

/**
 * Get verbosity level for a specific stage
 */
export function getVerbosityLevel(stageKey: keyof typeof VERBOSITY_LEVELS): VerbosityLevel {
  return VERBOSITY_LEVELS[stageKey] as VerbosityLevel;
}

/**
 * Check if web search is enabled for a specific stage
 */
export function isWebSearchEnabled(stageKey: keyof typeof ENABLE_WEB_SEARCH): boolean {
  return ENABLE_WEB_SEARCH[stageKey];
}

/**
 * Get minimum confidence score for a category
 */
export function getMinConfidence(category: ProductCategory): number {
  if (category === "fashion") return FASHION_CONFIG.min_confidence_score;
  if (category === "other") return OTHER_CONFIG.min_confidence_score;
  return MIN_CONFIDENCE_SCORE;
}
