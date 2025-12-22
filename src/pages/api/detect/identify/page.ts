/**
 * Product Identification API Endpoint
 * Stage 1: Identify product details and extract specifications
 * Matches Python backend stage1_identification.py structure
 */

import type { ActionFunctionArgs } from "react-router";
import { getOrm } from "@/lib/server/db";
import { ProductDetection } from "@/lib/server/entities/ProductDetection";
import { getOpenAIClient } from "@/lib/server/utils/openaiClient";
import { validateStage1Comprehensive, validateFashionStage1, extractProductSummary } from "@/lib/server/utils/validators";
import { TimeTracker } from "@/lib/server/utils/timeTracker";
import { getStage1Prompt } from "@/lib/server/prompts";
import { getReasoningLevel, getVerbosityLevel, isWebSearchEnabled, getMinConfidence } from "@/config/analyzer.config";
import type { ProductCategory } from "@/config/analyzer.config";
import { storeProductMetadata } from "@/lib/server/services/metadataService";

/**
 * POST /api/detect/identify
 * Identify product from already uploaded images
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== 'POST') {
    return Response.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  }

  try {
    const body = await request.json();
    const { uuid, category, userText } = body;

    if (!uuid) {
      return Response.json(
        { error: 'UUID is required' },
        { status: 400 }
      );
    }

    if (!category) {
      return Response.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    // Initialize database
    const orm = await getOrm();
    const em = orm.em.fork();

    // Find detection record
    const detection = await em.findOne(ProductDetection, { uuid });

    if (!detection) {
      return Response.json(
        { error: 'Detection record not found' },
        { status: 404 }
      );
    }

    // Get image URLs from detection record
    const imageUrls = detection.inputImages || [];

    if (imageUrls.length === 0) {
      return Response.json(
        { error: 'No images found for this detection' },
        { status: 400 }
      );
    }

    const tracker = new TimeTracker(`Stage 1 - ${category} Identification`, true);
    tracker.start();

    try {
      // Get category-specific prompt
      const basePrompt = getStage1Prompt(category);
      const userDescription = userText || detection.inputDescription || '';
      
      // Prepare prompt with user text if available
      const prompt = userDescription 
        ? `${basePrompt}\n\nUSER PROVIDED TEXT: "${userDescription}"`
        : basePrompt;

      console.log(`Using prompt for ${category} identification`);

      // Call OpenAI API with config-driven settings
      const stageKey = category === 'fashion' ? 'fashion_stage1' : 
                       category === 'other' ? 'other_stage1' : 'stage1';
      
      const client = getOpenAIClient();
      const response = await client.callAndParse({
        prompt,
        imageDataUris: imageUrls, // Already S3 URLs
        userText: userDescription,
        webSearch: isWebSearchEnabled(stageKey as any),
        reasoningEffort: getReasoningLevel(stageKey as any),
        verbosity: getVerbosityLevel(stageKey as any),
        maxTokens: 2000, // GPT-5 needs tokens for reasoning + output
        temperature: 0.1
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Identification failed');
      }

      const identificationResult = response.data;
      const executionTime = tracker.stop();

      // Run comprehensive validation
      const minConfidence = getMinConfidence(category as ProductCategory);
      const validation = category === 'fashion'
        ? validateFashionStage1(identificationResult, minConfidence)
        : validateStage1Comprehensive(identificationResult, minConfidence);

      // If validation fails, log warnings but still save data and return for retry modal
      // This matches Python backend behavior where validation failures show retry option
      if (!validation.valid) {
        console.warn('Identification validation warnings:', validation.errors);
        console.warn('Proceeding to save data and show retry modal to user');
      }

      // Extract summary
      const summary = extractProductSummary(identificationResult, category as ProductCategory);
      console.log(`✅ Product identified: ${summary} (confidence: ${identificationResult.confidence_score}%) in ${executionTime.toFixed(2)}s`);

      // Update core fields in detection record
      Object.assign(detection, {
        identified_product: identificationResult.identified_product,
        brand: identificationResult.brand,
        model: identificationResult.model,
        color_variants: identificationResult.color_variants,
        condition_rating: identificationResult.condition_rating,
        confidence_score: identificationResult.confidence_score,
        estimated_year: identificationResult.estimated_year,
        short_description: identificationResult.short_description,
        status: 'identified' as const,
        updatedAt: new Date()
      });

      await em.flush();

      // Store ALL other attributes in metadata table
      // This includes storage, ram, processor, size, material_composition, etc.
      // No need to know the schema - any AI response field goes to metadata
      await storeProductMetadata(em, detection, identificationResult, {
        category,
        source: 'identification'
      });

      console.log(`Stored ${Object.keys(identificationResult).length} metadata fields`);

      return Response.json({
        success: true,
        data: {
          uuid: detection.uuid,
          identification: identificationResult,
          validation,
          summary,
          executionTime
        },
      });

    } catch (error) {
      const executionTime = tracker.stopWithError(error as Error);
      
      detection.status = 'failed';
      detection.errorMessage = error instanceof Error ? error.message : 'Identification failed';
      await em.flush();

      console.error(`❌ Identification failed after ${executionTime.toFixed(2)}s:`, error);

      return Response.json(
        {
          success: false,
          error: 'Product identification failed',
          details: detection.errorMessage,
          executionTime
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('API Error:', error);
    
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
