/**
 * Product Detection Confirmation API Endpoint
 * 
 * Handles user confirmation of detected product information and allows updates
 * POST /api/detect/confirm
 */

import type { ActionFunctionArgs } from "react-router";
import { getOrm } from "@/lib/server/db";
import { ProductDetection } from "@/lib/server/entities/ProductDetection";
import { getCurrentUserId } from "@/lib/server/auth/getSession";
import { updateProductMetadata, getFullProductData } from "@/lib/server/services/metadataService";

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
    estimated_price?: string;
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
    // Get current user ID from session (optional for confirmation)
    // Guest users can confirm their detections too
    const userId = await getCurrentUserId(request);

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
    // If user is authenticated, only find detections that belong to them
    // If user is not authenticated (guest), allow access to any detection with null userId
    // (Guests can confirm their own detections using the UUID)
    let detection;
    
    if (userId) {
      // Authenticated user: only allow access to their own detections
      detection = await em.findOne(ProductDetection, { 
        uuid: uuid,
        userId: userId
      });
    } else {
      // Guest user: allow access to guest detections (userId is null)
      // Use the provided UUID to find the detection
      detection = await em.findOne(ProductDetection, { 
        uuid: uuid,
        userId: null
      });
    }
    
    if (!detection) {
      return Response.json(
        { error: 'Product detection not found or you do not have permission to access it.' },
        { status: 404 }
      );
    }

    // Update confirmation status
    detection.userConfirmed = isCorrect;
    detection.confirmedAt = new Date();
    
    // Set status to completed after confirmation
    detection.status = 'completed';

    // If user confirmed and provided updated data, update the detection record
    if (isCorrect && updatedData) {
      // Define which fields are core (stored in product_detection table)
      const coreFields = ['identified_product', 'brand', 'model', 'color_variants', 'condition_rating', 'product_condition', 'estimated_year', 'short_description'];
      
      // Define which fields are metadata (stored in product_metadata table)
      const metadataFields = ['storage', 'ram', 'processor', 'gpu', 'size', 'model_variant', 'carrier', 'connectivity', 'estimated_price', 'material_composition'];
      
      // Update core fields in detection entity
      const coreUpdates: any = {};
      coreFields.forEach(field => {
        if (updatedData[field as keyof typeof updatedData]) {
          const value = updatedData[field as keyof typeof updatedData];
          coreUpdates[field] = typeof value === 'string' ? value.trim() : value;
        }
      });
      Object.assign(detection, coreUpdates);
      
      // Update metadata fields in product_metadata table
      const metadataUpdates: any = {};
      metadataFields.forEach(field => {
        if (updatedData[field as keyof typeof updatedData]) {
          const value = updatedData[field as keyof typeof updatedData];
          metadataUpdates[field] = typeof value === 'string' ? value.trim() : value;
        }
      });
      
      if (Object.keys(metadataUpdates).length > 0) {
        await updateProductMetadata(em, detection, metadataUpdates, 'user_edit');
      }
    }

    // If user disagreed, still save the record but mark it differently
    if (!isCorrect && updatedData) {
      // User corrected the information
      // Define which fields are core (stored in product_detection table)
      const coreFields = ['identified_product', 'brand', 'model', 'color_variants', 'condition_rating', 'product_condition', 'estimated_year', 'short_description'];
      
      // Define which fields are metadata (stored in product_metadata table)
      const metadataFields = ['storage', 'ram', 'processor', 'gpu', 'size', 'model_variant', 'carrier', 'connectivity', 'estimated_price', 'material_composition'];
      
      // Update core fields in detection entity
      const coreUpdates: any = {};
      coreFields.forEach(field => {
        if (updatedData[field as keyof typeof updatedData]) {
          const value = updatedData[field as keyof typeof updatedData];
          coreUpdates[field] = typeof value === 'string' ? value.trim() : value;
        }
      });
      Object.assign(detection, coreUpdates);
      
      // Update metadata fields in product_metadata table
      const metadataUpdates: any = {};
      metadataFields.forEach(field => {
        if (updatedData[field as keyof typeof updatedData]) {
          const value = updatedData[field as keyof typeof updatedData];
          metadataUpdates[field] = typeof value === 'string' ? value.trim() : value;
        }
      });
      
      if (Object.keys(metadataUpdates).length > 0) {
        await updateProductMetadata(em, detection, metadataUpdates, 'user_edit');
      }
    }

    // Save the updated record
    await em.flush();

    // Get complete product data (core + metadata) for response
    const fullProductData = await getFullProductData(em, uuid);

    return Response.json({
      success: true,
      message: isCorrect 
        ? 'Product information confirmed successfully' 
        : 'Product information updated successfully',
      data: {
        ...fullProductData,
        userConfirmed: detection.userConfirmed,
        confirmedAt: detection.confirmedAt,
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
