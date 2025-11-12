import type { ActionFunctionArgs } from "react-router";
import { getOrm } from "~/lib/server/db";
import { ProductDetection } from "~/lib/server/entities/product-detection.entity";
import { uploadMultipleToS3 } from "~/lib/server/s3";
import { analyzeProductImages } from "~/lib/server/openai";

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
  const files: UploadedFile[] = [];
  let description = '';

  for (const [key, value] of formData.entries()) {
    if (key === 'description' && typeof value === 'string') {
      description = value;
    } else if (key.startsWith('image') && value instanceof File) {
      const arrayBuffer = await value.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      files.push({
        buffer,
        mimeType: value.type || 'image/jpeg',
        filename: value.name,
      });
    }
  }

  return { files, description };
}

/**
 * POST /api/detect
 * Upload 3-5 product images, analyze with OpenAI, and save to database
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Only accept POST requests
    if (request.method !== 'POST') {
      return Response.json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }

    // Parse form data
    const { files, description } = await parseMultipartFormData(request);

    // Validate number of images
    if (files.length < 3 || files.length > 5) {
      return Response.json(
        { 
          error: 'Please upload between 3 and 5 images',
          received: files.length 
        },
        { status: 400 }
      );
    }

    // Validate description
    if (!description || description.trim().length === 0) {
      return Response.json(
        { error: 'Product description is required' },
        { status: 400 }
      );
    }

    // Initialize database
    const orm = await getOrm();
    const em = orm.em.fork();

    // Create initial detection record
    const detection = new ProductDetection();
    detection.inputDescription = description.trim();
    detection.status = 'processing';

    // Upload images to S3
    console.log(`Uploading ${files.length} images to S3...`);
    const uploadResults = await uploadMultipleToS3(
      files.map(f => ({ buffer: f.buffer, mimeType: f.mimeType })),
      'product-detections'
    );

    // Store S3 URLs in the entity
    detection.inputImages = uploadResults.map(r => r.url);

    // Save initial record to database
    await em.persistAndFlush(detection);

    try {
      // Analyze images with OpenAI using the buffers (no need to re-download)
      console.log('Analyzing images with OpenAI...');
      const analysisResult = await analyzeProductImages(
        files.map(f => ({ buffer: f.buffer, mimeType: f.mimeType })),
        description
      );

      // Update detection record with AI results
      detection.identified_product = analysisResult.analysis.identified_product;
      detection.brand = analysisResult.analysis.brand;
      detection.color_variants = analysisResult.analysis.color_variants;
      detection.size = analysisResult.analysis.model_or_series;
      detection.material_composition = ''; // Not in current analysis
      detection.distinctive_features = analysisResult.analysis.distinctive_features;
      detection.possible_confusion = analysisResult.analysis.possible_confusion;
      detection.clarity_feedback = analysisResult.analysis.clarity_feedback;
      detection.short_description = analysisResult.analysis.short_description;
      detection.condition_rating = analysisResult.analysis.condition_rating;
      detection.condition_details = analysisResult.analysis.rating_reason;
      detection.estimated_year = analysisResult.analysis.estimated_year;
      detection.status = 'completed';

      await em.flush();

      return Response.json({
        success: true,
        data: {
          uuid: detection.uuid,
          status: detection.status,
          analysis: analysisResult.analysis,
          summary: analysisResult.summary,
          images: detection.inputImages,
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
          error: 'Failed to analyze images',
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