/**
 * POST /api/pricing/process
 * 
 * Processes product pricing by fetching from eBay API and storing results
 */

import type { ActionFunctionArgs } from "react-router";
import { getOrm } from "@/lib/server/db";
import { ProductDetection } from "@/lib/server/entities/ProductDetection";
import { getCurrentUserId } from "@/lib/server/auth/getSession";
import { EbayAPIService } from "@/lib/server/services/ebayApiService";

// Ensure environment variables are loaded

interface ProcessPricingRequest {
  uuid: string;
}

export const loader = () => {
  console.log(process.env);
return {}
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
    // Get current user ID from session (optional)
    const userId = await getCurrentUserId(request);

    // Parse request body
    const body: ProcessPricingRequest = await request.json();
    const { uuid } = body;

    // Validate required fields
    if (!uuid) {
      return Response.json(
        { error: 'Product UUID is required' },
        { status: 400 }
      );
    }

    // Initialize database
    const orm = await getOrm();
    const em = orm.em.fork();

    // Find the product detection record
    let detection;
    
    if (userId) {
      // Authenticated user: only allow access to their own detections
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
        { error: 'Product detection not found or you do not have permission to access it.' },
        { status: 404 }
      );
    }

    // Check if product has required data
    if (!detection.identified_product || detection.status !== 'completed') {
      return Response.json(
        { error: 'Product detection must be completed before pricing can be calculated.' },
        { status: 400 }
      );
    }

    // Initialize eBay API service (uses OAuth2 refresh token flow)
    let ebayService: EbayAPIService;
    try {
      ebayService = new EbayAPIService();
    } catch (error) {
      console.error('Failed to initialize eBay API service:', error);
      return Response.json(
        {
          success: false,
          error: 'Failed to initialize eBay API service',
          details: error instanceof Error ? error.message : 'Unknown error. Please ensure EBAY_CLIENT_ID, EBAY_CLIENT_SECRET, and EBAY_REFRESH_TOKEN are set in your .env file.'
        },
        { status: 500 }
      );
    }

    // Prepare product data - include all relevant fields for search query
    const productData = {
      uuid: detection.uuid,
      identified_product: detection.identified_product,
      brand: detection.brand,
      model: detection.model,
      model_variant: detection.model_variant,
      storage: detection.storage,
      size: detection.size,
      color_variants: detection.color_variants,
      condition_rating: detection.condition_rating,
    };

    console.log('Processing pricing for product:', {
      identified_product: productData.identified_product,
      brand: productData.brand,
      model: productData.model,
      storage: productData.storage,
    });

    // Process product pricing
    const result = await ebayService.processProduct(productData);

    if (!result.success) {
      // Check if it's an authentication error (401)
      const isAuthError = result.error?.includes('401') || result.error?.toLowerCase().includes('unauthorized') || result.error?.toLowerCase().includes('oauth');
      
      return Response.json(
        {
          success: false,
          error: isAuthError 
            ? 'eBay API authentication failed. Please check your eBay OAuth2 credentials.'
            : result.error || 'Failed to process pricing',
          details: isAuthError
            ? 'Failed to authenticate with eBay API. Please verify that EBAY_CLIENT_ID, EBAY_CLIENT_SECRET, and EBAY_REFRESH_TOKEN are correctly set in your .env file.'
            : undefined,
          data: {
            uuid: detection.uuid,
            search_query: result.search_query,
          }
        },
        { status: isAuthError ? 401 : 500 }
      );
    }

    // Update detection with pricing data
    detection.average_price = result.price_statistics.average_price;
    detection.min_price = result.price_statistics.min_price;
    detection.max_price = result.price_statistics.max_price;
    detection.price_currency = result.price_statistics.currency;
    detection.ebay_items_count = result.ebay_items_count;
    detection.pricing_updated_at = new Date();

    // Save the updated record
    await em.flush();

    return Response.json({
      success: true,
      message: 'Pricing calculated and saved successfully',
      data: {
        uuid: detection.uuid,
        search_query: result.search_query,
        price_statistics: result.price_statistics,
        ebay_items_count: result.ebay_items_count,
        average_price: detection.average_price,
        min_price: detection.min_price,
        max_price: detection.max_price,
        price_currency: detection.price_currency,
        pricing_updated_at: detection.pricing_updated_at,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Process Pricing API Error:', error);
    
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

