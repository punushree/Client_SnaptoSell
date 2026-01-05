/**
 * POST /api/pricing/analyze
 * 
 * AI-powered marketplace pricing analysis using web search
 * Matches Python backend's Stage 3 pricing approach
 */

import type { ActionFunctionArgs } from "react-router";
import { getOrm } from "@/lib/server/db";
import { ProductDetection } from "@/lib/server/entities/ProductDetection";
import { getCurrentUserId } from "@/lib/server/auth/getSession";
import { getOpenAIClient } from "@/lib/server/utils/openaiClient";
import { getStage3Prompt } from "@/lib/server/prompts";
import { getFullProductData, storeProductMetadata } from "@/lib/server/services/metadataService";
import { TimeTracker } from "@/lib/server/utils/timeTracker";

interface PricingAnalyzeRequest {
  uuid: string;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== 'POST') {
    return Response.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  }

  const tracker = new TimeTracker('AI Pricing Analysis', true);
  tracker.start();

  try {
    const userId = await getCurrentUserId(request);
    const body: PricingAnalyzeRequest = await request.json();
    const { uuid } = body;

    if (!uuid) {
      return Response.json(
        { error: 'Product UUID is required' },
        { status: 400 }
      );
    }

    const orm = await getOrm();
    const em = orm.em.fork();

    // Find detection record
    let detection;
    if (userId) {
      detection = await em.findOne(ProductDetection, { 
        uuid: uuid,
        userId: userId
      });
    } else {
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

    // Note: We allow pricing to run in parallel with verification for speed
    // Status check removed to enable parallel execution
    
    // Get full product data including metadata
    const fullProductData = await getFullProductData(em, detection.uuid);

    // Get stage 1 and stage 2 data
    const stage1Data = {
      identified_product: detection.identified_product,
      brand: detection.brand,
      model: detection.model,
      specific_category: fullProductData.specific_category || fullProductData.identified_product,
      size: fullProductData.size,
      condition_rating: detection.condition_rating,
      ...fullProductData
    };

    const stage2Data = {
      authenticity_status: detection.authenticity_status,
      verification_confidence: detection.verification_confidence,
      ...fullProductData
    };

    console.log('Starting AI pricing analysis with web search...');

    // Get pricing prompt
    const prompt = getStage3Prompt(stage1Data, stage2Data, detection.category || 'other');

    // Call OpenAI with optimized settings for speed
    const client = getOpenAIClient();
    const response = await client.callAndParse<any>({
      prompt,
      webSearch: true, // Enable web search for marketplace pricing
      reasoningEffort: 'low',
      verbosity: 'low',
      maxTokens: 3000, // GPT-5 needs tokens for reasoning + web search results + output
      temperature: 0.1
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || 'AI pricing analysis failed');
    }

    const pricingResult = response.data;
    const executionTime = tracker.stop();

    console.log(`✅ AI pricing analysis complete in ${executionTime.toFixed(2)}s`);

    // Store ALL pricing data to database for future reference
    await storeProductMetadata(em, detection, pricingResult, {
      category: detection.category || 'other',
      source: 'pricing'
    });

    // Update detection with AI pricing summary
    detection.status = 'completed' as const;
    detection.updatedAt = new Date();

    await em.flush();

    return Response.json({
      success: true,
      message: 'AI pricing analysis completed successfully',
      data: {
        uuid: detection.uuid,
        pricing: pricingResult,
        executionTime,
        analysis_type: 'ai_marketplace_search'
      },
    }, { status: 200 });

  } catch (error) {
    const executionTime = tracker.stopWithError(error as Error);
    console.error(`❌ AI pricing analysis failed after ${executionTime.toFixed(2)}s:`, error);
    
    return Response.json(
      {
        success: false,
        error: 'AI pricing analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        executionTime
      },
      { status: 500 }
    );
  }
};
