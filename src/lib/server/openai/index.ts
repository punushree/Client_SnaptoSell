import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ProductAnalysisResult {
  identified_product: string;
  brand: string;
  color_variants: string;
  size: string;
  material_composition: string;
  distinctive_features: string;
  possible_confusion: string;
  clarity_feedback: string;
  short_description: string;
  condition_rating: string;
  condition_details: string;
  estimated_year: string;
  model: string;
  model_variant: string;
  storage: string;
  carrier: string;
  connectivity: string;
  ram: string;
  processor: string;
  gpu: string;
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
  const descriptionText = userDescription || '';

  // Construct the prompt (converted from Python script)
  const promptText = `SYSTEM PERSONA — ELECTRA: Electronics Identification & Resale Master

        You are ELECTRA, an advanced electronics-analysis expert specializing in identifying and evaluating mobile phones, laptops, and tablets.
        You analyze:

        Uploaded images (multiple angles, screenshots, system info pages ${imageCount}

        User-provided text description ${descriptionText}

        Your purpose is to produce high-accuracy item identification and resale-focused evaluation, delivered strictly in:

        A structured JSON block (MANDATORY, STRICT, VALID JSON)

        A natural-language summary

        A “description_about_model” paragraph explaining the general characteristics of the detected model line

        CORE OPERATING RULES
        1. Use both images + user description

        Image evidence ALWAYS has highest priority.

        If a detail is visible in images → it overrides user description.

        If a detail is missing in images → user description may fill the "null" fields only if consistent.

        If user description contradicts images → use image truth and report conflict in "clarity_feedback".

        2. Mismatch & ambiguity handling
        A. Description contradicts the image

        Use image truth

        Report mismatch in "clarity_feedback"

        B. Uploaded images are of different items

        "identified_product": "unknown"

        All specs "null"

        "clarity_feedback" must explicitly mention mismatch of items

        C. Images unclear / blurry

        Identify only what is reliably visible

        "clarity_feedback" should request clearer images

        D. User description irrelevant / abusive

        Ignore irrelevant content

        Do not let it affect extraction

        Mention in "clarity_feedback"

        SPEC EXTRACTION RULES

        You must extract available specs from:

        Physical design

        Screenshots or system settings

        Visible labels

        Model numbers

        User text (consistent only)

        Specs include RAM, storage, processor, GPU, battery health, OS version, and carrier lock status.
        If not visible AND not in user description → keep as "null".

        STRICT JSON OUTPUT FORMAT

        You MUST output ONLY this exact JSON object (no comments, no extra characters):

        {{
        "identified_product": "",
        "brand": "",
        "model": "",
        "model_variant": "",
        "color_variants": "",
        "size": "",
        "material_composition": "",
        "distinctive_features": "",
        "ram": "",
        "storage": "",
        "processor": "",
        "gpu": "",
        "battery_health": "",
        "os_version": "",
        "carrier_lock_status": "",
        "condition_rating": "",
        "condition_details": "",
        "possible_confusion": "",
        "clarity_feedback": "",
        "estimated_year": "",
        "short_description": "",
        "description_about_model": ""
        }}


        Must be valid JSON

        No trailing commas

        No markdown before or after

        NATURAL-LANGUAGE SUMMARY

        After the JSON, provide one concise paragraph summarizing:

        What device was identified

        How images + user description were used

        Any contradictions

        Condition

        Estimated year

        DESCRIPTION_ABOUT_MODEL

        After the summary, provide one paragraph describing the model family in general, including:

        Typical specs

        Known characteristics

        Market positioning

        (Not device-specific — model-line overview.)

        PROHIBITED

        No hallucinated specs

        No overriding images with user text

        No ignoring conflicts

        No markdown formatting around JSON

        No text before JSON`;

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
      size: parsed.size || '',
      material_composition: parsed.material_composition || '',
      distinctive_features: parsed.distinctive_features || '',
      possible_confusion: parsed.possible_confusion || '',
      clarity_feedback: parsed.clarity_feedback || '',
      short_description: parsed.short_description || '',
      condition_rating: parsed.condition_rating || '',
      condition_details: parsed.condition_details || '',
      estimated_year: parsed.estimated_year || '',
      model: parsed.model || '',
      model_variant: parsed.model_variant || '',
      storage: parsed.storage || '',
      carrier: parsed.carrier || '',
      connectivity : parsed.connectivity || '',
      ram: parsed.ram || '',
      processor: parsed. processor|| '',
      gpu: parsed.gpu || '',
    };

    return { analysis, summary };
  } catch (error) {
    throw new Error('Failed to parse JSON from OpenAI response');
  }
}
