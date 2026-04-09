/**
 * klaviyo-events.js
 *
 * Client-side Klaviyo event tracking for:
 *   - Added to Cart       (feeds the Abandoned Cart flow)
 *   - Rebuy widget clicks (custom segmentation)
 *
 * Server-side events (Viewed Product, Ordered Product) are handled in
 * snippets/klaviyo-events.liquid and Klaviyo's native Shopify integration.
 *
 * Klaviyo's Abandoned Cart flow:
 *   Klaviyo's Shopify integration natively handles the checkout-level
 *   "Started Checkout" event. This file handles the cart-level "Added to Cart"
 *   event for earlier-stage abandonment (customer adds to cart but never
 *   reaches checkout).
 *
 * Debugging:
 *   Set localStorage.setItem('klaviyo_debug', '1') for verbose logging.
 *   Check the Klaviyo Activity Feed under the customer profile to verify events.
 */

(function () {
  'use strict';

  const DEBUG = localStorage.getItem('klaviyo_debug') === '1';

  function log(...args) {
    if (DEBUG) console.log('[klaviyo]', ...args);
  }

  function track(eventName, properties) {
    var _learnq = window._learnq || [];
    _learnq.push(['track', eventName, properties]);
    log('track', eventName, properties);
  }

  // ---------------------------------------------------------------------------
  // Added to Cart
  // Mirrors the Shopify cart AJAX response into a Klaviyo event.
  // This feeds the "Abandoned Cart" flow trigger: "Added to Cart but NOT
  // Started Checkout within 1 hour."
  // ---------------------------------------------------------------------------

  document.addEventListener('cart:item-added', function (e) {
    const item = e.detail && e.detail.item;
    if (!item) return;

    // Fetch the full cart to get current items for the cart value
    fetch('/cart.js')
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        track('Added to Cart', {
          // Klaviyo standard properties
          AddedItemProductName: item.product_title,
          AddedItemProductID: item.product_id,
          AddedItemVariantID: item.variant_id,
          AddedItemSKU: item.sku,
          AddedItemCategories: item.product_type ? [item.product_type] : [],
          AddedItemImageURL: item.image,
          AddedItemURL: window.location.origin + item.url,
          AddedItemPrice: (item.price / 100).toFixed(2),
          AddedItemQuantity: item.quantity,

          // Cart state at time of add
          ItemCount: cart.item_count,
          Items: cart.items.map(function (cartItem) {
            return {
              ProductID: cartItem.product_id,
              VariantID: cartItem.variant_id,
              ProductName: cartItem.product_title,
              Quantity: cartItem.quantity,
              ItemPrice: (cartItem.price / 100).toFixed(2),
              RowTotal: (cartItem.line_price / 100).toFixed(2),
              ProductURL: window.location.origin + cartItem.url,
              ImageURL: cartItem.image,
              Categories: cartItem.product_type ? [cartItem.product_type] : [],
              Brand: cartItem.vendor,
            };
          }),
          CartValue: (cart.total_price / 100).toFixed(2),
          CartURL: window.location.origin + '/cart',
        });
      })
      .catch(function (err) { log('cart fetch error', err); });
  });

  // ---------------------------------------------------------------------------
  // Subscribed to Back In Stock
  // Klaviyo's Back in Stock widget fires this event when a customer submits
  // their email. Captured here to route into a Klaviyo Back in Stock flow.
  // ---------------------------------------------------------------------------

  document.addEventListener('klaviyo:back-in-stock:subscribed', function (e) {
    const detail = e.detail || {};
    log('back-in-stock subscribed', detail);
    // The Klaviyo JS SDK handles the identify + event call automatically.
    // This listener is here for any additional custom logic (e.g. showing a toast).
    document.dispatchEvent(new CustomEvent('store:notification', {
      detail: { message: "You're on the list! We'll email you when it's back." }
    }));
  });

  log('klaviyo-events.js initialized');
})();
