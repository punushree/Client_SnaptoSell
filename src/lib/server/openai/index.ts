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
  estimated_price: string;
  confidence_score: number;
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
  const descriptionText = userDescription || 'No additional description provided';

  // Construct the enhanced prompt
  const promptText = `You are ELECTRA, an advanced electronics identification expert specializing in mobile phones, laptops, and tablets.
ANALYSIS INPUT:
- Number of images: ${imageCount}
- User description: "${descriptionText}"
YOUR TASK:
Analyze the provided images and identify the product with maximum detail. You MUST provide comprehensive specifications by:
1. VISUAL ANALYSIS: Examine all visible details in the images (design, logos, model numbers, condition)
2. MODEL KNOWLEDGE: Once you identify the device model, use your extensive knowledge database to provide its standard specifications
3. LOGICAL INFERENCE: Fill in typical specifications for the identified model even if not directly visible
CRITICAL INSTRUCTIONS:
✓ When you identify a device model (e.g., "Samsung Galaxy S23"), you MUST fill in ALL known specifications for that model
✓ Use "N/A" ONLY when a specification is truly not applicable (e.g., carrier lock status for WiFi-only tablets)
✓ Never leave fields with empty strings - always provide a value
✓ Prioritize image evidence, but use your knowledge base to complete the full device profile
✓ If you can identify the model, you KNOW its processor, typical RAM, release year, etc.
 
The confidence_score represents how certain you are about the identified product.
✓ Evaluate confidence based on:
✓ how clearly the images show the product,
✓ how many important details you can extract from the images,
✓ whether the user description matches what you see,
✓ how consistent the final identified product feels compared to real-world knowledge.
 
If images are unclear, missing angles, or contradict the user description → lower confidence.
If images are clear, details match, and the product is easy to verify → higher confidence.
 
FIELD REQUIREMENTS:
- identified_product: Full product name (e.g., "Samsung Galaxy S23", "MacBook Pro 14-inch")
- brand: Manufacturer name (e.g., "Samsung", "Apple", "Dell", "HP")
- model: Model name (e.g., "Galaxy S23", "iPhone 15 Pro", "XPS 15")
- model_variant: Variant designation (e.g., "Ultra", "Pro Max", "Plus") or "Standard Edition" if base model
- color_variants: Visible color name (e.g., "Phantom Black", "Midnight Blue", "Space Gray")
- size: Display/screen size with unit (e.g., "6.1 inches", "15.6 inches", "13.3 inches")
- material_composition: Build materials (e.g., "Aluminum frame with Gorilla Glass Victus front and back")
- distinctive_features: Key notable features (e.g., "Triple camera system, S-Pen support, IP68 rating")
- ram: RAM capacity (e.g., "8GB", "12GB", "16GB") - MUST provide if device model is identified
- storage: Storage capacity (e.g., "128GB", "256GB", "512GB", "1TB") - provide if visible or typical for model
- processor: CPU/chipset model (e.g., "Snapdragon 8 Gen 2", "A17 Pro", "Intel Core i7-13700H", "M2") - MUST provide for identified models
- gpu: GPU details (e.g., "Adreno 740", "Apple GPU 6-core", "NVIDIA RTX 4060", "Integrated Intel Iris Xe")
- carrier: Network lock status (e.g., "Unlocked", "Verizon", "AT&T", "T-Mobile") or "N/A" for WiFi-only devices
- connectivity: Network technology (e.g., "5G", "4G LTE", "WiFi 6E", "WiFi 7")
- condition_rating: Overall physical condition ("Like New", "Excellent", "Good", "Fair", "Poor")
- condition_details: Description of visible wear (e.g., "Minor scratches on back panel", "Pristine condition, no visible damage")
- estimated_year: Release or manufacture year (e.g., "2023", "2022", "2021")
- short_description: Comprehensive 3-5 sentence description covering: device overview, key features, performance capabilities, build quality, and target use case. Make it informative and engaging for potential buyers (e.g., "The Samsung Galaxy S23 is a flagship smartphone featuring a stunning 6.1-inch Dynamic AMOLED 2X display with 120Hz refresh rate. Powered by the Snapdragon 8 Gen 2 processor, it delivers exceptional performance for gaming and multitasking. The device boasts a versatile triple camera system with advanced AI capabilities, perfect for photography enthusiasts. With its premium build quality and IP68 water resistance, this phone is designed for users who demand both style and durability.")
- possible_confusion: Similar models that could be confused with this one (e.g., "Could be mistaken for Galaxy S23+") or "None"
- clarity_feedback: Assessment of image quality (e.g., "Images are clear and comprehensive" or "Blurry images, recommend clearer photos")
- estimated_price: Estimated market value range based on model, condition, and specifications (e.g., "$400-$500", "$800-$1000", "$150-$200")
- confidence_score: Reflects how certain the model is based on image clarity, detail visibility, and consistency between user input and what is seen
 
EXAMPLE KNOWLEDGE APPLICATION:
If you identify "Samsung Galaxy S23 (base model)", you know it has:
- Processor: Snapdragon 8 Gen 2 (US) or Exynos 2200 (international)
- RAM: 8GB (standard)
- Display: 6.1 inches
- GPU: Adreno 740 or Xclipse 920
- Released: 2023
- Connectivity: 5G
- Material: Armor Aluminum frame with Gorilla Glass Victus 2
If you identify "iPhone 15 Pro", you know it has:
- Processor: A17 Pro chip
- RAM: 8GB
- Display: 6.1 inches
- Released: 2023
- Connectivity: 5G
- Material: Titanium frame with Ceramic Shield front
JSON OUTPUT FORMAT (output ONLY JSON first, no markdown blocks, no \`\`\`):
{
  "identified_product": "Full Product Name Here",
  "brand": "Brand Name",
  "model": "Model Name",
  "model_variant": "Variant or Standard Edition",
  "color_variants": "Color Name",
  "size": "X.X inches",
  "material_composition": "Materials and build description",
  "distinctive_features": "Key features comma separated",
  "ram": "XGB",
  "storage": "XXGB or N/A if unknown",
  "processor": "Processor/Chipset Name",
  "gpu": "GPU Name or Integrated",
  "carrier": "Unlocked/Carrier Name/N/A",
  "connectivity": "5G/4G LTE/WiFi specs",
  "condition_rating": "Condition Level",
  "condition_details": "Wear and damage description",
  "estimated_year": "YYYY",
  "short_description": "Brief 1-2 sentence description",
  "possible_confusion": "Similar models or None",
  "clarity_feedback": "Image quality assessment",
  "estimated_price": "$XXX-$XXX"
  "confidence_score": 0-100,
}
After the JSON, provide a brief summary paragraph describing the identified device, its condition, and key specifications.
CRITICAL REMINDERS:
- Fill ALL fields with actual meaningful values
- Use your knowledge database for identified models - don't leave specs blank
- Only use "N/A" when truly not applicable
- No empty strings ""
- Provide typical specifications for identified devices even if not directly visible in images`;

  // Build the message content
  const messageContent: OpenAI.Chat.ChatCompletionContentPart[] = [
    {
      type: 'text',
      text: promptText,
    },
    ...imageBlocks,
  ];

  try {
    // Call OpenAI API with optimized parameters for speed
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: messageContent,
        },
      ],
      max_tokens: 800, // Reduced for faster response while maintaining quality
      temperature: 0.1, // Lower temperature = faster generation
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
  
  if (!jsonMatch) {
    console.error('Failed to parse OpenAI response:', responseText);
    throw new Error('Could not parse product analysis from images. Please ensure images are clear and show the device clearly.');
  }

  const jsonText = jsonMatch[0];
  const jsonEndIndex = responseText.indexOf(jsonText) + jsonText.length;
  
  // Everything after the JSON is the summary
  const summary = responseText.substring(jsonEndIndex).trim() || 'Product identified successfully.';

  try {
    const parsed = JSON.parse(jsonText);
    
    // Validate and transform the response with fallbacks
    const analysis: ProductAnalysisResult = {
      identified_product: parsed.identified_product || parsed.product_name || 'Unknown Product',
      brand: parsed.brand || 'Unknown',
      color_variants: parsed.color_variants || parsed.color || 'Unknown',
      size: parsed.size || parsed.screen_size || 'N/A',
      material_composition: parsed.material_composition || parsed.materials || 'N/A',
      distinctive_features: parsed.distinctive_features || parsed.features || 'N/A',
      possible_confusion: parsed.possible_confusion || 'None',
      clarity_feedback: parsed.clarity_feedback || 'Images processed',
      short_description: parsed.short_description || parsed.description || 'No description available',
      condition_rating: parsed.condition_rating || parsed.condition || 'Good',
      condition_details: parsed.condition_details || 'No visible damage noted',
      estimated_year: parsed.estimated_year || parsed.year || 'Unknown',
      model: parsed.model || 'Unknown',
      model_variant: parsed.model_variant || parsed.variant || 'Standard Edition',
      storage: parsed.storage || 'N/A',
      carrier: parsed.carrier || parsed.carrier_lock_status || 'Unknown',
      connectivity: parsed.connectivity || '4G/5G',
      ram: parsed.ram || 'N/A',
      processor: parsed.processor || parsed.cpu || 'N/A',
      gpu: parsed.gpu || 'Integrated',
      estimated_price: parsed.estimated_price || parsed.price || 'Price not available',
      confidence_score: typeof parsed.confidence_score === 'number' ? parsed.confidence_score : 50,
    };

    return { analysis, summary };
  } catch (error) {
    console.error('JSON parse error:', error);
    console.error('Attempted to parse:', jsonText);
    throw new Error('Failed to parse JSON from OpenAI response. The model may have returned invalid JSON.');
  }
}

