/**
 * eBay API Integration Service
 * Handles product search and price calculation from eBay API
 */

import EBAY_SCOPES from '../../../config/ebay-scopes';

interface EbayTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface EbayItem {
  itemId: string;
  title: string;
  itemWebUrl: string;
  categories?: Array<{ categoryId: string; categoryName: string }>;
  leafCategoryIds?: string[];
  price?: {
    value: string;
    currency: string;
  };
  condition?: string;
  conditionId?: string;
  image?: {
    imageUrl: string;
  };
  thumbnailImages?: Array<{ imageUrl: string }>;
  additionalImages?: Array<{ imageUrl: string }>;
  marketingPrice?: {
    originalPrice?: { value: string };
    discountPercentage?: string;
  };
  unitPrice?: {
    value: string;
  };
  availableQuantity?: number;
  itemHref?: string;
  epid?: string;
  itemGroupType?: string;
  itemGroupHref?: string;
}

interface EbayApiResponse {
  itemSummaries?: EbayItem[];
  error?: string;
  status_code?: number;
}

interface ExtractedItem {
  item_id: string;
  title: string;
  item_url: string;
  categories: Array<{ category_id: string; category_name: string }>;
  leaf_category_ids: string[];
  price_value: number | string;
  price_currency: string;
  condition: string;
  condition_id: string;
  primary_image_url: string;
  thumbnail_images: Array<{ imageUrl: string }>;
  additional_images: Array<{ imageUrl: string }>;
  marketing_price_original: string;
  marketing_price_discount: string;
  unit_price: string;
  available_quantity: number | string;
  item_href: string;
  epid: string;
  item_group_type: string;
  item_group_href: string;
}

interface PriceStatistics {
  average_price: number;
  min_price: number;
  max_price: number;
  count: number;
  currency: string;
}

interface ProductData {
  uuid: string;
  identified_product?: string;
  brand?: string;
  model?: string;
  model_variant?: string;
  storage?: string;
  size?: string;
  condition_rating?: string;
}

export class EbayAPIService {
  private ebayToken: string = '';
  private tokenExpiresAt: number = 0;
  private apiBaseUrl: string = "https://api.ebay.com/buy/browse/v1/item_summary/search";
  private tokenEndpoint: string = "https://api.ebay.com/identity/v1/oauth2/token";
  
  // eBay Category IDs for devices only
  private validCategoryIds: Set<string> = new Set([
    '9355',      // Cell Phones & Smartphones
    '177',       // Laptops & Netbooks
    '171485',    // Tablets & eBook Readers
  ]);

  constructor() {
    // Validate required environment variables
    if (!process.env.EBAY_CLIENT_ID || !process.env.EBAY_CLIENT_SECRET || !process.env.EBAY_REFRESH_TOKEN) {
      throw new Error(
        'Missing required eBay credentials. Please ensure EBAY_CLIENT_ID, EBAY_CLIENT_SECRET, and EBAY_REFRESH_TOKEN are set in your .env file.'
      );
    }
  }

