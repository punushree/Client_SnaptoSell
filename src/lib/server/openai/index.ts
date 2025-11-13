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
  condition_rating: number;
  condition_details: string;
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
  const descriptionText = userDescription || '';

  // Construct the prompt (converted from Python script)
  const promptText = `You are a highly accurate visual recognition and analysis system. You will receive:
        - ${imageCount} images of the SAME item taken from different angles or conditions.
        - A short written description provided by the uploader: ${descriptionText}

        PURPOSE
        1. Analyze images + user description together.
        2. Decide whether the item is an ELECTRONIC DEVICE (mobile phone, tablet, laptop) or a CLOTHING/FASHION ITEM (clothing, footwear, accessory).
        3. Apply the domain-specific analysis rules below for the detected category.
        4. Produce a strict JSON block (all values as strings; use "" for unknown) followed by a concise natural-language summary.

        GENERAL RULES
        - Read and internalize the user description first, but do NOT accept it as absolute truth if it conflicts with the images.
        - Never invent unreadable text — use the literal phrase "text unclear".
        - Do NOT guess. Use "possible_confusion" and "clarity_feedback" to express uncertainty.
        - If the object is neither Electronics nor Clothing, set "category":"Unclear" and set "identified_product":"Unclear – not recognized as electronics or clothing" and explain why in the natural-language summary.
        - Output must be valid JSON only in the JSON block (no comments or extra text). All values must be strings. Use semicolon-separated items if multiple values are needed.

        STEP A — CATEGORY IDENTIFICATION (run first)
        - Use both visual cues and the user description.
        - Set "category" to exactly one of: "Electronics", "Clothing", or "Unclear".
        - Provide a short "category_confidence" (e.g., "High / Medium / Low") and list top 2 candidate categories in "possible_confusion" if uncertain.

        IF category == "Electronics" → apply ELECTRONICS RULES:
        - TARGETS: MOBILE PHONES, TABLETS, LAPTOPS only.
        - ANALYSIS INSTRUCTIONS:
        1. Identify product type (phone/tablet/laptop), brand and model/series. If uncertain, list top 2–3 matches in "possible_confusion" with confidence levels.
        2. Color and size: identify visible color(s) and estimate form factor/size (e.g., "6.1-inch phone", "13-inch laptop"); if estimate uncertain, say so.
        3. Material & build: aluminum, glass, plastic, matte, glossy, etc.
        4. Distinctive features: camera layout, port types, hinge design, logo placement, button arrangement.
        5. Visible text/logos/model numbers: transcribe exactly or write "text unclear".
        6. Condition evaluation: 1–10 scale (10 = factory new; 1 = broken/heavily damaged). Provide "condition_details".
        7. Estimated manufacturing/release year or range.
        8. Clarity feedback: if images blurry/dark/missing angles say so.
        9. Uncertainty handling: do NOT guess—use "possible_confusion" and "clarity_feedback".

        IF category == "Clothing" → apply CLOTHING/FASHION RULES:
        - TARGETS: CLOTHING, FOOTWEAR, FASHION ACCESSORIES.
        - PRIORITY: Start with the user description, then images.
        - ANALYSIS INSTRUCTIONS:
        1. Gender classification: male / female / unisex — base on cut/silhouette/labels; color alone doesn’t determine gender.
        2. Ultra-specific category identification: use the detailed taxonomy (tops, bottoms, dresses, footwear, outerwear, accessories) and sub-type (e.g., "crew neck t-shirt", "mom jeans", "high-top sneakers", "puffer jacket", "crossbody bag").
        3. Brand identification: logos, neck tags, care labels — transcribe exactly or write "text unclear". Classify brand tier if identifiable.
        4. Fit style: slim-fit, regular-fit, oversized, cropped, tailored, boxy, etc.
        5. Material identification: cotton, linen, wool, silk, leather, polyester, nylon, blends — base on visible texture/drape.
        6. Size extraction: XS/S/M/L or numeric; if not visible, say "size tag not visible".
        7. Condition assessment: 0–10 scale with definitions (10 = NWT/new with tags; below 5 = poor/heavy wear). Provide "condition_details" describing pilling, stains, hardware issues, seams, zippers.
        8. Clarity feedback: if images are blurry/dark/missing critical areas, mention which areas are missing.
        9. Uncertainty handling: do NOT guess—use "possible_confusion" and "clarity_feedback".

        COMMON OUTPUT RULES
        - Transcribe any visible text/logo exactly. If unreadable, use "text unclear".
        - If multiple variants/colors appear, list them in "color_variants" separated by semicolons.
        - Keep the tone factual and analytical.

        OUTPUT FORMAT (STRICT: part 1 = JSON block, part 2 = plain-language paragraph)

        Return your response in TWO parts:

        1️⃣ JSON BLOCK (valid JSON only; all values as strings; use "" if unknown):
        {{
        "category": "",                    // "Electronics" | "Clothing" | "Unclear"
        "category_confidence": "",         // "High" / "Medium" / "Low"
        "possible_confusion": "",          // semicolon-separated brief items if any

        /* COMMON FIELDS */
        "identified_product": "",          // e.g., "iPhone 15 Pro" or "crew neck t-shirt" or "Unclear – not recognized as electronics or clothing"
        "brand": "",
        "color_variants": "",
        "size": "",
        "material_composition": "",
        "distinctive_features": "",
        "visible_text_or_labels": "",      // exactly transcribed or "text unclear"
        "possible_confusion_detail": "",   // longer explanation of ambiguous matches (semi-colon separated)
        "clarity_feedback": "",

        /* ELECTRONICS-SPECIFIC (populate only if category == Electronics; otherwise leave empty) */
        "size_estimate": "",   // e.g., "6.1-inch"; "" if N/A
        "estimated_year": "",
        "condition_rating": "",            // 1-10 (electronics scale); if Clothing, use clothing scale and still fill
        "condition_details": "",
        "user_description_used": "<<<repeat the exact text user provided>>>"
        }}

        2️⃣ NATURAL-LANGUAGE SUMMARY

        After one blank line, write one concise paragraph (3–6 sentences) summarizing:
        - Which category was identified and how (visual cues + user description),
        - Key identifiers used (brand, model, logos, cut, tags),
        - Condition and estimated year/age if applicable,
        - Any mismatches between user description and images,
        - Any major uncertainties or missing visual information
        
        ---
 
        ### VALIDATION RULES
 
        - Analyze **only mobile phones, tablets, and laptops**.  
        If the images show something else, set \`"identified_product": "Invalid Description"\` and explain in \`"clarity_feedback"\`.
 
        - If the **User Description** contradicts the visible device:  
        → set \`"identified_product": "Invalid Description"\`  
        → leave all other JSON fields empty strings \`""\` except \`"clarity_feedback"\`.
 
        - Maintain a factual, objective tone.  
        - Ensure the JSON output is **valid and machine-readable**.`;

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
      condition_rating: parseFloat(parsed.condition_rating) || 0,
      condition_details: parsed.condition_details || '',
      estimated_year: parsed.estimated_year || '',
    };

    return { analysis, summary };
  } catch (error) {
    throw new Error('Failed to parse JSON from OpenAI response');
  }
}
