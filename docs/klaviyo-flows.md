# Klaviyo Flows

## Flows implemented in this demo

### 1. Abandoned Cart

**Trigger:** Added to Cart (custom event from `klaviyo-events.js`) but NOT Started Checkout within 1 hour.

**Flow:** 3-email series

| Step | Delay | Subject line |
|------|-------|-------------|
| Email 1 | 1 hour | "You left something behind" |
| Email 2 | 24 hours | "Still thinking about it?" |
| Email 3 | 72 hours | "Last chance — your cart expires soon" |

**Dynamic content variables:**
- `{{ event.AddedItemProductName }}` — name of the last added product
- `{{ event.Items }}` — array of all cart items (use Klaviyo's loop syntax)
- `{{ event.CartURL }}` — direct link back to cart

**Filter:** Skip if customer has placed an order since the trigger event.

---

### 2. Browse Abandonment

**Trigger:** Viewed Product (from `snippets/klaviyo-events.liquid`) but NOT Added to Cart within 4 hours.

**Flow:** Single email

| Step | Delay | Subject line |
|------|-------|-------------|
| Email 1 | 4 hours | "Still interested in {{ event.Name }}?" |

**Dynamic content:**
- `{{ event.Name }}` — product title
- `{{ event.ImageURL }}` — product image
- `{{ event.URL }}` — product URL
- `{{ event.Price }}` — current price

---

### 3. Post-Purchase (Upsell via Rebuy)

**Trigger:** Placed Order (Shopify integration webhook)

**Flow:** 2-email series with Rebuy-powered recommendations

| Step | Delay | Subject line |
|------|-------|-------------|
| Email 1 | 3 days after fulfillment | "Customers who bought this also love…" |
| Email 2 | 14 days | "Time for a refill?" (repeat purchase products only) |

**Klaviyo + Rebuy:**
Rebuy exposes a product recommendation API endpoint. The Klaviyo email template calls the Rebuy API via a dynamic content block to inject personalized product recommendations using the customer's order history as input. See `docs/rebuy-setup.md` for the API endpoint format.

---

## Debugging flows

### Check if events are arriving

1. Klaviyo → Profiles → find customer by email
2. Click Activity tab → filter by event name
3. Verify the event properties match what `klaviyo-events.js` sends

### Test a flow without waiting for delays

1. Klaviyo → Flows → select flow → Edit
2. Click the trigger condition
3. Use "Force trigger" with a test profile

### Common issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Added to Cart event not appearing | Klaviyo `_learnq` not initialized | Verify `klaviyo-init.liquid` loads before `klaviyo-events.js` |
| Abandoned Cart not sending | Customer not identified | `identify()` call requires email; guests won't receive until checkout |
| Browse Abandonment fires for every page view | Missing time filter | Add flow filter: "has not added to cart in the last 4 hours" |
| Duplicate events in profile | Both snippet and JS fire the same event | Check that `klaviyo-events.liquid` and `klaviyo-events.js` don't both track Viewed Product |
