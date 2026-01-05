/**
 * Combined Category + Identification API Endpoint
 * Optimized single endpoint for faster processing
 * Combines Stage 0 (category detection) and Stage 1 (identification) into one call
 */

import type { ActionFunctionArgs } from "react-router";
import { getOrm } from "@/lib/server/db";
import { ProductDetection } from "@/lib/server/entities/ProductDetection";
import { uploadMultipleToS3 } from "@/lib/server/s3";
import { getCurrentUserId } from "@/lib/server/auth/getSession";
import { getOpenAIClient } from "@/lib/server/utils/openaiClient";
import { validateCategoryResponse, validateStage1Comprehensive, validateFashionStage1, extractProductSummary } from "@/lib/server/utils/validators";
import { TimeTracker } from "@/lib/server/utils/timeTracker";
import { getStage1Prompt } from "@/lib/server/prompts";
import { getReasoningLevel, getVerbosityLevel, isWebSearchEnabled, getMinConfidence } from "@/config/analyzer.config";
import type { ProductCategory } from "@/config/analyzer.config";
import { storeProductMetadata } from "@/lib/server/services/metadataService";

interface UploadedFile {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}

/**
 * Parse multipart/form-data to extract files and text fields
 */
async function parseMultipartFormData(request: Request): Promise<{
  files: UploadedFile[];
  description: string;
}> {
  const formData = await request.formData();
  const filePromises: Promise<UploadedFile>[] = [];
  let description = '';

  for (const [key, value] of formData.entries()) {
    if (key === 'description' && typeof value === 'string') {
      description = value;
    } else if (key.startsWith('image') && value instanceof File) {
      filePromises.push(
        value.arrayBuffer().then(arrayBuffer => ({
          buffer: Buffer.from(arrayBuffer),
          mimeType: value.type || 'image/webp',
          filename: value.name,
        }))
      );
    }
  }

  const files = await Promise.all(filePromises);
  return { files, description };
}

