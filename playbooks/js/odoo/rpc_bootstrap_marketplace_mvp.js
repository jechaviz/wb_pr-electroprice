(() => (async () => {
  const suppliers = [
    { name: "Alibaba Global", email: "sourcing@alibaba.com" },
    { name: "AliExpress CN", email: "ops@aliexpress.com" },
    { name: "Amazon Business MX", email: "business-mx@amazon.com" }
  ];
  const channels = [
    { name: "Shopee Channel" },
    { name: "MercadoLibre Channel" }
  ];
  const carriers = [
    { name: "Electroprice Economy CN->MX", fixed_price: 159, tracking_url: "https://electroprice.mx/track/economy/{tracking_number}" },
    { name: "Electroprice Express Global", fixed_price: 299, tracking_url: "https://electroprice.mx/track/express/{tracking_number}" }
  ];
  const pricelists = [
    { name: "Electroprice D2C" },
    { name: "Electroprice Shopee" },
    { name: "Electroprice MercadoLibre" }
  ];
  const websitePages = [
    {
      name: "Electroprice Dashboard",
      url: "/my/electroprice-dashboard",
      key: "electroprice.dashboard",
      html:
`<t t-name="website.electroprice_dashboard">
  <t t-call="website.layout">
    <div id="wrap" class="oe_structure">
      <section class="container py-5">
        <h1>Electroprice Dashboard</h1>
        <p>Consulta el estado de tus pedidos y envios.</p>
        <p><a href="/my/orders">Ver mis pedidos</a></p>
        <p><a href="/track-order">Seguimiento de envio</a></p>
      </section>
    </div>
  </t>
</t>`
    },
    {
      name: "Electroprice Shipment Tracking",
      url: "/track-order",
      key: "electroprice.track_order",
      html:
`<t t-name="website.electroprice_tracking">
  <t t-call="website.layout">
    <div id="wrap" class="oe_structure">
      <section class="container py-5">
        <h1>Seguimiento de envio</h1>
        <p>Consulta en tu portal de cliente:</p>
        <ul>
          <li><a href="/my/orders">Pedidos</a></li>
          <li><a href="/my/home">Panel de cliente</a></li>
        </ul>
      </section>
    </div>
  </t>
</t>`
    }
  ];
  const connectorParams = {
    "electroprice.connector.alibaba.catalog_url": "https://api.alibaba.com/catalog",
    "electroprice.connector.aliexpress.catalog_url": "https://api.aliexpress.com/catalog",
    "electroprice.connector.amazon.order_url": "https://sellingpartnerapi-na.amazon.com/orders/v0/orders",
    "electroprice.connector.mercadolibre.order_url": "https://api.mercadolibre.com/orders/search",
    "electroprice.shipping.economy_cn_mx": "159",
    "electroprice.shipping.express_global": "299",
    "electroprice.portal.dashboard_path": "/my/electroprice-dashboard",
    "electroprice.portal.tracking_path": "/track-order",
    "electroprice.portal.enabled": "1",
    "electroprice.logistics.workflow": "dropship_rebrand_repackage_redispatch",
    "electroprice.portal.mode": "config_only"
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

  const modelFields = async (model, names) => {
    const rows = await callKw("ir.model.fields", "search_read", [[
      ["model", "=", model],
      ["name", "in", names]
    ]], { fields: ["name"], limit: 200 });
    const set = {};
    for (const row of rows || []) {
      if (row && row.name)
        set[row.name] = true;
    }
    return set;
  };

  const modelExists = async (model) => {
    const rows = await callKw("ir.model", "search_read", [[["model", "=", model]]], {
      fields: ["id", "model"],
      limit: 1
    });
    return !!(rows && rows.length > 0);
  };

  const ensurePartnerTag = async (name) => {
    const existing = await callKw("res.partner.category", "search_read", [[["name", "=", name]]], {
      fields: ["id", "name"],
      limit: 1
    });
    if (existing && existing.length > 0)
      return existing[0].id;
    return callKw("res.partner.category", "create", [{ name }], {});
  };

  const ensureWebsitePage = async (page, fieldSet) => {
    const existing = await callKw("website.page", "search_read", [[["url", "=", page.url]]], {
      fields: ["id", "name", "url"],
      limit: 1
    });
    const vals = {};
    if (fieldSet.name) vals.name = page.name;
    if (fieldSet.url) vals.url = page.url;
    if (fieldSet.key) vals.key = page.key;
    if (fieldSet.arch_db) vals.arch_db = page.html;
    else if (fieldSet.arch) vals.arch = page.html;
    if (fieldSet.website_published) vals.website_published = true;
    if (fieldSet.is_published) vals.is_published = true;
    if (!vals.arch_db && !vals.arch)
      throw new Error("website.page missing arch field");
    if (existing && existing.length > 0) {
      if (Object.keys(vals).length > 0)
        await callKw("website.page", "write", [[existing[0].id], vals], {});
      return "updated";
    }
    await callKw("website.page", "create", [vals], {});
    return "created";
  };

  const session = await rpc("/web/session/get_session_info", {});
  if (!session || !session.uid) {
    return JSON.stringify({
      ok: false,
      reason: "not_authenticated",
      session_uid: session && session.uid ? session.uid : 0
    });
  }

  const hasDeliveryCarrierModel = await modelExists("delivery.carrier");
  const hasWebsitePageModel = await modelExists("website.page");

  const partnerFieldSet = await modelFields("res.partner", [
    "supplier_rank", "company_type", "is_company", "email", "category_id", "customer_rank"
  ]);
  const carrierFieldSet = hasDeliveryCarrierModel
    ? await modelFields("delivery.carrier", ["name", "delivery_type", "fixed_price", "margin", "product_id", "tracking_url"])
    : {};
  const pricelistFieldSet = await modelFields("product.pricelist", ["name", "selectable", "active"]);
  const websitePageFieldSet = hasWebsitePageModel
    ? await modelFields("website.page", ["name", "url", "key", "arch_db", "arch", "website_published", "is_published"])
    : {};

  const supplierTagId = await ensurePartnerTag("SUPPLIER_GLOBAL");
  const channelTagId = await ensurePartnerTag("CHANNEL_MARKETPLACE");

  const supplierOps = { created: 0, updated: 0 };
  for (const supplier of suppliers) {
    const existing = await callKw("res.partner", "search_read", [[["name", "=", supplier.name]]], {
      fields: ["id", "name"],
      limit: 1
    });
    const vals = { name: supplier.name };
    if (partnerFieldSet.company_type) vals.company_type = "company";
    if (partnerFieldSet.is_company) vals.is_company = true;
    if (partnerFieldSet.supplier_rank) vals.supplier_rank = 1;
    if (partnerFieldSet.email) vals.email = supplier.email;
    if (partnerFieldSet.category_id) vals.category_id = [[6, 0, [supplierTagId]]];

    if (existing && existing.length > 0) {
      await callKw("res.partner", "write", [[existing[0].id], vals], {});
      supplierOps.updated += 1;
    } else {
      await callKw("res.partner", "create", [vals], {});
      supplierOps.created += 1;
    }
  }

  const channelOps = { created: 0, updated: 0 };
  for (const channel of channels) {
    const existing = await callKw("res.partner", "search_read", [[["name", "=", channel.name]]], {
      fields: ["id", "name"],
      limit: 1
    });
    const vals = { name: channel.name };
    if (partnerFieldSet.company_type) vals.company_type = "company";
    if (partnerFieldSet.is_company) vals.is_company = true;
    if (partnerFieldSet.customer_rank) vals.customer_rank = 1;
    if (partnerFieldSet.category_id) vals.category_id = [[6, 0, [channelTagId]]];

    if (existing && existing.length > 0) {
      await callKw("res.partner", "write", [[existing[0].id], vals], {});
      channelOps.updated += 1;
    } else {
      await callKw("res.partner", "create", [vals], {});
      channelOps.created += 1;
    }
  }

  const carrierOps = { created: 0, updated: 0, skipped: 0, fallback_to_config_param: false, errors: [] };
  if (hasDeliveryCarrierModel) {
    let shippingProductId = 0;
    try {
      const existingShippingProduct = await callKw("product.product", "search_read", [[["name", "=", "Electroprice Shipping Service"]]], {
        fields: ["id", "name"],
        limit: 1
      });
      if (existingShippingProduct && existingShippingProduct.length > 0) {
        shippingProductId = Number(existingShippingProduct[0].id || 0);
      } else {
        const templateFieldSet = await modelFields("product.template", [
          "name", "detailed_type", "type", "sale_ok", "purchase_ok", "list_price", "product_variant_id"
        ]);
        const tmplVals = { name: "Electroprice Shipping Service", list_price: 0, sale_ok: false, purchase_ok: false };
        if (templateFieldSet.detailed_type) tmplVals.detailed_type = "service";
        else if (templateFieldSet.type) tmplVals.type = "service";
        if (!templateFieldSet.list_price) delete tmplVals.list_price;
        if (!templateFieldSet.sale_ok) delete tmplVals.sale_ok;
        if (!templateFieldSet.purchase_ok) delete tmplVals.purchase_ok;

        const tmplId = await callKw("product.template", "create", [tmplVals], {});
        const tmplRows = await callKw("product.template", "search_read", [[["id", "=", tmplId]]], {
          fields: ["id", "product_variant_id"],
          limit: 1
        });
        if (tmplRows && tmplRows.length > 0 && Array.isArray(tmplRows[0].product_variant_id))
          shippingProductId = Number(tmplRows[0].product_variant_id[0] || 0);
        if (!shippingProductId) {
          const productRows = await callKw("product.product", "search_read", [[["product_tmpl_id", "=", tmplId]]], {
            fields: ["id"],
            limit: 1
          });
          if (productRows && productRows.length > 0)
            shippingProductId = Number(productRows[0].id || 0);
        }
      }
    } catch (error) {
      carrierOps.errors.push(String((error && error.message) || error || "shipping_product_setup_failed"));
    }

    if (!shippingProductId) {
      carrierOps.fallback_to_config_param = true;
      carrierOps.skipped = carriers.length;
    }

    for (const carrier of carriers) {
      if (carrierOps.fallback_to_config_param)
        break;

      const existing = await callKw("delivery.carrier", "search_read", [[["name", "=", carrier.name]]], {
        fields: ["id", "name"],
        limit: 1
      });
      const vals = { name: carrier.name };
      if (carrierFieldSet.delivery_type) vals.delivery_type = "fixed";
      if (carrierFieldSet.fixed_price) vals.fixed_price = Number(carrier.fixed_price || 0);
      if (carrierFieldSet.margin) vals.margin = 0;
      if (carrierFieldSet.product_id) vals.product_id = shippingProductId;
      if (carrierFieldSet.tracking_url && carrier.tracking_url) vals.tracking_url = carrier.tracking_url;
      if (Object.keys(vals).length <= 1) {
        carrierOps.skipped += 1;
        continue;
      }

      try {
        if (existing && existing.length > 0) {
          await callKw("delivery.carrier", "write", [[existing[0].id], vals], {});
          carrierOps.updated += 1;
        } else {
          await callKw("delivery.carrier", "create", [vals], {});
          carrierOps.created += 1;
        }
      } catch (error) {
        carrierOps.errors.push(String((error && error.message) || error || "carrier_create_failed"));
        carrierOps.fallback_to_config_param = true;
        carrierOps.skipped += 1;
      }
    }
  } else {
    carrierOps.skipped = carriers.length;
    carrierOps.fallback_to_config_param = true;
  }

  const pricelistOps = { created: 0, updated: 0 };
  for (const pricelist of pricelists) {
    const existing = await callKw("product.pricelist", "search_read", [[["name", "=", pricelist.name]]], {
      fields: ["id", "name"],
      limit: 1
    });
    const vals = { name: pricelist.name };
    if (pricelistFieldSet.selectable) vals.selectable = true;
    if (pricelistFieldSet.active) vals.active = true;

    if (existing && existing.length > 0) {
      await callKw("product.pricelist", "write", [[existing[0].id], vals], {});
      pricelistOps.updated += 1;
    } else {
      await callKw("product.pricelist", "create", [vals], {});
      pricelistOps.created += 1;
    }
  }

  const portalOps = { created: 0, updated: 0, skipped: 0, mode: "config_only", errors: [] };
  if (hasWebsitePageModel) {
    for (const page of websitePages) {
      try {
        const result = await ensureWebsitePage(page, websitePageFieldSet);
        if (result === "created") portalOps.created += 1;
        else if (result === "updated") portalOps.updated += 1;
        else portalOps.skipped += 1;
      } catch (error) {
        portalOps.skipped += 1;
        portalOps.errors.push(String((error && error.message) || error || "website_page_create_failed"));
      }
    }
    if (portalOps.errors.length === 0 && (portalOps.created + portalOps.updated) > 0)
      portalOps.mode = "website_pages";
  } else {
    portalOps.skipped = websitePages.length;
  }
  connectorParams["electroprice.portal.mode"] = portalOps.mode;

  const connectorOps = { updated: 0 };
  for (const [key, value] of Object.entries(connectorParams)) {
    await callKw("ir.config_parameter", "set_param", [key, value], {});
    connectorOps.updated += 1;
  }

  return JSON.stringify({
    ok: true,
    session_uid: session.uid,
    has_delivery_carrier_model: hasDeliveryCarrierModel,
    has_website_page_model: hasWebsitePageModel,
    suppliers: supplierOps,
    channels: channelOps,
    carriers: carrierOps,
    pricelists: pricelistOps,
    portal_pages: portalOps,
    connector_params: connectorOps
  });
})().catch((error) => {
  return JSON.stringify({
    ok: false,
    reason: "exception",
    error: String((error && error.message) || error || "unknown_error")
  });
}))()
