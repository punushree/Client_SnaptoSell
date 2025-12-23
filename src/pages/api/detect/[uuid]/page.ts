/**
 * GET /api/detect/[uuid]
 * 
 * Returns a single product detection by UUID with complete metadata
 * Only returns the detection if it belongs to the currently logged-in user
 */

import type { LoaderFunctionArgs } from "react-router";
import { getOrm } from "@/lib/server/db";
import { ProductDetection } from "@/lib/server/entities/ProductDetection";
import { getCurrentUserId } from "@/lib/server/auth/getSession";
import { getFullProductData } from "@/lib/server/services/metadataService";

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

    // Find the detection (verify ownership)
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

    // Get full product data including all metadata
    const fullData = await getFullProductData(em, uuid);

    // Add additional product-specific fields only if they don't already exist in fullData
    // This prevents overwriting metadata with null entity values
    const completeData = {
      ...fullData,
      // Only add entity fields if they don't exist in metadata
      ...(detection.size && !fullData.size && { size: detection.size }),
      ...(detection.material_composition && !fullData.material_composition && { material_composition: detection.material_composition }),
      ...(detection.storage && !fullData.storage && { storage: detection.storage }),
      ...(detection.ram && !fullData.ram && { ram: detection.ram }),
      ...(detection.processor && !fullData.processor && { processor: detection.processor }),
      ...(detection.gpu && !fullData.gpu && { gpu: detection.gpu }),
      ...(detection.carrier && !fullData.carrier && { carrier: detection.carrier }),
      ...(detection.connectivity && !fullData.connectivity && { connectivity: detection.connectivity }),
      ...(detection.distinctive_features && !fullData.distinctive_features && { distinctive_features: detection.distinctive_features }),
      ...(detection.possible_confusion && !fullData.possible_confusion && { possible_confusion: detection.possible_confusion }),
      ...(detection.clarity_feedback && !fullData.clarity_feedback && { clarity_feedback: detection.clarity_feedback }),
      ...(detection.condition_details && !fullData.condition_details && { condition_details: detection.condition_details }),
      ...(detection.model_variant && !fullData.model_variant && { model_variant: detection.model_variant }),
      // Always include these user/system fields
      userConfirmed: detection.userConfirmed,
      confirmedAt: detection.confirmedAt,
      errorMessage: detection.errorMessage,
    };

    // Return the detection data with all metadata
    return Response.json({
      success: true,
      data: completeData,
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

