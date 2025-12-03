/**
 * Product Detection API Endpoint
 * 
 * Performance Optimizations Applied:
 * 1. Parallel file buffer processing during form data parsing
 * 2. Early validation (fail-fast before expensive operations)
 * 3. File data prepared once and reused (avoid redundant mapping)
 * 4. S3 upload and OpenAI analysis run in parallel (Promise.allSettled)
 * 5. Single database flush operation for all updates
 * 6. Batch property assignment using Object.assign
 * 7. String trimming done once and reused
 */

import type { ActionFunctionArgs } from "react-router";
import { getOrm } from "@/lib/server/db";
import { ProductDetection } from "@/lib/server/entities/ProductDetection";
import { uploadMultipleToS3 } from "@/lib/server/s3";
import { analyzeProductImages } from "@/lib/server/openai";
import { getCurrentUserId } from "@/lib/server/auth/getSession";

interface UploadedFile {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}

/**
 * Parse multipart/form-data to extract files and text fields
 * Optimized: Process file buffers in parallel
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
      // Process file buffers in parallel instead of sequentially
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
 * POST /api/detect
 * Upload 3-5 product images, analyze with OpenAI, and save to database
 * Optimized for speed with parallel processing and minimal redundant operations
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  // Only accept POST requests (fast fail)
  if (request.method !== 'POST') {
    return Response.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  }

  try {
    // Get current user ID from session (optional - allows guest submissions)
    const userId = await getCurrentUserId(request);
    // Note: userId can be null for unauthenticated users - they can still submit images

    // Parse form data
    const { files, description } = await parseMultipartFormData(request);

    // Early validation (fail fast before expensive operations)
    const trimmedDescription = description.trim();
    
    if (files.length < 3 || files.length > 5) {
      return Response.json(
        { 
          error: 'Please upload between 3 and 5 images',
          received: files.length 
        },
        { status: 400 }
      );
    }

    if (!trimmedDescription) {
      return Response.json(
        { error: 'Product description is required' },
        { status: 400 }
      );
    }

    // Optimize: Prepare file data once for reuse
    const fileData = files.map(f => ({ buffer: f.buffer, mimeType: f.mimeType }));

    // Initialize database connection
    const orm = await getOrm();
    const em = orm.em.fork();

    // Create initial detection record with user ID (if authenticated)
    // userId can be null for guest submissions - explicitly set to null for guests
    const detection = em.create(ProductDetection, {
      inputDescription: trimmedDescription,
      status: 'pending' as const,
      inputImages: [] as string[],
      userConfirmed: false,
      userId: userId ?? null, // Use null for guest users (not undefined)
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Save initial record to database
    await em.persistAndFlush(detection);

    try {
      // Run S3 upload and OpenAI analysis in parallel
      console.log('Running S3 upload and OpenAI analysis in parallel...');
      const results = await Promise.allSettled([
        uploadMultipleToS3(fileData, 'product-detections'),
        analyzeProductImages(fileData, trimmedDescription)
      ]);

      // Check if S3 upload succeeded
      if (results[0].status === 'rejected') {
        throw new Error(`S3 upload failed: ${results[0].reason}`);
      }

      // Check if OpenAI analysis succeeded
      if (results[1].status === 'rejected') {
        throw new Error(``);
        // throw new Error(`OpenAI analysis failed: ${results[1].reason}`);
      }

      const [s3UploadResults, analysisResult] = [results[0].value, results[1].value];

      // Batch update: Store S3 URLs and AI results in one operation
      Object.assign(detection, {
        inputImages: s3UploadResults.map(r => r.url),
        identified_product: analysisResult.analysis.identified_product,
        brand: analysisResult.analysis.brand,
        color_variants: analysisResult.analysis.color_variants,
        size: analysisResult.analysis.size,
        material_composition: analysisResult.analysis.material_composition,
        distinctive_features: analysisResult.analysis.distinctive_features,
        possible_confusion: analysisResult.analysis.possible_confusion,
        clarity_feedback: analysisResult.analysis.clarity_feedback,
        short_description: analysisResult.analysis.short_description,
        condition_rating: analysisResult.analysis.condition_rating,
        condition_details: analysisResult.analysis.condition_details,
        estimated_year: analysisResult.analysis.estimated_year,
        model : analysisResult.analysis.model,
        model_variant : analysisResult.analysis.model_variant,
        storage : analysisResult.analysis.storage,
        carrier : analysisResult.analysis.carrier,
        connectivity :analysisResult.analysis.connectivity,
        ram :analysisResult.analysis.ram,
        processor : analysisResult.analysis.processor,
        gpu : analysisResult.analysis.gpu,
        estimated_price: analysisResult.analysis.estimated_price,
        status: 'completed' as const
      });

      // Single database flush for all updates
      await em.flush();

      return Response.json({
        success: true,
        data: {
          uuid: detection.uuid,
          status: detection.status,
          analysis: analysisResult.analysis,
          summary: analysisResult.summary,
          images: detection.inputImages,
          // Note: userId is not returned for security, but it's stored in the database
        },
      });

    } catch (analysisError) {
      // Update status to failed if analysis fails
      detection.status = 'failed';
      detection.errorMessage = analysisError instanceof Error 
        ? analysisError.message 
        : 'Unknown error during analysis';
      
      await em.flush();

      console.error('Analysis error:', analysisError);

      return Response.json(
        {
          success: false,
          error: "We're still working on identification for these items - please double check the results. Please upload only smartphones, laptops and tablets.",
          details: detection.errorMessage,
          uuid: detection.uuid,
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