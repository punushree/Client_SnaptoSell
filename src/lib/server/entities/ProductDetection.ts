import { Entity, PrimaryKey, Property, OneToMany, Collection, Index } from "@mikro-orm/core";
import { v4 } from "uuid";
import { ProductMetadata } from "./ProductMetadata";

@Entity()
@Index({ properties: ['category', 'brand', 'createdAt'] })
@Index({ properties: ['userId', 'status'] })
@Index({ properties: ['status', 'createdAt'] })
export class ProductDetection {
  @PrimaryKey({ type: "uuid" })
  uuid: string = v4();

  @Property({ type: "json" })
  inputImages: string[] = [];

  @Property({ type: "text" })
  inputDescription!: string;

  // ============================================================================
  // CORE PRODUCT FIELDS (Indexed for search/filter)
  // ============================================================================

  @Property({ type: "string", length: 100, nullable: true })
  category?: string; // "electronics" | "fashion" | "other"

  @Property({ type: "integer", nullable: true })
  categoryConfidence?: number;

  @Property({ type: "string", length: 255, nullable: true })
  brand?: string;

  @Property({ type: "string", length: 500, nullable: true })
  identified_product?: string;

  @Property({ type: "string", length: 255, nullable: true })
  model?: string;

  @Property({ type: "string", length: 500, nullable: true })
  color_variants?: string;

  @Property({ type: "string", length: 50, nullable: true })
  condition_rating?: string;

  @Property({ type: "string", length: 20, nullable: true })
  product_condition?: string; // "new" | "used"

  @Property({ type: "integer", nullable: true })
  confidence_score?: number;

  @Property({ type: "string", length: 100, nullable: true })
  estimated_year?: string;

  @Property({ type: "text", nullable: true })
  short_description?: string;

  // ============================================================================
  // PRODUCT METADATA (Flexible key-value in separate table)
  // ============================================================================

  /**
   * Product metadata stored in separate ProductMetadata table
   * Allows unlimited attributes without schema changes
   */
  @OneToMany(() => ProductMetadata, metadata => metadata.detection, { eager: false })
  metadata = new Collection<ProductMetadata>(this);

  // ============================================================================
  // LEGACY FIELDS (Keep for backward compatibility, will be migrated)
  // ============================================================================

  @Property({ type: "text", nullable: true })
  size?: string;

  @Property({ type: "text", nullable: true })
  material_composition?: string;

  @Property({ type: "text", nullable: true })
  distinctive_features?: string;

  @Property({ type: "text", nullable: true })
  possible_confusion?: string;

  @Property({ type: "text", nullable: true })
  clarity_feedback?: string;

  @Property({ type: "text", nullable: true })
  condition_details?: string;

  @Property({ type: "text", nullable: true })
  storage?: string;

  @Property({ type: "text", nullable: true })
  ram?: string;

  @Property({ type: "text", nullable: true })
  processor?: string;

  @Property({ type: "text", nullable: true })
  gpu?: string;

  @Property({ type: "text", nullable: true })
  carrier?: string;

  @Property({ type: "text", nullable: true })
  connectivity?: string;

  @Property({ type: "text", nullable: true })
  model_variant?: string;

  // ============================================================================
  // VERIFICATION DATA
  // ============================================================================

  @Property({ type: "string", nullable: true })
  authenticity_status?: string;

  @Property({ type: "integer", nullable: true })
  verification_confidence?: number;

  @Property({ type: "boolean", nullable: true })
  specs_match?: boolean;

  @Property({ type: "text", nullable: true })
  authenticity_warnings?: string; // JSON string array

  @Property({ type: "text", nullable: true })
  verification_summary?: string;

  // ============================================================================
  // PRICING DATA
  // ============================================================================

  @Property({ type: "float", nullable: true })
  average_price?: number;

  @Property({ type: "float", nullable: true })
  min_price?: number;

  @Property({ type: "float", nullable: true })
  max_price?: number;

  @Property({ type: "string", nullable: true, default: "USD" })
  price_currency?: string;

  @Property({ type: "integer", nullable: true })
  ebay_items_count?: number;

  @Property({ type: "datetime", nullable: true })
  pricing_updated_at?: Date;

  @Property({ type: "text", nullable: true })
  estimated_price?: string;

  // ============================================================================
  // STATUS & WORKFLOW
  // ============================================================================

  @Property({ type: "string", length: 50, default: "pending" })
  status: "pending" | "processing" | "completed" | "failed" | "category_detected" | "identified" | "verified" = "pending";

  @Property({ type: "text", nullable: true })
  errorMessage?: string;

  @Property({ type: "boolean", default: false })
  userConfirmed: boolean = false;

  @Property({ type: "datetime", nullable: true })
  confirmedAt?: Date;

  // ============================================================================
  // OWNERSHIP & TIMESTAMPS
  // ============================================================================

  @Property({
    fieldName: "userId",
    type: "string",
    length: 36,
    nullable: true,
    columnType: "varchar(36)",
  })
  userId?: string | null;

  @Property({ defaultRaw: "CURRENT_TIMESTAMP", onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ defaultRaw: "CURRENT_TIMESTAMP", onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Get all metadata as a key-value object
   */
  async getMetadataMap(): Promise<Record<string, any>> {
    await this.metadata.init();
    const map: Record<string, any> = {};
    for (const meta of this.metadata.getItems()) {
      map[meta.metadataKey] = meta.getValue();
    }
    return map;
  }

  /**
   * Get specific metadata value
   */
  async getMetadataValue(key: string): Promise<any | null> {
    await this.metadata.init();
    const meta = this.metadata.getItems().find(m => m.metadataKey === key);
    return meta ? meta.getValue() : null;
  }

  /**
   * Set or update a metadata value
   */
  setMetadataValue(key: string, value: any, category?: string, source: string = "identification"): ProductMetadata {
    const existing = this.metadata.getItems().find(m => m.metadataKey === key);
    
    if (existing) {
      existing.setValue(value);
      existing.updatedAt = new Date();
      return existing;
    } else {
      const newMeta = new ProductMetadata();
      newMeta.detection = this;
      newMeta.metadataKey = key;
      newMeta.setValue(value);
      newMeta.category = category;
      newMeta.source = source;
      this.metadata.add(newMeta);
      return newMeta;
    }
  }

  /**
   * Set multiple metadata values at once
   */
  setMetadataFromObject(data: Record<string, any>, category?: string, source: string = "identification"): void {
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        this.setMetadataValue(key, value, category, source);
      }
    });
  }
}