  /**
   * Generate access token from refresh token
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid cached token
    if (this.ebayToken && Date.now() < this.tokenExpiresAt) {
      return this.ebayToken;
    }

    try {
      const clientId = process.env.EBAY_CLIENT_ID!;
      const clientSecret = process.env.EBAY_CLIENT_SECRET!;
      const refreshToken = process.env.EBAY_REFRESH_TOKEN!;

      // Create authorization header
      const authString = `${clientId}:${clientSecret}`;
      const encodedAuth = Buffer.from(authString).toString('base64');

      const headers = new Headers();
      headers.append("Content-Type", "application/x-www-form-urlencoded");
      headers.append("Authorization", `Basic ${encodedAuth}`);

      const urlencoded = new URLSearchParams();
      urlencoded.append("grant_type", "refresh_token");
      urlencoded.append("refresh_token", refreshToken);
      urlencoded.append("scope", EBAY_SCOPES);

      const response = await fetch(this.tokenEndpoint, {
        method: "POST",
        headers: headers,
        body: urlencoded,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get access token: ${response.status} - ${errorText}`);
      }

      const tokenData: EbayTokenResponse = await response.json();
      
      // Cache the token with expiration (subtract 60 seconds as buffer)
      this.ebayToken = tokenData.access_token;
      this.tokenExpiresAt = Date.now() + (tokenData.expires_in - 60) * 1000;

      console.log('Successfully obtained eBay access token');
      return this.ebayToken;
    } catch (error) {
      console.error('Error obtaining eBay access token:', error);
      throw new Error(`Failed to obtain eBay access token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Format search query from product data
   */
  formatSearchQuery(product: ProductData): string {
    const queryParts: string[] = [];

    // Brand + Model + Variant (most specific combination for electronics)
    if (product.brand && product.model) {
      const brand = String(product.brand).trim();
      const model = String(product.model).trim();
      
      if (brand && brand.toLowerCase() !== 'none' && brand.toLowerCase() !== 'unknown') {
        if (model && model.toLowerCase() !== 'none' && model.toLowerCase() !== 'unknown') {
          // For brand + model, we want them together for better results
          queryParts.push(`${brand} ${model}`);
          
          // Add model variant if available
          if (product.model_variant) {
            const variant = String(product.model_variant).trim();
            if (variant && variant.toLowerCase() !== 'none' && variant.toLowerCase() !== 'unknown') {
              queryParts.push(variant);
            }
          }
        } else {
          queryParts.push(brand);
        }
      }
    } else if (product.brand) {
      // Only brand available
      const brand = String(product.brand).trim();
      if (brand && brand.toLowerCase() !== 'none' && brand.toLowerCase() !== 'unknown') {
        queryParts.push(brand);
      }
    } else if (product.model) {
      // Only model available
      const model = String(product.model).trim();
      if (model && model.toLowerCase() !== 'none' && model.toLowerCase() !== 'unknown') {
        queryParts.push(model);
      }
    }

    // If no brand/model, use identified_product
    if (queryParts.length === 0 && product.identified_product) {
      const identified = String(product.identified_product).trim();
      if (identified && identified.toLowerCase() !== 'none' && identified.toLowerCase() !== 'unknown') {
        queryParts.push(identified);
      }
    }

    // Storage (for electronics) - important for price differentiation
    if (product.storage) {
      const storage = String(product.storage).trim();
      if (storage && storage.toLowerCase() !== 'none' && storage.toLowerCase() !== 'unknown') {
        queryParts.push(storage);
      }
    }

    // Size (for fashion/clothing)
    if (product.size) {
      const size = String(product.size).trim();
      if (size && size.toLowerCase() !== 'none' && size.toLowerCase() !== 'unknown') {
        // Only add size if it's not already in the query
        const currentQuery = queryParts.join(' ').toLowerCase();
        if (!currentQuery.includes(size.toLowerCase())) {
          queryParts.push(size);
        }
      }
    }

    // Condition (optional - can help narrow down results)
    if (product.condition_rating) {
      const condition = String(product.condition_rating).trim().toLowerCase();
      // Only add specific conditions that are meaningful on eBay
      if (condition === 'new' || condition === 'like new' || condition === 'refurbished') {
        queryParts.push(condition);
      }
    }

    let searchQuery = queryParts.join(' ');

    // Limit to 200 characters for eBay API
    if (searchQuery.length > 200) {
      searchQuery = searchQuery.substring(0, 200);
    }

    console.log('Generated eBay search query:', searchQuery);
    return searchQuery.trim();
  }

  /**
   * Call eBay API to search for products
   */
  async callEbayAPI(searchQuery: string, limit: number = 10): Promise<EbayApiResponse> {
    // Get fresh access token
    const accessToken = await this.getAccessToken();

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
    };

    const params = new URLSearchParams({
      'q': searchQuery,
      'limit': limit.toString()
    });

