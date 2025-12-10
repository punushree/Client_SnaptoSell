import { Entity, PrimaryKey, Property, ManyToOne, Index } from "@mikro-orm/core";
import { v4 } from "uuid";
import { ProductDetection } from "./ProductDetection";

/**
 * ProductMetadata Entity
 * Stores flexible key-value product attributes without schema constraints
 * Uses EAV (Entity-Attribute-Value) pattern for maximum flexibility
 */
@Entity()
@Index({ properties: ['detection', 'metadataKey'] }) // Fast lookup by detection + key
export class ProductMetadata {
  @PrimaryKey({ type: "uuid" })
  uuid: string = v4();

  /**
   * Reference to parent ProductDetection
   */
  @ManyToOne(() => ProductDetection)
  detection!: ProductDetection;

  /**
   * Metadata key (e.g., "storage", "ram", "material_composition", "brand_tier")
   * Flexible to accommodate any product attribute
   */
  @Property({ type: "string", length: 100 })
  metadataKey!: string;

  /**
   * Metadata value (stored as text for flexibility)
   * Can store strings, numbers, or JSON for complex values
   */
  @Property({ type: "text" })
  metadataValue!: string;

  /**
   * Value type for proper deserialization
   * - string: plain text
   * - number: numeric value
   * - boolean: true/false
   * - json: complex object/array
   */
  @Property({ type: "string", length: 20, default: "string" })
  valueType: "string" | "number" | "boolean" | "json" = "string";

  /**
   * Category context (helps with querying category-specific attributes)
   */
  @Property({ type: "string", length: 50, nullable: true })
  @Index()
  category?: string; // electronics, fashion, other

  /**
   * Source of this metadata (identification, verification, user_edit, etc.)
   */
  @Property({ type: "string", length: 50, default: "identification" })
  source: string = "identification";

  @Property({ defaultRaw: "CURRENT_TIMESTAMP", onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ defaultRaw: "CURRENT_TIMESTAMP", onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Get properly typed value based on valueType
   */
  getValue(): string | number | boolean | any {
    switch (this.valueType) {
      case "number":
        return parseFloat(this.metadataValue);
      case "boolean":
        return this.metadataValue === "true";
      case "json":
        try {
          return JSON.parse(this.metadataValue);
        } catch {
          return this.metadataValue;
        }
      default:
        return this.metadataValue;
    }
  }

  /**
   * Set value with automatic type detection
   */
  setValue(value: any): void {
    if (typeof value === "number") {
      this.valueType = "number";
      this.metadataValue = value.toString();
    } else if (typeof value === "boolean") {
      this.valueType = "boolean";
      this.metadataValue = value.toString();
    } else if (typeof value === "object" && value !== null) {
      this.valueType = "json";
      this.metadataValue = JSON.stringify(value);
    } else {
      this.valueType = "string";
      this.metadataValue = String(value);
    }
  }
}
