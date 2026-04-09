# Rebuy Setup Guide

## Prerequisites

- Shopify store on a plan that supports app embeds (Basic and above)
- Rebuy account with API access (Growth plan or above for Smart Cart)

## Installation

1. Install the Rebuy app from the Shopify App Store
2. In Rebuy Dashboard → Settings → API, copy your API key
3. In Shopify Customizer → Theme settings → Personalization:
   - Paste the API key into "Rebuy API Key"

## Creating recommendation rules

Rebuy uses "Rules" to define recommendation logic. Each rule has a unique ID
that maps to a `data-rebuy-id` attribute in the theme.

### Product page rule ("Complete the look")

1. Rebuy Dashboard → Rules → New Rule
2. Name: "Complete the Look — Product Page"
3. Type: "Product Recommendation"
4. Algorithm: "Frequently Bought Together" (or "Smart Sort" for ML-based)
5. Input source: "Current product" (automatically reads the viewed product)
6. Limit: 4
7. Copy the Rule ID → paste into theme settings "Product page widget Rule ID"

### Cart page rule ("You might also need")

1. Rules → New Rule
2. Name: "Cart Cross-Sell"
3. Type: "Product Recommendation"
4. Algorithm: "Complementary Products" or "Manually curated"
5. Input source: "Cart items"
6. Limit: 3
7. Copy Rule ID → paste into "Cart page widget Rule ID"

## Smart Cart (optional)

If your Rebuy plan includes Smart Cart:

1. Rebuy Dashboard → Smart Cart → Enable
2. Smart Cart will replace Dawn's native cart drawer
3. The `rebuy:smartcart-open` event in `rebuy-integration.js` handles the
   `view_cart` GA4 event for Smart Cart opens

## Testing

Append `?rebuy_debug=true` to any store URL to see Rebuy's decision log
in the browser console — shows which rule fired, which products were returned,
and why items were included or excluded.

```
https://your-store.myshopify.com/products/your-product?rebuy_debug=true
```

Also check:
- Chrome DevTools → Network → filter "rebuyengine.com" to see API requests
- Rebuy Dashboard → Analytics → Widget Performance for impression/click data

## Klaviyo + Rebuy: Post-purchase email recommendations

Rebuy exposes an API for use in Klaviyo email templates:

```
GET https://rebuyengine.com/api/v1/products/recommended?api_key=YOUR_KEY
    &customer_id={{ person|lookup:'shopify_customer_id' }}
    &limit=3
```

Use this as a Klaviyo dynamic content block to inject personalized product
recommendations into post-purchase emails using the customer's order history.
