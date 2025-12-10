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

  if (data.clarity_feedback && data.clarity_feedback.toLowerCase().includes('unclear')) {
    warnings.push(`Image clarity issue: ${data.clarity_feedback}`);
  }

  // Track missing optional fields
  const optionalFields = ['storage', 'ram', 'processor', 'gpu', 'color_variants'];
  for (const field of optionalFields) {
    if (!data[field] || data[field] === 'N/A' || data[field] === 'Unknown') {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 3) {
    warnings.push(`Many missing fields (${missingFields.length}): ${missingFields.join(', ')}`);
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
// STAGE 1 VALIDATION (FASHION)
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
