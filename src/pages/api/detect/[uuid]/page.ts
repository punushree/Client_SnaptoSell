/**
 * GET /api/detect/[uuid]
 * 
 * Returns a single product detection by UUID
 * Only returns the detection if it belongs to the currently logged-in user
 */

import type { LoaderFunctionArgs } from "react-router";
import { getOrm } from "@/lib/server/db";
import { ProductDetection } from "@/lib/server/entities/ProductDetection";
import { getCurrentUserId } from "@/lib/server/auth/getSession";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  // Only accept GET requests
  if (request.method !== 'GET') {
    return Response.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  }

  try {
    // Get current user ID from session (optional for guest users)
    const userId = await getCurrentUserId(request);

    // Get UUID from route params
    const uuid = params?.uuid;
    
    if (!uuid) {
      return Response.json(
        { error: 'Detection UUID is required' },
        { status: 400 }
      );
    }

    // Initialize database
    const orm = await getOrm();
    const em = orm.em.fork();

    // Find the detection
    // If authenticated: only find detections that belong to the user
    // If guest: allow access to guest detections (userId is null)
    let detection;
    
    if (userId) {
      // Authenticated user: only allow access to their own detections
      detection = await em.findOne(ProductDetection, { 
        uuid: uuid,
        userId: userId
      });
    } else {
      // Guest user: allow access to guest detections
      detection = await em.findOne(ProductDetection, { 
        uuid: uuid,
        userId: null
      });
    }

    if (!detection) {
      return Response.json(
        { error: 'Product detection not found or you do not have permission to view it.' },
        { status: 404 }
      );
    }

    // Return the detection data with all images
    return Response.json({
      success: true,
      data: {
        uuid: detection.uuid,
        status: detection.status,
        inputDescription: detection.inputDescription,
        inputImages: detection.inputImages || [],
        identified_product: detection.identified_product,
        brand: detection.brand,
        color_variants: detection.color_variants,
        size: detection.size,
        material_composition: detection.material_composition,
        distinctive_features: detection.distinctive_features,
        possible_confusion: detection.possible_confusion,
        clarity_feedback: detection.clarity_feedback,
        condition_rating: detection.condition_rating,
        condition_details: detection.condition_details,
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
        userConfirmed: detection.userConfirmed,
        confirmedAt: detection.confirmedAt,
        errorMessage: detection.errorMessage,
        createdAt: detection.createdAt,
        updatedAt: detection.updatedAt,
      },
    });

  } catch (error) {
    console.error('Get Detection API Error:', error);
    
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

