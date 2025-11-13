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
  const promptText = `You are a highly accurate visual recognition and validation system specializing in MOBILE PHONES, TABLETS, and LAPTOPS.
 
You will receive:
1. ${imageCount} images of the SAME device, taken from different angles or lighting conditions.
2. A short written description provided by the user (shown below).
 
---
 
### USER DESCRIPTION
"${descriptionText}"
 
---
 
### YOUR TASK
You must analyze all provided images and cross-verify them against the **User Description** above.
 
Your goals are to:
- Identify the actual device (brand, model, type).
- Check if the user's description accurately matches the visible device.
- If the images and description do **not match**, clearly mark the result as **Invalid Description**.
- Otherwise, confirm and enrich the details using both visual evidence and textual clues.
 
---
 
### ANALYSIS INSTRUCTIONS
 
1. **Cross-Validation**
   - Compare the visuals with the User Description in terms of brand, model, color, design, and condition.
   - If the description is clearly inconsistent with what's seen (e.g., user says "iPhone 15 Pro" but images show "Samsung Galaxy S23"), mark \`"identified_product": "Invalid Description"\` and explain why in \`"clarity_feedback"\`.
 
2. **Device Identification**
   - Determine device type (mobile phone, tablet, or laptop).
   - Identify **brand** and **model or series** (e.g., "iPhone 14 Pro", "Galaxy Tab S9", "MacBook Air M2").
   - If uncertain, list top 2–3 possibilities with confidence percentages in \`"possible_confusion"\`.
 
3. **Color, Size, and Material**
   - Detect visible color(s) and estimate screen size (e.g., "6.1-inch phone", "13-inch laptop").
   - Describe material composition (e.g., "aluminum frame", "glass back", "polycarbonate shell").
 
4. **Distinctive Features**
   - Note unique visual elements:  
     - Phones: camera layout, notch/punch-hole, buttons, ports  
     - Tablets/Laptops: keyboard, trackpad, hinges, bezels, ports, logo location
 
5. **Visible Text, Logo, or Model Numbers**
   - Transcribe any visible text, logo, or printed identifiers.
   - If a **model number** or code (e.g., "A2484", "SM-X710") is visible, use it to infer:
     - Variant (e.g., "Pro Max", "M2 Edition")
     - Specifications (storage, chipset, display type)
   - If text is unclear, write \`"text unclear"\` — do not invent.
 
6. **Condition Evaluation**
   - Rate the physical condition **on a strict 1–10 scale**:
     - 10 = factory new / unused  
     - 8–9 = minor wear  
     - 6–7 = visible scratches or marks  
     - 4–5 = cracks, dents, or heavy wear  
     - 1–3 = broken or nonfunctional
   - Explain the score in \`"condition_details"\`.
 
7. **Estimated Manufacturing Year**
   - Estimate likely **release or manufacturing year range** from the design, camera setup, port type, etc.
 
8. **Clarity and Quality Feedback**
   - Note if any image is blurry, dark, cropped, or missing important angles.
   - Mention any visual gaps that limit accurate identification.
 
9. **Uncertainty Handling**
   - Never guess or invent unseen details.  
   - Use \`"possible_confusion"\` and \`"clarity_feedback"\` to express uncertainty.
 
---
 
### OUTPUT FORMAT
 
Return your response in **TWO parts**:
 
#### 1️⃣ JSON BLOCK (strictly valid JSON — no extra text)
 
{
  "identified_product": "",
  "brand": "",
  "color_variants": "",
  "size": "",
  "material_composition": "",
  "distinctive_features": "",
  "possible_confusion": "",
  "clarity_feedback": "",
  "short_description": "",
  "condition_rating": "",
  "condition_details": "",
  "estimated_year": ""
}
 
#### 2️⃣ NATURAL-LANGUAGE SUMMARY
 
After a blank line, write one short factual paragraph describing:
- What was observed visually  
- How the user description compared to the images  
- Identified model, features, and condition  
- Any uncertainty or mismatch reasons
 
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
