/**
 * rebuy-integration.js
 *
 * Handles Rebuy Personalization Engine widget initialization, event hooks,
 * and cross-sell/upsell behavior for product and cart pages.
 *
 * Rebuy fires custom DOM events that this module listens to, bridging
 * Rebuy interactions into Klaviyo and the Shopify cart.
 *
 * Rebuy events used:
 *   rebuy:product-added   — item added to cart via a Rebuy widget
 *   rebuy:widget-viewed   — recommendation widget enters viewport
 *   rebuy:smartcart-open  — Rebuy Smart Cart drawer opened
 *
 * Debugging:
 *   Set localStorage.setItem('rebuy_debug', '1') for verbose logging.
 *   Rebuy's own debug mode: append ?rebuy_debug=true to any store URL.
 */

(function () {
  'use strict';

  const DEBUG = localStorage.getItem('rebuy_debug') === '1';

  function log(...args) {
    if (DEBUG) console.log('[rebuy]', ...args);
  }

  // ---------------------------------------------------------------------------
  // Wait for Rebuy SDK to initialize
  // Rebuy sets window.Rebuy once its JS bundle loads.
  // ---------------------------------------------------------------------------

  function waitForRebuy(callback, maxWait) {
    const start = Date.now();
    const interval = setInterval(function () {
      if (typeof window.Rebuy !== 'undefined' && window.Rebuy.ready) {
        clearInterval(interval);
        log('Rebuy SDK ready');
        callback(window.Rebuy);
      } else if (Date.now() - start > (maxWait || 8000)) {
        clearInterval(interval);
        log('Rebuy SDK did not initialize within timeout');
      }
    }, 100);
  }

  // ---------------------------------------------------------------------------
  // rebuy:product-added
  // Fires when a customer adds a product via a Rebuy recommendation widget.
  // We track this separately from the standard add_to_cart to attribute the
  // sale to the Rebuy widget (used for Rebuy ROI reporting).
  // ---------------------------------------------------------------------------

  document.addEventListener('rebuy:product-added', function (e) {
    const detail = e.detail || {};
    const item = detail.item;
    const widgetId = detail.widget_id;

    if (!item) return;

    log('rebuy:product-added', item, 'widget:', widgetId);

    // Track in Klaviyo for Rebuy-sourced add-to-cart segmentation
    var _learnq = window._learnq || [];
    _learnq.push(['track', 'Added to Cart via Rebuy', {
      ProductName: item.product_title,
      ProductID: item.product_id,
      VariantID: item.variant_id,
      SKU: item.sku,
      Price: (item.price / 100).toFixed(2),
      Quantity: item.quantity,
      RebuyWidgetID: widgetId,
      ImageURL: item.image,
      URL: window.location.origin + item.url,
    }]);

    // Also fire the standard Shopify cart:item-added event so analytics.js
    // picks it up for GA4 tracking
    document.dispatchEvent(new CustomEvent('cart:item-added', {
      detail: { item: item }
    }));
  });

  // ---------------------------------------------------------------------------
  // rebuy:widget-viewed
  // Track impression events for Rebuy widgets — useful for measuring
  // widget click-through rate in GA4.
  // ---------------------------------------------------------------------------

  document.addEventListener('rebuy:widget-viewed', function (e) {
    const detail = e.detail || {};
    log('rebuy:widget-viewed', detail);

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'rebuy_widget_viewed',
      rebuy_widget_id: detail.widget_id,
      rebuy_widget_type: detail.widget_type,
      rebuy_product_count: detail.products && detail.products.length,
    });
  });

  // ---------------------------------------------------------------------------
  // rebuy:smartcart-open
  // Fire view_cart when Rebuy's Smart Cart drawer opens (replaces Dawn's
  // native cart drawer on pages where Rebuy Smart Cart is enabled).
  // ---------------------------------------------------------------------------

  document.addEventListener('rebuy:smartcart-open', function (e) {
    const cart = e.detail && e.detail.cart;
    if (!cart) return;

    log('rebuy:smartcart-open', cart);

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event: 'view_cart',
      ecommerce: {
        currency: window.Shopify && window.Shopify.currency && window.Shopify.currency.active || 'USD',
        value: (cart.total_price / 100).toFixed(2),
        items: (cart.items || []).map(function (item) {
          return {
            item_id: item.sku || String(item.variant_id),
            item_name: item.product_title,
            item_variant: item.variant_title,
            price: (item.price / 100).toFixed(2),
            quantity: item.quantity,
          };
        }),
      },
    });
  });

  // ---------------------------------------------------------------------------
  // Initialize Rebuy SDK overrides once ready
  // ---------------------------------------------------------------------------

  waitForRebuy(function (Rebuy) {
    // Customize the "Add to cart" button text on Rebuy widgets
    // (example of SDK configuration — real options depend on Rebuy plan)
    if (Rebuy.Cart && Rebuy.Cart.configure) {
      Rebuy.Cart.configure({
        addToCartText: 'Add',
        soldOutText: 'Sold out',
      });
    }

    log('Rebuy integration initialized');
  });

})();
