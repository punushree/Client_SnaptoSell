/**
 * JSON Parsing Utilities
 * Matches Python backend clean_json_string functionality
 */

/**
 * Clean and extract JSON from potentially malformed API responses
 * Handles markdown code blocks, extra whitespace, and common formatting issues
 */
export function cleanJsonString(text: string): string {
  // Remove markdown code blocks
  let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  // Remove leading/trailing whitespace
  cleaned = cleaned.trim();
  
  // Try to extract JSON object (find first { to matching })
  const firstBrace = cleaned.indexOf('{');
  if (firstBrace === -1) {
    throw new Error('No JSON object found in response');
  }
  
  // Find matching closing brace
  let braceCount = 0;
  let lastBrace = -1;
  
  for (let i = firstBrace; i < cleaned.length; i++) {
    if (cleaned[i] === '{') braceCount++;
    if (cleaned[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        lastBrace = i;
        break;
      }
    }
  }
  
  if (lastBrace === -1) {
    throw new Error('No matching closing brace found in JSON');
  }
  
  cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  
  // Remove any trailing commas before closing braces/brackets (common GPT mistake)
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  
  return cleaned;
}

/**
 * Parse JSON with error handling and cleaning
 */
export function parseJsonSafe<T = any>(text: string): T {
  try {
    // First try direct parse
    return JSON.parse(text);
  } catch (error) {
    // If that fails, try cleaning first
    try {
      const cleaned = cleanJsonString(text);
      return JSON.parse(cleaned);
    } catch (cleanError) {
      console.error('Failed to parse JSON even after cleaning');
      console.error('Original text:', text.substring(0, 500));
      throw new Error(`JSON parse failed: ${cleanError instanceof Error ? cleanError.message : 'Unknown error'}`);
    }
  }
}

/**
 * Extract JSON object from text that may contain other content
 */
export function extractJson(text: string): string | null {
  try {
    return cleanJsonString(text);
  } catch (error) {
    return null;
  }
}

/**
 * Validate that a string contains valid JSON
 */
export function isValidJson(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch (error) {
    return false;
  }
}
