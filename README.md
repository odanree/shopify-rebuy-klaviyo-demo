# shopify-rebuy-klaviyo-demo

Shopify theme integration demo wiring Rebuy Personalization Engine recommendations into product and cart templates via Liquid and JavaScript, with Klaviyo event tracking for abandoned cart, browse abandonment, and post-purchase flows.

---

## What's included

| Feature | File(s) | Description |
|---------|---------|-------------|
| **Klaviyo initialization** | `snippets/klaviyo-init.liquid` | SDK load + logged-in customer identification on every page |
| **Viewed Product event** | `snippets/klaviyo-events.liquid` | Server-rendered — feeds Browse Abandonment flow |
| **Added to Cart event** | `assets/klaviyo-events.js` | Full cart state captured — feeds Abandoned Cart flow |
| **Back in Stock widget** | `sections/main-product.liquid` | Klaviyo BIS embed on sold-out variants |
| **Rebuy product widget** | `snippets/rebuy-recommendations.liquid` | "Complete the look" on product pages |
| **Rebuy cart widget** | `sections/main-cart.liquid` | "You might also need" cross-sells on cart page |
| **Rebuy event bridge** | `assets/rebuy-integration.js` | Rebuy widget events → GA4 dataLayer + Klaviyo |
| **Skeleton loader CSS** | `assets/rebuy-recommendations.css` | Shimmer placeholders while Rebuy JS initializes |
| **Theme settings UI** | `config/settings_schema.json` | All keys configurable from Shopify Customizer |

---

## Klaviyo flows

| Flow | Trigger | Emails |
|------|---------|--------|
| **Abandoned Cart** | Added to Cart, no checkout within 1h | 3-email series (1h, 24h, 72h) |
| **Browse Abandonment** | Viewed Product, no ATC within 4h | 1 email at 4h |
| **Post-Purchase Upsell** | Placed Order, fulfilled | 2 emails (3d, 14d) — Rebuy-powered recommendations |

See [docs/klaviyo-flows.md](docs/klaviyo-flows.md) for flow configuration and debugging.

---

## Rebuy widgets

| Widget | Location | Rule type |
|--------|----------|-----------|
| "Complete the look" | Product page, below form | Frequently Bought Together |
| "You might also need" | Cart page, below line items | Complementary Products |

See [docs/rebuy-setup.md](docs/rebuy-setup.md) for rule creation and Smart Cart setup.

---

## Setup

```bash
# 1. Install Shopify CLI
npm install

# 2. Push theme to your dev store
shopify theme push --store your-store.myshopify.com

# 3. In Shopify Customizer → Theme settings:
#    Email Marketing → Klaviyo Public API Key
#    Personalization → Rebuy API Key + Widget Rule IDs

# 4. Local development
shopify theme dev --store your-store.myshopify.com
```

---

## Debugging

### Klaviyo events
```js
// Verbose logging for klaviyo-events.js
localStorage.setItem('klaviyo_debug', '1');
```
Then check Klaviyo → Profiles → Activity tab to verify events arrive with correct properties.

### Rebuy widgets
Append `?rebuy_debug=true` to any store URL to see Rebuy's recommendation decision log.
```js
// Verbose logging for rebuy-integration.js
localStorage.setItem('rebuy_debug', '1');
```

### Common issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Rebuy widget shows no products | Wrong Rule ID | Check Rule ID in Rebuy Dashboard → Rules |
| Klaviyo events not in profile | Customer not identified | Verify `klaviyo-init.liquid` runs + customer is logged in |
| Skeleton never disappears | Rebuy JS not loading | Check API key in settings; inspect Network for rebuyengine.com requests |
| Duplicate ATC events | Both Rebuy and standard ATC fire | `rebuy-integration.js` re-dispatches `cart:item-added` — ensure it's not also caught by a second listener |

---

## Tech stack

- Shopify Dawn (theme base)
- Shopify Liquid, JavaScript
- Rebuy Personalization Engine
- Klaviyo
- Shopify CLI 3.x
- CSS (no framework)
