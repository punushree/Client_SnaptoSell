# Product Pricing API Integration Guide

This document explains how to use the new Product Pricing API and UI component.

## Overview

The pricing system fetches product prices from eBay API, filters for valid device categories, and stores the calculated pricing in the `product_detection` table.

## Database Changes

New fields added to `ProductDetection` entity:
- `average_price` (float) - Average price from eBay listings
- `min_price` (float) - Minimum price found
- `max_price` (float) - Maximum price found
- `price_currency` (string) - Currency code (default: USD)
- `ebay_items_count` (integer) - Number of valid eBay items found
- `pricing_updated_at` (datetime) - Last time pricing was calculated

**Note:** You'll need to run a migration to add these fields to your database:
```bash
npm run migration:create
npm run migration:up
```

## Environment Variables

Add the following to your `.env` file:
```
EBAY_TOKEN=your_ebay_oauth_token_here
```

## API Endpoints

### 1. Process Pricing
**POST** `/api/pricing/process`

Processes pricing for a product by calling eBay API and storing results.

**Request Body:**
```json
{
  "uuid": "product-uuid-here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pricing calculated and saved successfully",
  "data": {
    "uuid": "product-uuid",
    "search_query": "iPhone 15 Pro Apple 256GB",
    "price_statistics": {
      "average_price": 899.99,
      "min_price": 799.99,
      "max_price": 999.99,
      "count": 5,
      "currency": "USD"
    },
    "ebay_items_count": 5,
    "average_price": 899.99,
    "min_price": 799.99,
    "max_price": 999.99,
    "price_currency": "USD",
    "pricing_updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### 2. Get Pricing
**GET** `/api/pricing/[uuid]`

Retrieves pricing information for a product.

**Response:**
```json
{
  "success": true,
  "data": {
    "uuid": "product-uuid",
    "average_price": 899.99,
    "min_price": 799.99,
    "max_price": 999.99,
    "price_currency": "USD",
    "ebay_items_count": 5,
    "pricing_updated_at": "2024-01-15T10:30:00Z",
    "has_pricing": true
  }
}
```

## UI Component

### ProductPricing Component

A reusable React component that displays pricing information and allows users to calculate/refresh pricing.

**Location:** `src/components/ProductPricing/index.tsx`

**Usage:**
```tsx
import ProductPricing from "@/components/ProductPricing";

// In your component
<ProductPricing 
  uuid={productUuid} 
  onPricingUpdated={(data) => {
    console.log("Pricing updated:", data);
  }}
/>
```

**Props:**
- `uuid` (string, required) - Product detection UUID
- `onPricingUpdated` (function, optional) - Callback when pricing is updated

**Features:**
- Automatically fetches pricing on mount
- Shows loading states
- Displays average, min, and max prices
- Shows number of eBay listings used
- Button to calculate/refresh pricing
- Error handling with user-friendly messages

## Integration Example

### Adding to Detection Results Page

In `src/pages/(main)/detect/page.tsx`, add the pricing component after the product confirmation:

```tsx
import ProductPricing from "@/components/ProductPricing";

// In the success section, after product details:
{submitSuccess && submitSuccess.uuid && (
  <Box mt="md">
    <ProductPricing 
      uuid={submitSuccess.uuid}
      onPricingUpdated={(data) => {
        // Optional: Update local state or show notification
        console.log("Pricing updated:", data);
      }}
    />
  </Box>
)}
```

## eBay API Service

The `EbayAPIService` class handles all eBay API interactions:

**Location:** `src/lib/server/services/ebayApiService.ts`

**Key Methods:**
- `formatSearchQuery(product)` - Creates search query from product data
- `callEbayAPI(searchQuery, limit)` - Calls eBay API
- `isValidItem(item)` - Filters items by valid category IDs
- `extractEbayItems(response)` - Extracts and formats eBay items
- `calculateAveragePrice(items)` - Calculates price statistics
- `processProduct(product)` - Main method to process a product

**Valid Category IDs:**
- `9355` - Cell Phones & Smartphones
- `177` - Laptops & Netbooks
- `171485` - Tablets & eBook Readers

## Error Handling

The API handles various error scenarios:
- Missing eBay token
- Product not found
- Product not completed
- eBay API errors
- Network errors

All errors are returned as JSON with appropriate HTTP status codes.

## Next Steps

1. Add `EBAY_TOKEN` to your `.env` file
2. Run database migration to add pricing fields
3. Integrate `ProductPricing` component into your UI
4. Test with a completed product detection

