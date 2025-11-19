/**
 * Product Detection Confirmation API Endpoint
 * 
 * Handles user confirmation of detected product information and allows updates
 * POST /api/detect/confirm
 */

import type { ActionFunctionArgs } from "react-router";
import { getOrm } from "@/lib/server/db";
import { ProductDetection } from "@/lib/server/entities/ProductDetection";

interface ConfirmationRequest {
  uuid: string;
  isCorrect: boolean;
  updatedData?: {
    identified_product?: string;
    brand?: string;
    color_variants?: string;
    size?: string;
    condition_rating?: string;
    estimated_year?: string;
    short_description?: string;
    storage?: string;
    model?: string;
    model_variant?: string;
    carrier?: string;
    connectivity?: string;

    ram?: string;
    processor?: string;
    gpu?: string;
  };
}

export const action = async ({ request }: ActionFunctionArgs) => {
  // Only accept POST requests
  if (request.method !== 'POST') {
    return Response.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  }

  try {
    // Parse request body
    const body: ConfirmationRequest = await request.json();
    const { uuid, isCorrect, updatedData } = body;

    // Validate required fields
    if (!uuid) {
      return Response.json(
        { error: 'Product UUID is required' },
        { status: 400 }
      );
    }

    if (typeof isCorrect !== 'boolean') {
      return Response.json(
        { error: 'isCorrect field is required and must be a boolean' },
        { status: 400 }
      );
    }

    // Initialize database
    const orm = await getOrm();
    const em = orm.em.fork();

    // Find the product detection record
    const detection = await em.findOne(ProductDetection, { uuid });
    if (!detection) {
      return Response.json(
        { error: 'Product detection not found' },
        { status: 404 }
      );
    }

    // Update confirmation status
    detection.userConfirmed = isCorrect;
    detection.confirmedAt = new Date();

    // If user confirmed and provided updated data, update the detection record
    if (isCorrect && updatedData) {
      if (updatedData.identified_product) {
        detection.identified_product = updatedData.identified_product.trim();
      }
      if (updatedData.brand) {
        detection.brand = updatedData.brand.trim();
      }
      if (updatedData.color_variants) {
        detection.color_variants = updatedData.color_variants.trim();
      }
      if (updatedData.size) {
        detection.size = updatedData.size.trim();
      }
      if (updatedData.condition_rating !== undefined && updatedData.condition_rating !== null) {
        detection.condition_rating = updatedData.condition_rating;
      }
      if (updatedData.estimated_year) {
        detection.estimated_year = updatedData.estimated_year.trim();
      }
      if (updatedData.short_description) {
        detection.short_description = updatedData.short_description.trim();
      }
      if (updatedData.storage) {
        detection.storage = updatedData.storage.trim();
      }

      if (updatedData.ram) {
        detection.storage = updatedData.ram.trim();
      }
      if (updatedData.processor) {
        detection.storage = updatedData.processor.trim();
      }
      if (updatedData.gpu) {
        detection.storage = updatedData.gpu.trim();
      }

      if (updatedData.model) {
        detection.model = updatedData.model.trim();
      }
      if (updatedData.model_variant) {
        detection.model_variant = updatedData.model_variant.trim();
      }
      if (updatedData.carrier) {
        detection.carrier = updatedData.carrier.trim();
      }
      if (updatedData.connectivity) {
        detection.connectivity = updatedData.connectivity.trim();
      }
    }

    // If user disagreed, still save the record but mark it differently
    if (!isCorrect && updatedData) {
      // User corrected the information
      if (updatedData.identified_product) {
        detection.identified_product = updatedData.identified_product.trim();
      }
      if (updatedData.brand) {
        detection.brand = updatedData.brand.trim();
      }
      if (updatedData.color_variants) {
        detection.color_variants = updatedData.color_variants.trim();
      }
      if (updatedData.size) {
        detection.size = updatedData.size.trim();
      }
      if (updatedData.condition_rating !== undefined && updatedData.condition_rating !== null) {
        detection.condition_rating = updatedData.condition_rating;
      }
      if (updatedData.estimated_year) {
        detection.estimated_year = updatedData.estimated_year.trim();
      }
      if (updatedData.short_description) {
        detection.short_description = updatedData.short_description.trim();
      }
      if (updatedData.storage) {
        detection.storage = updatedData.storage.trim();
      }
      if (updatedData.ram) {
        detection.storage = updatedData.ram.trim();
      }
      if (updatedData.processor) {
        detection.storage = updatedData.processor.trim();
      }
      if (updatedData.gpu) {
        detection.storage = updatedData.gpu.trim();
      }
      if (updatedData.model) {
        detection.model = updatedData.model.trim();
      }
      if (updatedData.model_variant) {
        detection.model_variant = updatedData.model_variant.trim();
      }
      if (updatedData.carrier) {
        detection.carrier = updatedData.carrier.trim();
      }
      if (updatedData.connectivity) {
        detection.connectivity = updatedData.connectivity.trim();
      }
    }

    // Save the updated record
    await em.flush();

    return Response.json({
      success: true,
      message: isCorrect 
        ? 'Product information confirmed successfully' 
        : 'Product information updated successfully',
      data: {
        uuid: detection.uuid,
        userConfirmed: detection.userConfirmed,
        confirmedAt: detection.confirmedAt,
        identified_product: detection.identified_product,
        brand: detection.brand,
        color_variants: detection.color_variants,
        size: detection.size,
        condition_rating: detection.condition_rating,
        estimated_year: detection.estimated_year,
        short_description: detection.short_description,
         storage: detection.storage,
        model: detection.model,
        model_variant: detection.model_variant,
        carrier: detection.carrier,
        connectivity: detection.connectivity,
         ram: detection.ram,
         processor: detection.processor,
         gpu: detection.gpu,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Confirmation API Error:', error);
    
    return Response.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};
