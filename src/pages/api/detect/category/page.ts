/**
 * Category Detection API Endpoint
 * Stage 0: Detect if product is electronics, fashion, or other
 * Matches Python backend stage0_category_detection.py structure
 */

import type { ActionFunctionArgs } from "react-router";
import { getOrm } from "@/lib/server/db";
import { ProductDetection } from "@/lib/server/entities/ProductDetection";
import { uploadMultipleToS3 } from "@/lib/server/s3";
import { getCurrentUserId } from "@/lib/server/auth/getSession";
import { getOpenAIClient } from "@/lib/server/utils/openaiClient";
import { validateCategoryResponse } from "@/lib/server/utils/validators";
import { TimeTracker } from "@/lib/server/utils/timeTracker";
import { getReasoningLevel, getVerbosityLevel, isWebSearchEnabled } from "@/config/analyzer.config";

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
          mimeType: value.type || 'image/jpeg',
          filename: value.name,
        }))
      );
    }
  }

  const files = await Promise.all(filePromises);
  return { files, description };
}

/**
 * POST /api/detect/category
 * Upload images and detect product category (electronics/fashion/other)
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
      inputDescription: trimmedDescription || 'Category detection',
      status: 'pending' as const,
      inputImages: [] as string[],
      userConfirmed: false,
      userId: userId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await em.persistAndFlush(detection);

    const tracker = new TimeTracker('Category Detection', true);
    tracker.start();

    try {
      // Upload images to S3 first
      const s3UploadResults = await uploadMultipleToS3(fileData, 'product-detections');

      // Convert buffers to data URIs for OpenAI
      const imageDataUris = fileData.map(f => {
        const base64 = f.buffer.toString('base64');
        return `data:${f.mimeType};base64,${base64}`;
      });

      // Category detection prompt
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

      // Call OpenAI API
      const client = getOpenAIClient();
      const response = await client.callAndParse<{
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
        maxTokens: 1500, // GPT-5 needs tokens for reasoning + output
        temperature: 0.1
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Category detection failed');
      }

      const categoryResult = response.data;
      const executionTime = tracker.stop();

      // Validate response
      const validation = validateCategoryResponse(categoryResult);
      
      if (!validation.valid) {
        console.error('Category validation failed:', validation.errors);
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      if (validation.warnings.length > 0) {
        console.warn('Category validation warnings:', validation.warnings);
      }

      // Ensure category is valid
      const validCategories = ['electronics', 'fashion', 'other'];
      if (!validCategories.includes(categoryResult.category)) {
        console.warn(`Invalid category "${categoryResult.category}", defaulting to "other"`);
        categoryResult.category = 'other';
      }

      // Update detection record
      Object.assign(detection, {
        inputImages: s3UploadResults.map(r => r.url),
        category: categoryResult.category,
        categoryConfidence: categoryResult.confidence_score,
        status: 'category_detected' as const,
        updatedAt: new Date()
      });

      await em.flush();

      console.log(`✅ Category detected: ${categoryResult.category} (${categoryResult.confidence_score}% confidence) in ${executionTime.toFixed(2)}s`);

      return Response.json({
        success: true,
        data: {
          uuid: detection.uuid,
          category: categoryResult.category,
          categoryData: categoryResult,
          images: detection.inputImages,
          executionTime
        },
      });

    } catch (error) {
      const executionTime = tracker.stopWithError(error as Error);
      
      detection.status = 'failed';
      detection.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await em.flush();

      console.error(`❌ Category detection failed after ${executionTime.toFixed(2)}s:`, error);

      return Response.json(
        {
          success: false,
          error: 'Category detection failed',
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
