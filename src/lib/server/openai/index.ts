import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ProductAnalysisResult {
  identified_product: string;
  brand: string;
  color_variants: string;
  model_or_series: string;
  distinctive_features: string;
  possible_confusion: string;
  clarity_feedback: string;
  short_description: string;
  condition_rating: number;
  rating_reason: string;
  estimated_year: string;
}

export interface ProductAnalysisResponse {
  analysis: ProductAnalysisResult;
  summary: string;
  rawResponse: string;
}

/**
 * Convert image buffer to base64 string
 */
function bufferToBase64(buffer: Buffer, mimeType: string): string {
  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Analyze product images using OpenAI Vision API
 * @param images Array of image data (either URLs or buffers with MIME types)
 * @param userDescription Optional user description of the product
 * @returns Product analysis result
 */
export async function analyzeProductImages(
  images: Array<{ buffer: Buffer; mimeType: string } | { url: string }>,
  userDescription?: string
): Promise<ProductAnalysisResponse> {
  if (images.length < 3 || images.length > 5) {
    throw new Error('Please provide between 3 and 5 images for analysis');
  }

  // Build image content blocks
  const imageBlocks: OpenAI.Chat.ChatCompletionContentPart[] = images.map((img) => {
    if ('buffer' in img) {
      return {
        type: 'image_url',
        image_url: {
          url: bufferToBase64(img.buffer, img.mimeType),
        },
      };
    } else {
      return {
        type: 'image_url',
        image_url: {
          url: img.url,
        },
      };
    }
  });

  const imageCount = images.length;
  const descriptionText = userDescription ? `\n\nUser's description: "${userDescription}"` : '';

  // Construct the prompt (converted from Python script)
  const promptText = `You are a highly accurate visual recognition system for electronic devices.
You are given ${imageCount} images of the SAME product taken from different angles or colors.${descriptionText}

Your task:
1. Analyze all images together to determine the most likely product (brand, model, type).
2. Note small design differences such as button placements, ports, color, or logo.
3. If the images look like slightly different variants (e.g., different colors or model years), list all likely possibilities.
4. If any text, logo, model number, or label is visible on the product (e.g., on phones, laptops, or other electronics), read and use it to provide more accurate product identification and description.
5. Evaluate the product's physical condition on a scale of 1 to 10, where 10 means brand new and 1 means heavily damaged or worn out.
6. Provide a short reason for why this rating was given (e.g., visible scratches, discoloration, missing parts, looks unused, etc.).
7. Estimate the possible manufacturing year or range based on visible design and condition.
8. If it's still unclear or confusing, explicitly mention that better or clearer photos are needed.

Return TWO parts in your response:
1. A JSON block — following this exact structure:
{
  "identified_product": "",
  "brand": "",
  "color_variants": "",
  "model_or_series": "",
  "distinctive_features": "",
  "possible_confusion": "",
  "clarity_feedback": "",
  "short_description": "",
  "condition_rating": "",
  "rating_reason": "",
  "estimated_year": ""
}

2. A natural-language paragraph summary that describes your reasoning and what you observed in the images.
Ensure the JSON part appears FIRST, followed by the paragraph summary.`;

  // Build the message content
  const messageContent: OpenAI.Chat.ChatCompletionContentPart[] = [
    {
      type: 'text',
      text: promptText,
    },
    ...imageBlocks,
  ];

  try {
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: messageContent,
        },
      ],
      max_tokens: 800,
      temperature: 0.3,
    });

    const resultText = response.choices[0]?.message?.content?.trim() || '';

    if (!resultText) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse the response - extract JSON and summary
    const { analysis, summary } = parseOpenAIResponse(resultText);

    return {
      analysis,
      summary,
      rawResponse: resultText,
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error(`Failed to analyze images: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse OpenAI response to extract JSON and summary
 */
function parseOpenAIResponse(responseText: string): {
  analysis: ProductAnalysisResult;
  summary: string;
} {
  // Try to extract JSON block (look for first { to last })
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  //console.log('====='+responseText)
  if (!jsonMatch) {
    throw new Error('Could not parse images');
  }

  const jsonText = jsonMatch[0];
  const jsonEndIndex = responseText.indexOf(jsonText) + jsonText.length;
  
  // Everything after the JSON is the summary
  const summary = responseText.substring(jsonEndIndex).trim();

  try {
    const parsed = JSON.parse(jsonText);
    
    // Validate and transform the response
    const analysis: ProductAnalysisResult = {
      identified_product: parsed.identified_product || '',
      brand: parsed.brand || '',
      color_variants: parsed.color_variants || '',
      model_or_series: parsed.model_or_series || '',
      distinctive_features: parsed.distinctive_features || '',
      possible_confusion: parsed.possible_confusion || '',
      clarity_feedback: parsed.clarity_feedback || '',
      short_description: parsed.short_description || '',
      condition_rating: parseFloat(parsed.condition_rating) || 0,
      rating_reason: parsed.rating_reason || '',
      estimated_year: parsed.estimated_year || '',
    };

    return { analysis, summary };
  } catch (error) {
    throw new Error('Failed to parse JSON from OpenAI response');
  }
}