    try {
      const response = await fetch(`${this.apiBaseUrl}?${params.toString()}`, {
        method: 'GET',
        headers: headers,
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.status === 200) {
        return await response.json();
      } else {
        const errorText = await response.text();
        let errorMessage = errorText;
        
        // Try to parse JSON error response for better error messages
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.errors && Array.isArray(errorJson.errors) && errorJson.errors.length > 0) {
            const firstError = errorJson.errors[0];
            errorMessage = `eBay API Error (${firstError.errorId || response.status}): ${firstError.message || firstError.longMessage || errorText}`;
          }
        } catch {
          // If parsing fails, use the raw error text
          errorMessage = errorText;
        }
        
        console.error(`eBay API Error: ${response.status} - ${errorMessage.substring(0, 200)}`);
        return {
          error: errorMessage,
          status_code: response.status
        };
      }
    } catch (error) {
      console.error('eBay API Request failed:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if item is valid based on category IDs
   */
  isValidItem(item: EbayItem): boolean {
    // Check categories array
    if (item.categories) {
      for (const category of item.categories) {
        const categoryId = String(category.categoryId || '');
        if (this.validCategoryIds.has(categoryId)) {
          return true;
        }
      }
    }

    // Check leafCategoryIds array
    if (item.leafCategoryIds) {
      for (const categoryId of item.leafCategoryIds) {
        if (this.validCategoryIds.has(String(categoryId))) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Extract and format eBay items
   */
  extractEbayItems(ebayResponse: EbayApiResponse): { validItems: ExtractedItem[]; invalidItems: ExtractedItem[] } {
    const validItems: ExtractedItem[] = [];
    const invalidItems: ExtractedItem[] = [];

    if (!ebayResponse.itemSummaries) {
      return { validItems, invalidItems };
    }

    for (const item of ebayResponse.itemSummaries) {
      // Extract categories information
      const categoriesInfo: Array<{ category_id: string; category_name: string }> = [];
      if (item.categories) {
        for (const cat of item.categories) {
          categoriesInfo.push({
            category_id: String(cat.categoryId || 'N/A'),
            category_name: String(cat.categoryName || 'N/A')
          });
        }
      }

      const extractedItem: ExtractedItem = {
        item_id: String(item.itemId || 'N/A'),
        title: String(item.title || 'N/A'),
        item_url: String(item.itemWebUrl || 'N/A'),
        categories: categoriesInfo,
        leaf_category_ids: item.leafCategoryIds ? item.leafCategoryIds.map(id => String(id)) : [],
        price_value: item.price?.value || 'N/A',
        price_currency: item.price?.currency || 'USD',
        condition: String(item.condition || 'N/A'),
        condition_id: String(item.conditionId || 'N/A'),
        primary_image_url: item.image?.imageUrl || 'N/A',
        thumbnail_images: item.thumbnailImages || [],
        additional_images: item.additionalImages || [],
        marketing_price_original: item.marketingPrice?.originalPrice?.value || 'N/A',
        marketing_price_discount: item.marketingPrice?.discountPercentage || 'N/A',
        unit_price: item.unitPrice?.value || 'N/A',
        available_quantity: item.availableQuantity || 'N/A',
        item_href: item.itemHref || 'N/A',
        epid: String(item.epid || 'N/A'),
        item_group_type: String(item.itemGroupType || 'N/A'),
        item_group_href: item.itemGroupHref || 'N/A',
      };

      if (this.isValidItem(item)) {
        validItems.push(extractedItem);
      } else {
        invalidItems.push(extractedItem);
      }
    }

    return { validItems, invalidItems };
  }

  /**
   * Calculate average price from valid items
   */
  calculateAveragePrice(items: ExtractedItem[]): PriceStatistics {
    if (items.length === 0) {
      return {
        average_price: 0,
        min_price: 0,
        max_price: 0,
        count: 0,
        currency: 'USD'
      };
    }

    const prices: number[] = [];
    let currency = 'USD';

    for (const item of items) {
      const priceValue = item.price_value;
      if (priceValue !== 'N/A' && typeof priceValue !== 'string') {
        prices.push(priceValue);
        currency = item.price_currency;
      } else if (typeof priceValue === 'string' && priceValue !== 'N/A') {
        const parsedPrice = parseFloat(priceValue);
        if (!isNaN(parsedPrice)) {
          prices.push(parsedPrice);
          currency = item.price_currency;
        }
      }
    }

    if (prices.length === 0) {
      return {
        average_price: 0,
        min_price: 0,
        max_price: 0,
        count: 0,
        currency: currency
      };
    }

    return {
      average_price: Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100,
      min_price: Math.round(Math.min(...prices) * 100) / 100,
      max_price: Math.round(Math.max(...prices) * 100) / 100,
      count: prices.length,
      currency: currency
    };
  }

  /**
   * Process a single product and return pricing data
   */
  async processProduct(product: ProductData): Promise<{
    product_uuid: string;
    search_query: string;
    ebay_items_count: number;
    ebay_valid_items: ExtractedItem[];
    price_statistics: PriceStatistics;
    success: boolean;
    error?: string;
  }> {
    try {
      // Format search query
      const searchQuery = this.formatSearchQuery(product);
      
      if (!searchQuery) {
        return {
          product_uuid: product.uuid,
          search_query: '',
          ebay_items_count: 0,
          ebay_valid_items: [],
          price_statistics: {
            average_price: 0,
            min_price: 0,
            max_price: 0,
            count: 0,
            currency: 'USD'
          },
          success: false,
          error: 'No search query could be generated from product data'
        };
      }

      // Call eBay API
      const ebayResponse = await this.callEbayAPI(searchQuery);

      if (ebayResponse.error) {
        return {
          product_uuid: product.uuid,
          search_query: searchQuery,
          ebay_items_count: 0,
          ebay_valid_items: [],
          price_statistics: {
            average_price: 0,
            min_price: 0,
            max_price: 0,
            count: 0,
            currency: 'USD'
          },
          success: false,
          error: ebayResponse.error
        };
      }

      // Extract and filter items
      const { validItems, invalidItems } = this.extractEbayItems(ebayResponse);

      // Calculate average price
      const priceStats = this.calculateAveragePrice(validItems);

      return {
        product_uuid: product.uuid,
        search_query: searchQuery,
        ebay_items_count: validItems.length,
        ebay_valid_items: validItems,
        price_statistics: priceStats,
        success: true
      };
    } catch (error) {
      console.error('Error processing product:', error);
      return {
        product_uuid: product.uuid,
        search_query: '',
        ebay_items_count: 0,
        ebay_valid_items: [],
        price_statistics: {
          average_price: 0,
          min_price: 0,
          max_price: 0,
          count: 0,
          currency: 'USD'
        },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

