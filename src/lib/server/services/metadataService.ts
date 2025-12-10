/**
 * Product Metadata Service
 * Handles storing and retrieving flexible product metadata
 */

import type { EntityManager } from "@mikro-orm/core";
import { ProductDetection } from "../entities/ProductDetection";
import { ProductMetadata } from "../entities/ProductMetadata";

// ============================================================================
// METADATA STORAGE
// ============================================================================

/**
 * Store AI response metadata in ProductMetadata table
 * Automatically handles any key-value pairs from AI responses
 */
export async function storeProductMetadata(
  em: EntityManager,
  detection: ProductDetection,
  data: Record<string, any>,
  options: {
    category?: string;
    source?: string;
    excludeKeys?: string[];
  } = {}
): Promise<ProductMetadata[]> {
  const {
    category = detection.category,
    source = "identification",
    excludeKeys = []
  } = options;

  // Initialize the metadata collection
  await detection.metadata.init();

  const metadataRecords: ProductMetadata[] = [];

  // Core fields that should stay as columns (not in metadata table)
  const coreFields = [
    'uuid', 'identified_product', 'brand', 'model', 'color_variants',
    'condition_rating', 'confidence_score', 'estimated_year',
    'short_description', 'category', 'categoryConfidence', 'status',
    'authenticity_status', 'verification_confidence', 'specs_match',
    'authenticity_warnings', 'verification_summary',
    'average_price', 'min_price', 'max_price', 'price_currency',
    'ebay_items_count', 'pricing_updated_at', 'estimated_price'
  ];

  for (const [key, value] of Object.entries(data)) {
    // Skip if in core fields, exclude list, or undefined/null/empty
    if (
      coreFields.includes(key) ||
      excludeKeys.includes(key) ||
      value === undefined ||
      value === null ||
      value === ''
    ) {
      continue;
    }

    // Create or update metadata record
    const meta = detection.setMetadataValue(key, value, category, source);
    metadataRecords.push(meta);
  }

  // Persist all metadata
  if (metadataRecords.length > 0) {
    await em.persistAndFlush(metadataRecords);
  }

  return metadataRecords;
}

/**
 * Update existing metadata or add new entries
 */
export async function updateProductMetadata(
  em: EntityManager,
  detection: ProductDetection,
  updates: Record<string, any>,
  source: string = "user_edit"
): Promise<void> {
  await detection.metadata.init();

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === null) continue;
    
    detection.setMetadataValue(key, value, detection.category, source);
  }

  await em.flush();
}

// ============================================================================
// METADATA RETRIEVAL
// ============================================================================

/**
 * Get all metadata for a detection as a flat object
 */
export async function getProductMetadata(
  em: EntityManager,
  detectionUuid: string
): Promise<Record<string, any>> {
  const detection = await em.findOne(ProductDetection, { uuid: detectionUuid }, {
    populate: ['metadata']
  });

  if (!detection) {
    throw new Error('Detection not found');
  }

  const metadataMap: Record<string, any> = {};

  for (const meta of detection.metadata.getItems()) {
    metadataMap[meta.metadataKey] = meta.getValue();
  }

  return metadataMap;
}

/**
 * Get metadata filtered by category
 */
export async function getMetadataByCategory(
  em: EntityManager,
  detectionUuid: string,
  category: string
): Promise<Record<string, any>> {
  const metadata = await em.find(ProductMetadata, {
    detection: { uuid: detectionUuid },
    category
  });

  const metadataMap: Record<string, any> = {};
  for (const meta of metadata) {
    metadataMap[meta.metadataKey] = meta.getValue();
  }

  return metadataMap;
}

/**
 * Get specific metadata value
 */
export async function getMetadataValue(
  em: EntityManager,
  detectionUuid: string,
  key: string
): Promise<any | null> {
  const meta = await em.findOne(ProductMetadata, {
    detection: { uuid: detectionUuid },
    metadataKey: key
  });

  return meta ? meta.getValue() : null;
}

// ============================================================================
// QUERY HELPERS
// ============================================================================

/**
 * Find detections by metadata criteria
 * Example: Find all electronics with storage >= 256GB
 */
