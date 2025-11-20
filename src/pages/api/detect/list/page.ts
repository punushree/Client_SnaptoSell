/**
 * GET /api/detect/list
 * 
 * Returns all product detections for the currently logged-in user
 * Only returns detections that belong to the authenticated user
 */

import type { LoaderFunctionArgs } from "react-router";
import { getOrm } from "@/lib/server/db";
import { ProductDetection } from "@/lib/server/entities/ProductDetection";
import { getCurrentUserId } from "@/lib/server/auth/getSession";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Only accept GET requests
  if (request.method !== 'GET') {
    return Response.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  }

  try {
    // Get current user ID from session
    const userId = await getCurrentUserId(request);
    
    if (!userId) {
      return Response.json(
        { error: 'Authentication required. Please sign in to view your detections.' },
        { status: 401 }
      );
    }

    // Initialize database
    const orm = await getOrm();
    const em = orm.em.fork();

    // Find all detections for this user, ordered by most recent first
    const detections = await em.find(
      ProductDetection,
      { userId: userId },
      { 
        orderBy: { createdAt: 'DESC' },
        limit: 100 // Limit to prevent excessive data transfer
      }
    );

    // Return only necessary fields (exclude sensitive data if any)
    const detectionsData = detections.map(detection => ({
      uuid: detection.uuid,
      status: detection.status,
      inputDescription: detection.inputDescription,
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
      userConfirmed: detection.userConfirmed,
      confirmedAt: detection.confirmedAt,
      createdAt: detection.createdAt,
      updatedAt: detection.updatedAt,
      // Include image URLs so users can see their uploaded images
      inputImages: detection.inputImages || [],
      imageCount: detection.inputImages?.length || 0,
    }));

    return Response.json({
      success: true,
      data: detectionsData,
      count: detectionsData.length,
    });

  } catch (error) {
    console.error('List API Error:', error);
    
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

