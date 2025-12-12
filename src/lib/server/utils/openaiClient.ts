/**
 * OpenAI API Client
 * Matches Python backend api_client.py structure
 */

import OpenAI from 'openai';
import type { ReasoningEffort, VerbosityLevel } from '../../../config/analyzer.config';
import { TimeTracker } from './timeTracker';
import { parseJsonSafe } from './jsonParser';

export interface APICallOptions {
  prompt: string;
  imageDataUris?: string[];
  userText?: string;
  webSearch?: boolean;
  reasoningEffort?: ReasoningEffort;
  verbosity?: VerbosityLevel;
  maxRetries?: number;
  maxTokens?: number;
  temperature?: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  executionTime?: number;
  rawResponse?: any;
}

/**
 * OpenAI Client with retry logic and error handling
 */
export class OpenAIClient {
  private client: OpenAI;
  private model: string = 'gpt-5.1-2025-11-13'; // GPT-5 with vision and web search (matches Python app)

  constructor(apiKey?: string) {
    const key = apiKey || process.env.OPENAI_API_KEY;
    
    if (!key) {
      throw new Error('OpenAI API key not found. Set OPENAI_API_KEY in environment variables');
    }
    
    this.client = new OpenAI({ apiKey: key });
    console.log(`OpenAI client initialized with model: ${this.model}`);
  }

  /**
   * Make API call with images
   * Matches Python backend call_with_images() method
   */
  async callWithImages<T = any>(options: APICallOptions): Promise<APIResponse<T>> {
    const {
      prompt,
      imageDataUris = [],
      userText,
      webSearch = false,
      reasoningEffort = 'medium',
      verbosity = 'low',
      maxRetries = 2,
      maxTokens = 1500, // Reduced default for faster responses
      temperature = 0.2,
    } = options;

    const tracker = new TimeTracker('API Call', true);
    tracker.start();

    // Build content blocks
    const contentBlocks: OpenAI.Chat.ChatCompletionContentPart[] = [
      { type: 'text', text: prompt }
    ];

    // Add user text if provided
    if (userText && userText.trim()) {
      contentBlocks.push({
        type: 'text',
        text: `\n\nUSER PROVIDED TEXT: "${userText}"`
      });
    }

    // Add images
    for (const dataUri of imageDataUris) {
      contentBlocks.push({
        type: 'image_url',
        image_url: { url: dataUri }
      });
    }

    // Attempt API call with retries
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`API call attempt ${attempt + 1}/${maxRetries + 1}`);
        console.log(`Reasoning: ${reasoningEffort}, Verbosity: ${verbosity}, Web search: ${webSearch}`);

        const response = await this.client.chat.completions.create({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: contentBlocks
            }
          ],
          max_completion_tokens: maxTokens, // Changed from max_tokens for GPT-5 compatibility
          temperature,
          // Note: reasoning_effort and web_search are not standard OpenAI params
          // They're used in the Python backend's custom API wrapper
          // For now, we'll use standard OpenAI parameters
        });

        // Debug logging for response structure
        console.log('OpenAI Response:', JSON.stringify({
          choices: response.choices?.length,
          hasMessage: !!response.choices?.[0]?.message,
          hasContent: !!response.choices?.[0]?.message?.content,
          contentLength: response.choices?.[0]?.message?.content?.length,
          finishReason: response.choices?.[0]?.finish_reason
        }, null, 2));

        const outputText = response.choices[0]?.message?.content?.trim() || '';

        if (!outputText) {
          console.error('Empty response details:', {
            fullResponse: JSON.stringify(response, null, 2)
          });
          throw new Error('Empty response from OpenAI');
        }

        const executionTime = tracker.stop();
        console.log('API call successful');

        return {
          success: true,
          data: outputText as T,
          executionTime,
          rawResponse: response
        };

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`API call attempt ${attempt + 1} failed:`, errorMsg);

        // If this was the last attempt, return error
        if (attempt === maxRetries) {
          const executionTime = tracker.stopWithError(error as Error);
          return {
            success: false,
            error: 'api_error',
            message: errorMsg,
            executionTime
          };
        }

        // Wait before retrying (exponential backoff)
        const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`Retrying in ${waitTime / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // Should never reach here
    const executionTime = tracker.getElapsed();
    return {
      success: false,
      error: 'max_retries_exceeded',
      message: 'Maximum retry attempts exceeded',
      executionTime
    };
  }

  /**
   * Parse JSON response from API
   */
  parseJsonResponse<T = any>(responseText: string): T {
    return parseJsonSafe<T>(responseText);
  }

  /**
   * Call API and parse JSON response
   */
  async callAndParse<T = any>(options: APICallOptions): Promise<APIResponse<T>> {
    const response = await this.callWithImages<string>(options);

    if (!response.success || !response.data) {
      return response as APIResponse<T>;
    }

    try {
      const parsed = this.parseJsonResponse<T>(response.data);
      return {
        success: true,
        data: parsed,
        executionTime: response.executionTime,
        rawResponse: response.rawResponse
      };
    } catch (error) {
      console.error('JSON parse error:', error);
      console.error('Raw response (first 500 chars):', response.data.substring(0, 500));
      return {
        success: false,
        error: 'json_parse_error',
        message: 'Failed to parse JSON response',
        executionTime: response.executionTime
      };
    }
  }
}

/**
 * Singleton instance
 */
let clientInstance: OpenAIClient | null = null;

export function getOpenAIClient(): OpenAIClient {
  if (!clientInstance) {
    clientInstance = new OpenAIClient();
  }
  return clientInstance;
}