export async function findByMetadata(
  em: EntityManager,
  criteria: {
    category?: string;
    metadataKey: string;
    metadataValue: any;
    userId?: string | null;
  }
): Promise<ProductDetection[]> {
  const { category, metadataKey, metadataValue, userId } = criteria;

  // Find metadata records matching criteria
  const metadataRecords = await em.find(ProductMetadata, {
    ...(category && { category }),
    metadataKey,
    metadataValue: String(metadataValue)
  });

  // Get unique detection UUIDs
  const detectionUuids = [...new Set(metadataRecords.map(m => m.detection.uuid))];

  // Fetch detections
  const detections = await em.find(ProductDetection, {
    uuid: { $in: detectionUuids },
    ...(userId && { userId })
  });

  return detections;
}

/**
 * Get metadata summary for a detection (combines core fields + metadata)
 */
export async function getFullProductData(
  em: EntityManager,
  detectionUuid: string
): Promise<Record<string, any>> {
  const detection = await em.findOne(ProductDetection, { uuid: detectionUuid }, {
    populate: ['metadata']
  });

  if (!detection) {
    throw new Error('Detection not found');
  }

  // Combine core fields with metadata
  const result: Record<string, any> = {
    // Core identification
    uuid: detection.uuid,
    category: detection.category,
    categoryConfidence: detection.categoryConfidence,
    brand: detection.brand,
    identified_product: detection.identified_product,
    model: detection.model,
    color_variants: detection.color_variants,
    condition_rating: detection.condition_rating,
    confidence_score: detection.confidence_score,
    estimated_year: detection.estimated_year,
    short_description: detection.short_description,

    // Status
    status: detection.status,
    userConfirmed: detection.userConfirmed,

    // Verification
    authenticity_status: detection.authenticity_status,
    verification_confidence: detection.verification_confidence,
    specs_match: detection.specs_match,

    // Pricing
    average_price: detection.average_price,
    min_price: detection.min_price,
    max_price: detection.max_price,
    price_currency: detection.price_currency,
    estimated_price: detection.estimated_price,

    // Images
    inputImages: detection.inputImages,
    inputDescription: detection.inputDescription,

    // Timestamps
    createdAt: detection.createdAt,
    updatedAt: detection.updatedAt,
  };

  // Add all metadata
  for (const meta of detection.metadata.getItems()) {
    result[meta.metadataKey] = meta.getValue();
  }

  return result;
}

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

/**
 * Migrate legacy column data to metadata table
 * Run this once to move data from old columns to new structure
 */
export async function migrateLegacyData(
  em: EntityManager,
  detectionUuid: string
): Promise<void> {
  const detection = await em.findOne(ProductDetection, { uuid: detectionUuid });
  
  if (!detection) {
    throw new Error('Detection not found');
  }

  const legacyData: Record<string, any> = {};

  // Collect all legacy field values
  if (detection.storage) legacyData.storage = detection.storage;
  if (detection.ram) legacyData.ram = detection.ram;
  if (detection.processor) legacyData.processor = detection.processor;
  if (detection.gpu) legacyData.gpu = detection.gpu;
  if (detection.carrier) legacyData.carrier = detection.carrier;
  if (detection.connectivity) legacyData.connectivity = detection.connectivity;
  if (detection.size) legacyData.size = detection.size;
  if (detection.material_composition) legacyData.material_composition = detection.material_composition;
  if (detection.distinctive_features) legacyData.distinctive_features = detection.distinctive_features;
  if (detection.possible_confusion) legacyData.possible_confusion = detection.possible_confusion;
  if (detection.clarity_feedback) legacyData.clarity_feedback = detection.clarity_feedback;
  if (detection.condition_details) legacyData.condition_details = detection.condition_details;
  if (detection.model_variant) legacyData.model_variant = detection.model_variant;

  // Store in metadata table
  await storeProductMetadata(em, detection, legacyData, {
    source: 'migration',
    category: detection.category
  });

  console.log(`Migrated ${Object.keys(legacyData).length} fields for detection ${detectionUuid}`);
}

/**
 * Batch migrate all existing detections
 */
export async function migrateAllLegacyData(em: EntityManager): Promise<void> {
  const detections = await em.find(ProductDetection, {});
  
  console.log(`Starting migration for ${detections.length} detections...`);
  
  let migrated = 0;
  for (const detection of detections) {
    try {
      await migrateLegacyData(em, detection.uuid);
      migrated++;
      
      if (migrated % 100 === 0) {
        console.log(`Migrated ${migrated}/${detections.length} detections`);
      }
    } catch (error) {
      console.error(`Failed to migrate detection ${detection.uuid}:`, error);
    }
  }
  
  console.log(`✅ Migration complete: ${migrated}/${detections.length} detections migrated`);
}
