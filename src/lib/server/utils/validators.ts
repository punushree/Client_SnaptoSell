/**
 * Validation Utilities
 * Matches Python backend validators.py functionality
 */

import type { ProductCategory } from '../../../config/analyzer.config';
import { MIN_CONFIDENCE_SCORE, FASHION_CONFIG, OTHER_CONFIG } from '../../../config/analyzer.config';

// ═══════════════════════════════════════════════════════════
// CATEGORY VALIDATION
// ═══════════════════════════════════════════════════════════

export interface CategoryValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateCategoryResponse(
  data: any,
  minConfidence: number = 50
): CategoryValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!data.category) {
    errors.push('Missing required field: category');
  }

  if (typeof data.confidence_score !== 'number') {
    errors.push('Missing or invalid confidence_score');
  }

  if (!data.detected_product_type) {
    warnings.push('Missing detected_product_type');
  }

  // Validate category value
  const validCategories = ['electronics', 'fashion', 'other'];
  if (data.category && !validCategories.includes(data.category)) {
    errors.push(`Invalid category: ${data.category}. Must be one of: ${validCategories.join(', ')}`);
  }

  // Check confidence threshold
  if (data.confidence_score < minConfidence) {
    warnings.push(`Low confidence score: ${data.confidence_score}% (threshold: ${minConfidence}%)`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// ═══════════════════════════════════════════════════════════
// STAGE 1 VALIDATION (ELECTRONICS)
// ═══════════════════════════════════════════════════════════

export interface Stage1Validation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingFields: string[];
  confidence: number;
}

export function validateStage1Response(
  data: any,
  minConfidence: number = MIN_CONFIDENCE_SCORE
): Stage1Validation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingFields: string[] = [];

  // Required fields
  const requiredFields = [
    'identified_product',
    'brand',
    'model',
    'confidence_score'
  ];

  for (const field of requiredFields) {
    if (!data[field] || data[field] === 'Unknown' || data[field] === 'N/A') {
      errors.push(`Missing or invalid required field: ${field}`);
    }
  }

  // Check confidence score
  const confidence = data.confidence_score || 0;
  if (confidence < minConfidence) {
    warnings.push(`Low confidence score: ${confidence}% (threshold: ${minConfidence}%)`);
  }

  // Check for confusion or clarity issues
  if (data.possible_confusion && data.possible_confusion !== 'None') {
    warnings.push(`Possible confusion detected: ${data.possible_confusion}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    missingFields,
    confidence
  };
}

// ═══════════════════════════════════════════════════════════
// MULTIPLE PRODUCT DETECTION
// ═══════════════════════════════════════════════════════════

export interface MultipleProductCheck {
  multiple_detected: boolean;
  error_message?: string;
  details?: any;
}

export function detectMultipleProducts(stage1Data: any): MultipleProductCheck {
  try {
    // Check if model explicitly flagged multiple products
    const possibleConfusion = stage1Data.possible_confusion || '';
    const clarityFeedback = stage1Data.clarity_feedback || '';
    
    // Keywords indicating multiple products
    const multiProductIndicators = [
      'multiple products',
      'different products',
      'two products',
      'several devices',
      'various items'
    ];
    
    const confusionLower = possibleConfusion.toLowerCase();
    const feedbackLower = clarityFeedback.toLowerCase();
    
    for (const indicator of multiProductIndicators) {
      if (confusionLower.includes(indicator) || feedbackLower.includes(indicator)) {
        return {
          multiple_detected: true,
          error_message: 'Multiple products detected in images',
          details: {
            possible_confusion: possibleConfusion,
            clarity_feedback: clarityFeedback
          }
        };
      }
    }
    
    // Check if identified_product contains "and" or multiple items
    const identified = stage1Data.identified_product || '';
    if (identified && (identified.toLowerCase().includes(' and ') || identified.includes(' & '))) {
      return {
        multiple_detected: true,
        error_message: `Multiple products detected: ${identified}`,
        details: { identified_product: identified }
      };
    }
    
    return { multiple_detected: false };
  } catch (error) {
    console.error('Error detecting multiple products:', error);
    return { multiple_detected: false };
  }
}

// ═══════════════════════════════════════════════════════════
// IMAGE CLARITY VALIDATION
// ═══════════════════════════════════════════════════════════

export interface ClarityCheck {
  clear: boolean;
  issues?: string[];
  confidence?: number;
  error_message?: string;
  suggestions?: string[];
}

export function checkImageClarity(stage1Data: any): ClarityCheck {
  try {
    const clarityFeedback = stage1Data.clarity_feedback || '';
    const confidenceScore = stage1Data.confidence_score || 0;
    
    // Keywords indicating unclear images
    const clarityIssues = [
      'blurry', 'unclear', 'poor quality', 'cannot see',
      'not visible', 'too dark', 'too bright', 'obstructed',
      'need better', 'need clearer', 'difficult to identify'
    ];
    
    const feedbackLower = clarityFeedback.toLowerCase();
    const detectedIssues: string[] = [];
    
    for (const issue of clarityIssues) {
      if (feedbackLower.includes(issue)) {
        detectedIssues.push(issue);
      }
    }
    
    // If low confidence or issues detected, images are unclear
    if (confidenceScore < 50 || detectedIssues.length > 0) {
      return {
        clear: false,
        issues: detectedIssues,
        confidence: confidenceScore,
        error_message: 'Images are not clear enough for accurate identification',
        suggestions: [
          'Upload clearer, well-lit photos',
          'Include close-up of product logo/branding',
          'Include screenshot of device settings (for phones/tablets)',
          'Show model number if visible'
        ]
      };
    }
    
    return { clear: true, confidence: confidenceScore };
  } catch (error) {
    console.error('Error checking image clarity:', error);
    return { clear: true }; // Default to true to avoid blocking
  }
}

// ═══════════════════════════════════════════════════════════
// CONFIDENCE THRESHOLD CHECK
// ═══════════════════════════════════════════════════════════

export interface ConfidenceCheck {
  passes: boolean;
  confidence: number;
  required?: number;
  error_message?: string;
  suggestions?: string[];
}

export function checkConfidenceThreshold(
  stage1Data: any,
  minConfidence: number = 50
): ConfidenceCheck {
  try {
    const confidenceScore = stage1Data.confidence_score || 0;
    
    if (confidenceScore < minConfidence) {
      return {
        passes: false,
        confidence: confidenceScore,
        required: minConfidence,
        error_message: `Confidence too low (${confidenceScore}%). Minimum required: ${minConfidence}%`,
        suggestions: [
          'Upload additional clearer images',
          'Provide text description with product details',
          'Include images showing model number or specifications'
        ]
      };
    }
    
    return {
      passes: true,
      confidence: confidenceScore
    };
  } catch (error) {
    console.error('Error checking confidence threshold:', error);
    return { passes: true, confidence: 0 }; // Default to true to avoid blocking
  }
}

// ═══════════════════════════════════════════════════════════
// TEXT-IMAGE CONTRADICTION DETECTION
// ═══════════════════════════════════════════════════════════

export interface ContradictionCheck {
  contradictions_found: boolean;
  message?: string;
  details?: string;
}

export function detectContradictions(stage1Data: any): ContradictionCheck {
  try {
    const imageTextMatch = stage1Data.image_text_match;
    const clarityFeedback = stage1Data.clarity_feedback || '';
    
    if (imageTextMatch === false) {
      return {
        contradictions_found: true,
        message: 'User text contradicts image analysis',
        details: clarityFeedback
      };
    }
    
    // Check clarity feedback for contradiction keywords
    const contradictionKeywords = [
      'contradiction', 'mismatch', 'differs from',
      'inconsistent', 'does not match', 'conflict'
    ];
    
    const feedbackLower = clarityFeedback.toLowerCase();
    
    for (const keyword of contradictionKeywords) {
      if (feedbackLower.includes(keyword)) {
        return {
          contradictions_found: true,
          message: 'Potential contradictions detected',
          details: clarityFeedback
        };
      }
    }
    
    return { contradictions_found: false };
  } catch (error) {
    console.error('Error detecting contradictions:', error);
    return { contradictions_found: false };
  }
}

// ═══════════════════════════════════════════════════════════
// COMPREHENSIVE STAGE 1 VALIDATION
// ═══════════════════════════════════════════════════════════

export interface ComprehensiveValidation {
  valid: boolean;
  errors: Array<{
    type: string;
    message: string;
    details?: any;
  }>;
  suggestions: string[];
  confidence: number;
}

export function validateStage1Comprehensive(
  stage1Data: any,
  minConfidence: number = 50
): ComprehensiveValidation {
  try {
    const errors: Array<{ type: string; message: string; details?: any }> = [];
    const suggestions: string[] = [];
    
    // Check for multiple products
    const multiCheck = detectMultipleProducts(stage1Data);
    if (multiCheck.multiple_detected) {
      errors.push({
        type: 'multiple_products',
        message: multiCheck.error_message || 'Multiple products detected',
        details: multiCheck.details
      });
      suggestions.push('Upload images of only ONE product');
    }
    
    // Check image clarity
    const clarityCheck = checkImageClarity(stage1Data);
    if (!clarityCheck.clear) {
      errors.push({
        type: 'unclear_images',
        message: clarityCheck.error_message || 'Images are unclear',
        details: { issues: clarityCheck.issues }
      });
      if (clarityCheck.suggestions) {
        suggestions.push(...clarityCheck.suggestions);
      }
    }
    
    // Check confidence threshold
    const confidenceCheck = checkConfidenceThreshold(stage1Data, minConfidence);
    if (!confidenceCheck.passes) {
      errors.push({
        type: 'low_confidence',
        message: confidenceCheck.error_message || 'Low confidence',
        details: { confidence: confidenceCheck.confidence }
      });
      if (confidenceCheck.suggestions) {
        suggestions.push(...confidenceCheck.suggestions);
      }
    }
    
    // Check for contradictions
    const contradictionCheck = detectContradictions(stage1Data);
    if (contradictionCheck.contradictions_found) {
      errors.push({
        type: 'text_image_mismatch',
        message: contradictionCheck.message || 'Contradiction detected',
        details: { feedback: contradictionCheck.details }
      });
      suggestions.push('Verify your text description matches the images');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      suggestions: [...new Set(suggestions)], // Remove duplicates
      confidence: stage1Data.confidence_score || 0
    };
  } catch (error) {
    console.error('Error in comprehensive validation:', error);
    return {
      valid: false,
      errors: [{
        type: 'validation_error',
        message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }],
      suggestions: [],
      confidence: 0
    };
  }
}

// ═══════════════════════════════════════════════════════════
// FASHION VALIDATION
// ═══════════════════════════════════════════════════════════

export interface FashionValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingDetails: string[];
  canProceed: boolean;
}

export function validateFashionStage1(
  data: any,
  minConfidence: number = 40
): FashionValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingDetails: string[] = [];
  
  // Check brand (critical)
  if (!data.brand || data.brand === 'Unknown' || data.brand === 'unbranded') {
    errors.push('Brand is required for fashion authentication');
  }
  
  // Check optional but important fields
  const optionalFields = ['size', 'material_composition', 'specific_category', 'color_variants'];
  for (const field of optionalFields) {
    if (!data[field] || data[field] === 'Unknown') {
      missingDetails.push(field);
    }
  }
  
  // Size is often not visible - warn but don't error
  if (missingDetails.includes('size')) {
    warnings.push('Size not detected - this is common if size tag is not visible');
  }
  
  // Check confidence
  const confidence = data.confidence_score || 0;
  if (confidence < minConfidence) {
    warnings.push(`Low confidence score: ${confidence}% (threshold: ${minConfidence}%)`);
  }
  
  // Fashion allows up to 5 missing details
  const canProceed = errors.length === 0 && missingDetails.length <= 5;
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    missingDetails,
    canProceed
  };
}

// ═══════════════════════════════════════════════════════════
// STAGE 1 VALIDATION (FASHION) - LEGACY
// ═══════════════════════════════════════════════════════════

export function validateFashionStage1Response(
  data: any,
  minConfidence: number = FASHION_CONFIG.min_confidence_score
): Stage1Validation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingFields: string[] = [];

  // Required fields for fashion
  const requiredFields = [
    'identified_product',
    'brand',
    'confidence_score'
  ];

  for (const field of requiredFields) {
    if (!data[field] || data[field] === 'Unknown' || data[field] === 'N/A') {
      if (field === 'brand' && !FASHION_CONFIG.allow_missing_brand) {
        errors.push(`Missing critical field: ${field}`);
      } else {
        missingFields.push(field);
      }
    }
  }

  // Check confidence
  const confidence = data.confidence_score || 0;
  if (confidence < minConfidence) {
    warnings.push(`Low confidence score: ${confidence}% (threshold: ${minConfidence}%)`);
  }

  // Check size (allowed to be missing)
  if (!data.size && FASHION_CONFIG.allow_missing_size) {
    warnings.push('Size tag not visible in images');
  }

  // Check gender
  if (data.gender && !FASHION_CONFIG.valid_genders.includes(data.gender.toLowerCase())) {
    warnings.push(`Invalid gender: ${data.gender}`);
  }

  // Count missing details
  const detailFields = ['size', 'material_composition', 'color_variants', 'brand', 'condition_details'];
  const missingCount = detailFields.filter(f => !data[f] || data[f] === 'N/A').length;
  
  if (missingCount > FASHION_CONFIG.max_missing_details_allowed) {
    errors.push(`Too many missing details (${missingCount}/${detailFields.length})`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    missingFields,
    confidence
  };
}

// ═══════════════════════════════════════════════════════════
// BRAND TIER HELPER
// ═══════════════════════════════════════════════════════════

export function getBrandTierContext(stage1Data: any): string | null {
  const brandTier = stage1Data.brand_tier?.toLowerCase();
  
  if (!brandTier) return null;
  
  const contexts: Record<string, string> = {
    'ultra-luxury': '💎 This is an ultra-luxury brand. Authentication is critical due to high counterfeit risk.',
    'luxury': '✨ This is a luxury brand. Careful authentication recommended.',
    'premium designer': '🌟 This is a premium designer brand. Authentication adds value.',
    'fast fashion': '👕 This is a fast fashion brand. Focus on condition over authenticity.',
    'vintage': '🕰️ This is a vintage item. Age and condition are key factors.',
    'unbranded': '📦 This is an unbranded item. Authentication not applicable.'
  };
  
  return contexts[brandTier] || null;
}

// ═══════════════════════════════════════════════════════════
// STAGE 2 VALIDATION (VERIFICATION)
// ═══════════════════════════════════════════════════════════

export interface Stage2Validation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateStage2Response(data: any): Stage2Validation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!data.authenticity_status) {
    errors.push('Missing authenticity_status');
  }

  if (typeof data.verification_confidence !== 'number') {
    errors.push('Missing or invalid verification_confidence');
  }

  if (typeof data.specs_match !== 'boolean') {
    warnings.push('Missing specs_match boolean');
  }

  // Check for warnings
  if (data.authenticity_warnings && Array.isArray(data.authenticity_warnings)) {
    if (data.authenticity_warnings.length > 0) {
      warnings.push(`${data.authenticity_warnings.length} authenticity concern(s) detected`);
    }
  }

  // Check authenticity status
  const validStatuses = ['Authentic', 'Suspicious', 'Unknown', 'Likely Genuine', 'Possible Fake'];
  if (data.authenticity_status && !validStatuses.includes(data.authenticity_status)) {
    warnings.push(`Unusual authenticity status: ${data.authenticity_status}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// ═══════════════════════════════════════════════════════════
// IMAGE VALIDATION
// ═══════════════════════════════════════════════════════════

export interface ImageValidation {
  valid: boolean;
  error?: string;
  message?: string;
}

export function validateUploadedImages(
  images: File[],
  maxImages: number,
  minImages: number,
  maxSizeBytes: number
): ImageValidation {
  if (!images || images.length < minImages) {
    return {
      valid: false,
      error: 'no_images',
      message: `Please upload at least ${minImages} image(s)`
    };
  }

  if (images.length > maxImages) {
    return {
      valid: false,
      error: 'too_many_images',
      message: `Maximum ${maxImages} images allowed. You uploaded ${images.length}.`
    };
  }

  // Check file sizes
  for (const image of images) {
    if (image.size > maxSizeBytes) {
      return {
        valid: false,
        error: 'file_too_large',
        message: `Image "${image.name}" is too large. Maximum size: ${maxSizeBytes / (1024 * 1024)}MB`
      };
    }
  }

  return { valid: true };
}

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Extract summary from product data
 */
export function extractProductSummary(data: any, category: ProductCategory): string {
  if (category === 'electronics') {
    return `${data.brand || 'Unknown'} ${data.model || 'Unknown'} - ${data.storage || 'N/A'} storage, ${data.condition_rating || 'Unknown'} condition`;
  } else if (category === 'fashion') {
    return `${data.brand || 'Unknown'} ${data.identified_product || 'item'} - ${data.color_variants || 'Unknown'} color, ${data.condition_rating || 'Unknown'} condition`;
  } else {
    return `${data.identified_product || 'Unknown product'} - ${data.condition_rating || 'Unknown'} condition`;
  }
}