/**
 * POST /api/detect/analyze
 * Combined endpoint: Upload images, detect category, and identify product in one call
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== 'POST') {
    return Response.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  }

  try {
    const userId = await getCurrentUserId(request);
    const { files, description } = await parseMultipartFormData(request);

    // Validation
    const trimmedDescription = description.trim();
    
    if (files.length < 1 || files.length > 5) {
      return Response.json(
        { 
          error: 'Please upload between 1 and 5 images',
          received: files.length 
        },
        { status: 400 }
      );
    }

    // Prepare file data
    const fileData = files.map(f => ({ buffer: f.buffer, mimeType: f.mimeType }));

    // Initialize database
    const orm = await getOrm();
    const em = orm.em.fork();

    // Create initial detection record
    const detection = em.create(ProductDetection, {
      inputDescription: trimmedDescription || 'Product analysis',
      status: 'pending' as const,
      inputImages: [] as string[],
      userConfirmed: false,
      userId: userId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await em.persistAndFlush(detection);

    const tracker = new TimeTracker('Combined Analysis (Category + Identification)', true);
    tracker.start();

    try {
      // Upload images to S3 first
      const s3UploadResults = await uploadMultipleToS3(fileData, 'product-detections');

      // Convert buffers to data URIs for OpenAI
      const imageDataUris = fileData.map(f => {
        const base64 = f.buffer.toString('base64');
        return `data:${f.mimeType};base64,${base64}`;
      });

      // STEP 1: Category Detection
      const categoryPrompt = `You are a product category classifier for a multi-category resale marketplace.

Your ONLY task is to determine the PRIMARY product category from the uploaded images.

CATEGORIES:
1. **electronics** - smartphones, laptops, tablets, cameras, headphones, smartwatches, gaming consoles, TVs, monitors, drones, e-readers, etc.
2. **fashion** - clothing, footwear, bags, accessories, jewelry, watches (fashion/luxury), sunglasses, belts, hats, scarves, etc.
3. **other** - furniture, home decor, books, toys, sports equipment, kitchen items, tools, collectibles, art, etc.

CLASSIFICATION RULES:
- If image shows a phone, computer, or electronic device → "electronics"
- If image shows clothing, shoes, bags, or fashion items → "fashion"
- If image shows anything else → "other"
- If multiple items from DIFFERENT categories → choose the PRIMARY/LARGEST item
- If uncertain between categories → use "other"

${trimmedDescription ? `USER PROVIDED TEXT: "${trimmedDescription}"` : ''}

OUTPUT FORMAT (JSON only, no markdown):
{
  "category": "electronics" | "fashion" | "other",
  "confidence_score": 0-100,
  "detected_product_type": "brief description of what you see",
  "reasoning": "1-2 sentences explaining classification"
}`;

      // Call OpenAI for category detection
      const client = getOpenAIClient();
      const categoryResponse = await client.callAndParse<{
        category: string;
        confidence_score: number;
        detected_product_type: string;
        reasoning: string;
      }>({
        prompt: categoryPrompt,
        imageDataUris,
        userText: trimmedDescription,
        webSearch: isWebSearchEnabled('stage0'),
        reasoningEffort: getReasoningLevel('stage0'),
        verbosity: getVerbosityLevel('stage0'),
        maxTokens: 1500,
        temperature: 0.1
      });

      if (!categoryResponse.success || !categoryResponse.data) {
        throw new Error(categoryResponse.message || 'Category detection failed');
      }

      const categoryResult = categoryResponse.data;

      // Validate category response
      const categoryValidation = validateCategoryResponse(categoryResult);
      if (!categoryValidation.valid) {
        console.error('Category validation failed:', categoryValidation.errors);
        throw new Error(`Validation failed: ${categoryValidation.errors.join(', ')}`);
      }

      // Ensure category is valid
      const validCategories = ['electronics', 'fashion', 'other'];
      if (!validCategories.includes(categoryResult.category)) {
        console.warn(`Invalid category "${categoryResult.category}", defaulting to "other"`);
        categoryResult.category = 'other';
      }

      console.log(`✅ Category detected: ${categoryResult.category} (${categoryResult.confidence_score}% confidence)`);

      // STEP 2: Product Identification (using detected category)
      const category = categoryResult.category;
      const basePrompt = getStage1Prompt(category);
      const userDescription = trimmedDescription || '';
      
      const identPrompt = userDescription 
        ? `${basePrompt}\n\nUSER PROVIDED TEXT: "${userDescription}"`
        : basePrompt;

      const stageKey = category === 'fashion' ? 'fashion_stage1' : 
                       category === 'other' ? 'other_stage1' : 'stage1';

      const identResponse = await client.callAndParse({
        prompt: identPrompt,
        imageDataUris: s3UploadResults.map(r => r.url), // Use S3 URLs for identification
        userText: userDescription,
        webSearch: isWebSearchEnabled(stageKey as any),
        reasoningEffort: getReasoningLevel(stageKey as any),
        verbosity: getVerbosityLevel(stageKey as any),
        maxTokens: 2000,
        temperature: 0.1
      });

      if (!identResponse.success || !identResponse.data) {
        throw new Error(identResponse.message || 'Identification failed');
      }

      const identificationResult = identResponse.data;
      const executionTime = tracker.stop();

      // Run comprehensive validation
      const minConfidence = getMinConfidence(category as ProductCategory);
      const validation = category === 'fashion'
        ? validateFashionStage1(identificationResult, minConfidence)
        : validateStage1Comprehensive(identificationResult, minConfidence);

      if (!validation.valid) {
        console.warn('Identification validation warnings:', validation.errors);
        console.warn('Proceeding to save data and show retry modal to user');
      }

      // Extract summary
      const summary = extractProductSummary(identificationResult, category as ProductCategory);
      console.log(`✅ Product identified: ${summary} (confidence: ${identificationResult.confidence_score}%) in ${executionTime.toFixed(2)}s`);

      // Update detection record with all data
      Object.assign(detection, {
        inputImages: s3UploadResults.map(r => r.url),
        category: categoryResult.category,
        categoryConfidence: categoryResult.confidence_score,
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

      // Store metadata
      await storeProductMetadata(em, detection, identificationResult, {
        category,
        source: 'identification'
      });

      return Response.json({
        success: true,
        data: {
          uuid: detection.uuid,
          categoryData: categoryResult,
          identification: identificationResult,
          images: detection.inputImages,
          validation,
          executionTime
        },
      });

    } catch (error) {
      const executionTime = tracker.stopWithError(error as Error);
      
      detection.status = 'failed';
      detection.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await em.flush();

      console.error(`❌ Combined analysis failed after ${executionTime.toFixed(2)}s:`, error);

      return Response.json(
        {
          success: false,
          error: 'Analysis failed',
          details: detection.errorMessage,
          uuid: detection.uuid,
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
