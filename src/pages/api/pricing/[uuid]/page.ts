/**
 * GET /api/pricing/[uuid]
 * 
 * Returns pricing information for a product detection by UUID
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
        { error: 'Product UUID is required' },
        { status: 400 }
      );
    }

    // Initialize database
    const orm = await getOrm();
    const em = orm.em.fork();

    // Find the detection
    let detection;
    
    if (userId) {
      // Authenticated user: only find detections that belong to the user
      detection = await em.findOne(ProductDetection, { 
        uuid: uuid,
        userId: userId
      });
    } else {
      // Guest user: allow access to guest detections (userId is null)
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

    // Return pricing data
    return Response.json({
      success: true,
      data: {
        uuid: detection.uuid,
        average_price: detection.average_price,
        min_price: detection.min_price,
        max_price: detection.max_price,
        price_currency: detection.price_currency || 'USD',
        ebay_items_count: detection.ebay_items_count,
        pricing_updated_at: detection.pricing_updated_at,
        has_pricing: detection.average_price !== null && detection.average_price !== undefined,
      },
    });

  } catch (error) {
    console.error('Get Pricing API Error:', error);
    
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

