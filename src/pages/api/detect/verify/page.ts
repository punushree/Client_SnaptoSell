/**
 * Product Verification API Endpoint
 * Stage 2: Verify product authenticity and specifications
 * Matches Python backend stage2_verification.py structure
 */

import type { ActionFunctionArgs } from "react-router";
import { getOrm } from "@/lib/server/db";
import { ProductDetection } from "@/lib/server/entities/ProductDetection";
import { getOpenAIClient } from "@/lib/server/utils/openaiClient";
import { validateStage2Response } from "@/lib/server/utils/validators";
import { TimeTracker } from "@/lib/server/utils/timeTracker";
import { getStage2Prompt } from "@/lib/server/prompts";
import { getReasoningLevel, getVerbosityLevel, isWebSearchEnabled } from "@/config/analyzer.config";
import { getFullProductData, storeProductMetadata } from "@/lib/server/services/metadataService";

/**
 * POST /api/detect/verify
 * Verify product authenticity and specs using web search
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
    const { uuid, category } = body;

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

    // Get complete product data (core fields + metadata)
    const stage1Data = await getFullProductData(em, uuid);
    
    if (!stage1Data) {
      return Response.json(
        { error: 'Product data not found' },
        { status: 404 }
      );
    }

    const tracker = new TimeTracker(`Stage 2 - ${category} Verification`, true);
    tracker.start();

    try {
      // Get verification prompt
      const prompt = getStage2Prompt(stage1Data, category);
      
      console.log(`Starting ${category} verification with web search enabled`);

      // Call OpenAI API with config-driven settings
      const stageKey = category === 'fashion' ? 'fashion_stage2' : 'stage2';
      
      const client = getOpenAIClient();
      const response = await client.callAndParse<{
        authenticity_status?: string; // Fashion category
        verification_status?: string; // Electronics/other categories
        verification_confidence: number;
        specs_match: boolean;
        authenticity_warnings?: string[];
        warnings?: string[]; // Electronics uses "warnings" instead of "authenticity_warnings"
        verification_summary?: string;
        authentication_summary?: string;
      }>({
        prompt,
        webSearch: isWebSearchEnabled(stageKey as any),
        reasoningEffort: getReasoningLevel(stageKey as any),
        verbosity: getVerbosityLevel(stageKey as any),
        maxTokens: 5000, // High limit: GPT-5 needs tokens for reasoning + output
        temperature: 0.2
      });

      console.log('Verification API response:', {
        success: response.success,
        hasData: !!response.data,
        error: response.error,
        message: response.message,
        executionTime: response.executionTime
      });

      if (!response.success || !response.data) {
        const errorMsg = response.message || 'Empty response from OpenAI';
        console.error('Verification API call failed:', errorMsg);
        throw new Error(errorMsg);
      }

      const verificationResult = response.data;
      const executionTime = response.executionTime || 0;

      // Validate response structure
      const validation = validateStage2Response(verificationResult);

      if (!validation.valid) {
        console.error('Verification validation failed:', validation.errors);
        console.warn('Proceeding despite validation errors');
      }

      if (validation.warnings.length > 0) {
        console.warn('Verification warnings:', validation.warnings);
      }

      console.log(`✅ Verification complete: ${verificationResult.authenticity_status || verificationResult.verification_status} (${verificationResult.verification_confidence}% confidence) in ${executionTime.toFixed(2)}s`);

      // Update detection record with verification data (core fields)
      // Handle both authenticity_status (fashion) and verification_status (electronics)
      Object.assign(detection, {
        authenticity_status: verificationResult.authenticity_status || verificationResult.verification_status,
        verification_confidence: verificationResult.verification_confidence,
        specs_match: verificationResult.specs_match,
        authenticity_warnings: JSON.stringify(verificationResult.authenticity_warnings || verificationResult.warnings || []),
        verification_summary: verificationResult.verification_summary || verificationResult.authentication_summary,
        status: 'verified' as const,
        updatedAt: new Date()
      });

      await em.flush();

      // Store any additional verification metadata
      // Extract verification-specific fields that aren't core fields
      const verificationMetadata: Record<string, any> = {};
      const coreVerificationFields = [
        'authenticity_status', 
        'verification_status', // Electronics category uses this
        'verification_confidence', 
        'specs_match', 
        'authenticity_warnings', 
        'warnings', // Electronics uses this
        'verification_summary',
        'authentication_summary', // Fashion uses this
      ];
      
      Object.keys(verificationResult).forEach(key => {
        if (!coreVerificationFields.includes(key)) {
          verificationMetadata[key] = (verificationResult as any)[key];
        }
      });

      if (Object.keys(verificationMetadata).length > 0) {
        await storeProductMetadata(em, detection, verificationMetadata, {
          category,
          source: 'verification'
        });
      }

      return Response.json({
        success: true,
        data: {
          uuid: detection.uuid,
          verification: verificationResult,
          validation,
          executionTime
        },
      });

    } catch (error) {
      const executionTime = tracker.stopWithError(error as Error);
      
      detection.status = 'failed';
      detection.errorMessage = error instanceof Error ? error.message : 'Verification failed';
      await em.flush();

      console.error(`❌ Verification failed after ${executionTime.toFixed(2)}s:`, error);

      return Response.json(
        {
          success: false,
          error: 'Product verification failed',
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
