/**
 * Report Generator
 * Generates comprehensive JSON reports for product analysis
 * Matches Python backend report_generator.py
 */

interface TimeBreakdown {
  stage0?: number;
  stage1?: number;
  stage2?: number;
  stage3?: number;
}

interface ReportMetadata {
  timestamp: string;
  analyzer_version: string;
  model_used: string;
  execution_times: {
    [key: string]: string;
  };
  product_category: string;
}

export interface FinalReport {
  [key: string]: any;
  analysis_metadata: ReportMetadata;
  summary: string;
  description_about_model?: string;
}

/**
 * Format time in seconds to human-readable string
 */
function formatTime(seconds: number): string {
  if (seconds < 1) {
    return `${(seconds * 1000).toFixed(0)}ms`;
  } else if (seconds < 60) {
    return `${seconds.toFixed(1)} seconds`;
  } else {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ${secs} second${secs !== 1 ? 's' : ''}`;
  }
}

/**
 * Detect product category from report data
 */
function detectReportCategory(report: any): string {
  // Check for fashion-specific fields
  if (report.gender_category || report.category_type) {
    return 'fashion';
  }
  
  // Check for electronics-specific fields
  if (report.processor || report.display_size || report.carrier_lock_status) {
    return 'electronics';
  }
  
  // Check for generic product fields
  if (report.product_type) {
    return 'other';
  }
  
  // Default fallback
  const identified = (report.identified_product || '').toLowerCase();
  if (/phone|laptop|tablet|camera|electronics/i.test(identified)) {
    return 'electronics';
  } else if (/shirt|shoe|dress|jacket|fashion|apparel/i.test(identified)) {
    return 'fashion';
  }
  
  return 'other';
}

/**
 * Generate natural language summary for electronics
 */
function generateElectronicsSummary(report: any): string {
  const brand = report.brand || 'Unknown';
  const model = report.model || 'Unknown';
  const storage = report.storage || report.storage_capacity || 'N/A';
  const ram = report.ram || 'N/A';
  const condition = report.condition_rating || 'Unknown';
  const confidence = report.confidence_score || 0;
  
  let summary = `ELECTRONICS PRODUCT ANALYSIS SUMMARY\n`;
  summary += `======================================================================\n\n`;
  summary += `Product: ${brand} ${model}\n`;
  summary += `Storage: ${storage} | RAM: ${ram}\n`;
  summary += `Condition: ${condition}\n`;
  summary += `Identification Confidence: ${confidence}%\n\n`;
  
  // Add verification if present
  if (report.authenticity_status) {
    summary += `VERIFICATION RESULTS\n`;
    summary += `Authentication Status: ${report.authenticity_status}\n`;
    summary += `Verification Confidence: ${report.verification_confidence || 'N/A'}%\n`;
    
    if (report.specs_match !== undefined) {
      summary += `Specs Match Official: ${report.specs_match ? 'Yes' : 'No'}\n`;
    }
    summary += `\n`;
  }
  
  // Add pricing if present
  if (report.SnaptoSell_suggestion) {
    const suggestion = report.SnaptoSell_suggestion;
    summary += `PRICING ANALYSIS\n`;
    summary += `Recommended Price: ${suggestion.typical_resale_price || 'N/A'}\n`;
    summary += `Price Range: ${suggestion.price_range || 'N/A'}\n`;
    summary += `Market Confidence: ${suggestion.confidence || 'N/A'}\n\n`;
  }
  
  summary += `======================================================================`;
  
  return summary;
}

/**
 * Generate natural language summary for fashion
 */
function generateFashionSummary(report: any): string {
  const brand = report.brand || 'Unknown';
  const category = report.specific_category || report.category_type || 'Item';
  const gender = report.gender_category || 'unisex';
  const condition = report.condition_rating || 'Unknown';
  const confidence = report.confidence_score || 0;
  
  let summary = `FASHION PRODUCT ANALYSIS SUMMARY\n`;
  summary += `======================================================================\n\n`;
  summary += `Product: ${brand} ${category}\n`;
  summary += `Gender Category: ${gender}\n`;
  summary += `Condition: ${condition}\n`;
  summary += `Identification Confidence: ${confidence}%\n\n`;
  
  // Add authentication if present
  if (report.authenticity_status) {
    summary += `AUTHENTICATION RESULTS\n`;
    summary += `Status: ${report.authenticity_status}\n`;
    
    if (report.authentic_markers_found && report.authentic_markers_found.length > 0) {
      summary += `Authentic Markers: ${report.authentic_markers_found.join(', ')}\n`;
    }
    
    if (report.red_flags_found && report.red_flags_found.length > 0) {
      summary += `Red Flags: ${report.red_flags_found.join(', ')}\n`;
    }
    summary += `\n`;
  }
  
  // Add pricing if present
  if (report.overall_recommendation) {
    summary += `PRICING ANALYSIS\n`;
    summary += `${report.overall_recommendation}\n\n`;
  }
  
  summary += `======================================================================`;
  
  return summary;
}

/**
 * Generate natural language summary for other products
 */
function generateOtherSummary(report: any): string {
  const productName = report.identified_product || 'Unknown Product';
  const condition = report.condition_rating || 'Unknown';
  const confidence = report.confidence_score || 0;
  
  let summary = `PRODUCT ANALYSIS SUMMARY\n`;
  summary += `======================================================================\n\n`;
  summary += `Product: ${productName}\n`;
  summary += `Condition: ${condition}\n`;
  summary += `Confidence: ${confidence}%\n\n`;
  
  if (report.short_description) {
    summary += `Description: ${report.short_description}\n\n`;
  }
  
  summary += `======================================================================`;
  
  return summary;
}

/**
 * Generate natural language summary based on category
 */
function generateSummaryText(report: any, category: string): string {
  switch (category) {
    case 'electronics':
      return generateElectronicsSummary(report);
    case 'fashion':
      return generateFashionSummary(report);
    default:
      return generateOtherSummary(report);
  }
}

/**
 * Generate comprehensive final report
 */
export function generateFinalReport(
  stage1Data: any,
  stage2Data?: any,
  stage3Data?: any,
  timeBreakdown?: TimeBreakdown
): FinalReport {
  // Start with all Stage 1 data
  const report: any = { ...stage1Data };
  
  // Merge Stage 2 data if present
  if (stage2Data) {
    Object.assign(report, stage2Data);
  }
  
  // Merge Stage 3 data if present
  if (stage3Data) {
    Object.assign(report, stage3Data);
  }
  
  // Detect category
  const category = detectReportCategory(report);
  
  // Format execution times
  const formattedTimes: { [key: string]: string } = {};
  let totalTime = 0;
  
  if (timeBreakdown) {
    for (const [stage, seconds] of Object.entries(timeBreakdown)) {
      if (seconds !== undefined) {
        formattedTimes[stage] = formatTime(seconds);
        totalTime += seconds;
      }
    }
    formattedTimes.total = formatTime(totalTime);
  }
  
  // Add metadata
  report.analysis_metadata = {
    timestamp: new Date().toISOString(),
    analyzer_version: '2.0.0',
    model_used: 'gpt-5.1-2025-11-13',
    execution_times: formattedTimes,
    product_category: category
  };
  
  // Generate summary
  report.summary = generateSummaryText(report, category);
  
  return report;
}

/**
 * Export report to JSON string
 */
export function exportReportToJSON(report: FinalReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Generate filename for report download
 */
export function generateReportFilename(report: FinalReport): string {
  const category = report.analysis_metadata.product_category;
  const timestamp = new Date().toISOString().split('T')[0];
  
  let filename = `${category}_analysis_${timestamp}`;
  
  if (category === 'electronics') {
    const brand = (report.brand || 'product').replace(/\s+/g, '_');
    const model = (report.model || '').replace(/\s+/g, '_');
    filename = `electronics_${brand}_${model}_${timestamp}`;
  } else if (category === 'fashion') {
    const brand = (report.brand || 'item').replace(/\s+/g, '_');
    const category_type = (report.specific_category || report.category_type || '').replace(/\s+/g, '_');
    filename = `fashion_${brand}_${category_type}_${timestamp}`;
  }
  
  return `${filename}.json`;
}
