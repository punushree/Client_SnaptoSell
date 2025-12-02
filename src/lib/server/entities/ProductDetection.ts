import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { v4 } from "uuid";

@Entity()
export class ProductDetection {
  @PrimaryKey({ type: "uuid" })
  uuid: string = v4();

  @Property({ type: "json" })
  inputImages: string[] = [];

  @Property({ type: "text" })
  inputDescription!: string;

  @Property({ type: "text", nullable: true })
  identified_product?: string;

  @Property({ type: "text", nullable: true })
  brand?: string;

  @Property({ type: "text", nullable: true })
  color_variants?: string;

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
  short_description?: string;

  @Property({ type: "float", nullable: true })
  condition_rating?: string;

  @Property({ type: "text", nullable: true })
  condition_details?: string;

  @Property({ type: "text", nullable: true })
  estimated_year?: string;

  @Property({ type: "string", default: "pending" })
  status: "pending" | "processing" | "completed" | "failed" = "pending";

  @Property({ type: "text", nullable: true })
  errorMessage?: string;

  @Property({ type: "boolean", default: false })
  userConfirmed: boolean = false;

  @Property({ type: "datetime", nullable: true })
  confirmedAt?: Date;

  @Property({ defaultRaw: "CURRENT_TIMESTAMP", onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ defaultRaw: "CURRENT_TIMESTAMP", onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ type: "text", nullable: true })
  storage?: string;

  @Property({ type: "text", nullable: true })
  model?: string;

  @Property({ type: "text", nullable: true })
  model_variant?: string;

  @Property({ type: "text", nullable: true })
  carrier?: string;

  @Property({ type: "text", nullable: true })
  connectivity?: string;

  @Property({ type: "text", nullable: true })
  ram?: string;

  @Property({ type: "text", nullable: true })
  processor?: string;

  @Property({ type: "text", nullable: true })
  gpu?: string;

  @Property({ type: "text", nullable: true })
  estimated_price?: string;

  @Property({ type: "integer", nullable: true })
  confidence_score?: number;

  @Property({
    fieldName: "userId",
    type: "string",
    length: 36,
    nullable: true,
    columnType: "varchar(36)",
  })
  userId?: string | null;

  // Pricing fields
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
}