/**
 * Analyze product category (electronics/fashion/other)
 */
export async function analyzeProductCategory(
  images: Array<{ buffer: Buffer; mimeType: string }>,
  userDescription?: string
): Promise<{ category: string; confidence_score: number; detected_product_type: string; reasoning: string }> {
  const imageBlocks: OpenAI.Chat.ChatCompletionContentPart[] = images.map((img) => ({
    type: 'image_url',
    image_url: {
      url: bufferToBase64(img.buffer, img.mimeType),
    },
  }));

  const prompt = `You are a product category classifier for a multi-category resale marketplace.

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

${userDescription ? `USER PROVIDED TEXT: "${userDescription}"` : ''}

OUTPUT FORMAT (JSON only, no markdown):
{
  "category": "electronics" | "fashion" | "other",
  "confidence_score": 0-100,
  "detected_product_type": "brief description of what you see",
  "reasoning": "1-2 sentences explaining classification"
}`;

  const messageContent: OpenAI.Chat.ChatCompletionContentPart[] = [
    { type: 'text', text: prompt },
    ...imageBlocks,
  ];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Faster and cheaper for simple classification
      messages: [{ role: 'user', content: messageContent }],
      max_tokens: 200, // Reduced for faster response
      temperature: 0.1,
    });

    const resultText = response.choices[0]?.message?.content?.trim() || '';
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Could not parse category response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      category: parsed.category || 'other',
      confidence_score: parsed.confidence_score || 50,
      detected_product_type: parsed.detected_product_type || 'Unknown',
      reasoning: parsed.reasoning || 'Category detected from images',
    };
  } catch (error) {
    console.error('Category detection error:', error);
    throw new Error(`Failed to detect category: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Analyze product identification based on category
 */
export async function analyzeProductIdentification(
  imageUrls: string[],
  category: string,
  userDescription?: string
): Promise<ProductAnalysisResult> {
  const imageBlocks: OpenAI.Chat.ChatCompletionContentPart[] = imageUrls.map((url) => ({
    type: 'image_url',
    image_url: { url },
  }));

  // Use different prompts based on category
  let prompt = '';
  
  if (category === 'electronics') {
    prompt = `You are an electronics identification expert. Analyze these images and identify the product with maximum detail.

${userDescription ? `User description: "${userDescription}"` : ''}

Provide comprehensive specifications including:
- Product name and model
- Brand
- Technical specs (RAM, storage, processor, GPU if applicable)
- Display size
- Condition assessment
- Estimated year
- Market value estimate

Output JSON with all fields from the standard product analysis format.`;
  } else if (category === 'fashion') {
    prompt = `You are a fashion product expert. Analyze these images and identify the clothing/accessory item.

${userDescription ? `User description: "${userDescription}"` : ''}

Provide details including:
- Item type and brand
- Size and material composition
- Color and distinctive features
- Condition assessment
- Estimated year/season
- Market value estimate

Output JSON with all fields from the standard product analysis format.`;
  } else {
    prompt = `You are a product identification expert. Analyze these images and identify the product.

${userDescription ? `User description: "${userDescription}"` : ''}

Provide details including:
- Product name and type
- Brand (if applicable)
- Material and size
- Condition assessment
- Distinctive features
- Market value estimate

Output JSON with all fields from the standard product analysis format.`;
  }

  const messageContent: OpenAI.Chat.ChatCompletionContentPart[] = [
    { type: 'text', text: prompt },
    ...imageBlocks,
  ];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: messageContent }],
      max_tokens: 600, // Reduced for faster response
      temperature: 0.1, // Lower for speed
    });

    const resultText = response.choices[0]?.message?.content?.trim() || '';
    const { analysis } = parseOpenAIResponse(resultText);
    return analysis;
  } catch (error) {
    console.error('Identification error:', error);
    throw new Error(`Failed to identify product: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify product authenticity and specifications
 */
export async function verifyProductAuthenticity(
  stage1Data: any,
  category: string
): Promise<{
  authenticity_status: string;
  verification_confidence: number;
  specs_match: boolean;
  authenticity_warnings: string[];
  verification_summary: string;
}> {
  const productName = `${stage1Data.brand} ${stage1Data.model}`.trim();
  
  const prompt = `You are a product verification expert. Verify the authenticity and specifications of this ${category} product:

Product: ${productName}
Claimed Specifications:
- Brand: ${stage1Data.brand}
- Model: ${stage1Data.model}
${stage1Data.storage ? `- Storage: ${stage1Data.storage}` : ''}
${stage1Data.ram ? `- RAM: ${stage1Data.ram}` : ''}
${stage1Data.processor ? `- Processor: ${stage1Data.processor}` : ''}
${stage1Data.color_variants ? `- Color: ${stage1Data.color_variants}` : ''}
- Condition: ${stage1Data.condition_rating}

Using your knowledge and web search capabilities, verify:
1. Does this product model exist?
2. Do the claimed specifications match official specs?
3. Are there any authenticity concerns?
4. Are the specifications plausible for this model?

Output JSON:
{
  "authenticity_status": "Authentic" | "Suspicious" | "Unknown",
  "verification_confidence": 0-100,
  "specs_match": true | false,
  "authenticity_warnings": ["warning1", "warning2"],
  "verification_summary": "Brief summary of verification findings"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400, // Reduced for faster verification
      temperature: 0.05, // Very low for speed and consistency
    });

    const resultText = response.choices[0]?.message?.content?.trim() || '';
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Could not parse verification response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      authenticity_status: parsed.authenticity_status || 'Unknown',
      verification_confidence: parsed.verification_confidence || 50,
      specs_match: parsed.specs_match ?? true,
      authenticity_warnings: parsed.authenticity_warnings || [],
      verification_summary: parsed.verification_summary || 'Verification completed',
    };
  } catch (error) {
    console.error('Verification error:', error);
    throw new Error(`Failed to verify product: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
