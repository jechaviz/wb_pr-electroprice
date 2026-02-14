(() => (async () => {
  const expected = {
    suppliers: [
      "Alibaba Global",
      "AliExpress CN",
      "Amazon Business MX"
    ],
    channels: [
      "Shopee Channel",
      "MercadoLibre Channel"
    ],
    carriers: [
      "Electroprice Economy CN->MX",
      "Electroprice Express Global"
    ],
    pricelists: [
      "Electroprice D2C",
      "Electroprice Shopee",
      "Electroprice MercadoLibre"
    ],
    connectorKeys: [
      "electroprice.connector.alibaba.catalog_url",
      "electroprice.connector.aliexpress.catalog_url",
      "electroprice.connector.amazon.order_url",
      "electroprice.connector.mercadolibre.order_url",
      "electroprice.shipping.economy_cn_mx",
      "electroprice.shipping.express_global",
      "electroprice.portal.dashboard_path",
      "electroprice.portal.tracking_path",
      "electroprice.portal.enabled",
      "electroprice.logistics.workflow",
      "electroprice.portal.mode"
    ],
    portalPages: [
      "/my/electroprice-dashboard",
      "/track-order"
    ]
  };

  const RPC_TIMEOUT_MS = 15000;
  const RPC_RETRIES = 2;

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const rpc = async (route, params) => {
    let lastError = null;
    for (let attempt = 1; attempt <= RPC_RETRIES + 1; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);
        const response = await fetch(route, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          signal: controller.signal,
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "call",
            params: params || {},
            id: Date.now() + Math.floor(Math.random() * 1000)
          })
        });
        clearTimeout(timer);
        const json = await response.json();
        if (json.error) {
          const message =
            (json.error.data && (json.error.data.message || json.error.data.debug)) ||
            json.error.message ||
            "jsonrpc_error";
          throw new Error(message);
        }
        return json.result;
      } catch (error) {
        lastError = error;
        if (attempt <= RPC_RETRIES)
          await wait(250 * attempt);
      }
    }
    throw new Error("RPC failed: " + String((lastError && lastError.message) || lastError || "unknown_rpc_error"));
  };

  const callKw = (model, method, args, kwargs) =>
    rpc("/web/dataset/call_kw/" + model + "/" + method, {
      model,
      method,
      args: args || [],
      kwargs: kwargs || {}
    });

  const session = await rpc("/web/session/get_session_info", {});
  if (!session || !session.uid) {
    return JSON.stringify({
      ok: false,
      reason: "not_authenticated",
      session_uid: session && session.uid ? session.uid : 0
    });
  }

  const supplierRows = await callKw("res.partner", "search_read", [[["name", "in", expected.suppliers]]], {
    fields: ["id", "name", "supplier_rank"],
    limit: 100
  });
  const supplierNames = (supplierRows || [])
    .filter((row) => Number(row.supplier_rank || 0) > 0)
    .map((row) => String(row.name || ""));
  const missingSuppliers = expected.suppliers.filter((name) => !supplierNames.includes(name));

  const channelRows = await callKw("res.partner", "search_read", [[["name", "in", expected.channels]]], {
    fields: ["id", "name"],
    limit: 100
  });
  const channelNames = (channelRows || []).map((row) => String(row.name || ""));
  const missingChannels = expected.channels.filter((name) => !channelNames.includes(name));

  const carrierModelRows = await callKw("ir.model", "search_read", [[["model", "=", "delivery.carrier"]]], {
    fields: ["id", "model"],
    limit: 1
  });
  const hasCarrierModel = !!(carrierModelRows && carrierModelRows.length > 0);
  let missingCarriers = [];
  let carriersWithoutTrackingUrl = [];
  if (hasCarrierModel) {
    const carrierRows = await callKw("delivery.carrier", "search_read", [[["name", "in", expected.carriers]]], {
      fields: ["id", "name", "tracking_url"],
      limit: 100
    });
    const carrierNames = (carrierRows || []).map((row) => String(row.name || ""));
    missingCarriers = expected.carriers.filter((name) => !carrierNames.includes(name));
    carriersWithoutTrackingUrl = (carrierRows || [])
      .filter((row) => !String(row.tracking_url || "").trim())
      .map((row) => String(row.name || ""));
  }

  const pricelistRows = await callKw("product.pricelist", "search_read", [[["name", "in", expected.pricelists]]], {
    fields: ["id", "name"],
    limit: 100
  });
  const pricelistNames = (pricelistRows || []).map((row) => String(row.name || ""));
  const missingPricelists = expected.pricelists.filter((name) => !pricelistNames.includes(name));

  const missingConnectorKeys = [];
  const connectorValueMap = {};
  for (const key of expected.connectorKeys) {
    const value = await callKw("ir.config_parameter", "get_param", [key], {});
    connectorValueMap[key] = String(value || "").trim();
    if (!String(value || "").trim())
      missingConnectorKeys.push(key);
  }

  const pageModelRows = await callKw("ir.model", "search_read", [[["model", "=", "website.page"]]], {
    fields: ["id", "model"],
    limit: 1
  });
  const hasWebsitePageModel = !!(pageModelRows && pageModelRows.length > 0);
  const portalMode = connectorValueMap["electroprice.portal.mode"] || "config_only";
  let missingPortalPages = [];
  if (hasWebsitePageModel) {
    const pageRows = await callKw("website.page", "search_read", [[["url", "in", expected.portalPages]]], {
      fields: ["id", "url"],
      limit: 30
    });
    const pageUrls = (pageRows || []).map((row) => String(row.url || ""));
    missingPortalPages = expected.portalPages.filter((url) => !pageUrls.includes(url));
  }

  const ok =
    missingSuppliers.length === 0 &&
    missingChannels.length === 0 &&
    (hasCarrierModel ? missingCarriers.length === 0 : true) &&
    (hasCarrierModel ? carriersWithoutTrackingUrl.length === 0 : true) &&
    missingPricelists.length === 0 &&
    missingConnectorKeys.length === 0 &&
    (hasWebsitePageModel && portalMode === "website_pages" ? missingPortalPages.length === 0 : true);

  return JSON.stringify({
    ok,
    session_uid: session.uid,
    missing_suppliers: missingSuppliers,
    missing_channels: missingChannels,
    missing_carriers: missingCarriers,
    carriers_without_tracking_url: carriersWithoutTrackingUrl,
    has_delivery_carrier_model: hasCarrierModel,
    missing_pricelists: missingPricelists,
    missing_connector_keys: missingConnectorKeys,
    portal_mode: portalMode,
    has_website_page_model: hasWebsitePageModel,
    missing_portal_pages: missingPortalPages
  });
})().catch((error) => {
  return JSON.stringify({
    ok: false,
    reason: "exception",
    error: String((error && error.message) || error || "unknown_error")
  });
}))()
