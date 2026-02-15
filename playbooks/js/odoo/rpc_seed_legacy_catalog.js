(() => (async () => {
  const seed = {
    categories: [
      { key: "smartphones", name: "Smartphones" },
      { key: "laptops", name: "Laptops" },
      { key: "headphones", name: "Headphones" },
      { key: "cameras", name: "Cameras" },
      { key: "tvs", name: "TVs" },
      { key: "gaming", name: "Gaming" }
    ],
    suppliers: [
      { code: "wh-ingram", name: "Ingram Micro", email: "ventas@ingrammicro.com.mx" },
      { code: "wh-cva", name: "CVA", email: "contacto@grupocva.com" },
      { code: "wh-ctoneline", name: "CTOnline", email: "info@ctoneline.com" },
      { code: "wh-techdata", name: "TechData", email: "sales@techdata.com" }
    ],
    products: [
      {
        id: "prod-023",
        name: "Samsung Galaxy S24 Ultra",
        brand: "Samsung",
        category: "smartphones",
        description: "Experience the new era of mobile AI with Galaxy S24 Ultra.",
        offers: [
          { supplier_code: "wh-ingram", cost: 1299.0 },
          { supplier_code: "wh-cva", cost: 1305.0 },
          { supplier_code: "wh-ctoneline", cost: 1295.99 }
        ]
      },
      {
        id: "prod-024",
        name: "OnePlus 12",
        brand: "OnePlus",
        category: "smartphones",
        description: "Smooth beyond belief, with a powerful Hasselblad camera system.",
        offers: [
          { supplier_code: "wh-techdata", cost: 799.0 }
        ]
      },
      {
        id: "prod-021",
        name: "HP Spectre x360 14",
        brand: "HP",
        category: "laptops",
        description: "A versatile 2-in-1 laptop with a stunning OLED display.",
        offers: [
          { supplier_code: "wh-ingram", cost: 1399.99 },
          { supplier_code: "wh-techdata", cost: 1405.5 }
        ]
      },
      {
        id: "prod-022",
        name: "Lenovo ThinkPad X1 Carbon",
        brand: "Lenovo",
        category: "laptops",
        description: "Ultralight, ultrapowerful, and ultra-durable business laptop.",
        offers: [
          { supplier_code: "wh-ingram", cost: 1899.0 },
          { supplier_code: "wh-cva", cost: 1889.9 }
        ]
      },
      {
        id: "prod-025",
        name: "Canon EOS R5",
        brand: "Canon",
        category: "cameras",
        description: "A professional full-frame mirrorless camera with 8K video.",
        offers: [
          { supplier_code: "wh-ingram", cost: 3899.0 }
        ]
      },
      {
        id: "prod-026",
        name: "Samsung 65 QN90C Neo QLED TV",
        brand: "Samsung",
        category: "tvs",
        description: "Brilliant details and cinematic sound with Quantum Matrix technology.",
        offers: [
          { supplier_code: "wh-cva", cost: 1599.0 },
          { supplier_code: "wh-ctoneline", cost: 1610.0 }
        ]
      },
      {
        id: "prod-027",
        name: "LG C3 55 OLED evo TV",
        brand: "LG",
        category: "tvs",
        description: "Incredible OLED image quality, perfect for movies and gaming.",
        offers: [
          { supplier_code: "wh-ingram", cost: 1499.0 }
        ]
      },
      {
        id: "prod-028",
        name: "Bose QuietComfort Ultra",
        brand: "Bose",
        category: "headphones",
        description: "World-class noise cancellation and high-fidelity audio.",
        offers: [
          { supplier_code: "wh-techdata", cost: 379.0 }
        ]
      },
      {
        id: "prod-011",
        name: "Apple iPhone 17 Pro Max",
        brand: "Apple",
        category: "smartphones",
        description: "The ultimate iPhone with pro camera system.",
        offers: [
          { supplier_code: "wh-ingram", cost: 1099.0 }
        ]
      },
      {
        id: "prod-016",
        name: "Sony WH-1000XM5 Headphones",
        brand: "Sony",
        category: "headphones",
        description: "Industry-leading noise cancellation.",
        offers: [
          { supplier_code: "wh-cva", cost: 285.0 }
        ]
      },
      {
        id: "prod-019",
        name: "Dell XPS 15 Laptop",
        brand: "Dell",
        category: "laptops",
        description: "Stunning display and immersive sound in a premium design.",
        offers: [
          { supplier_code: "wh-ingram", cost: 1499.99 },
          { supplier_code: "wh-cva", cost: 1510.0 }
        ]
      },
      {
        id: "prod-020",
        name: "Samsung Odyssey G9 Curved Monitor",
        brand: "Samsung",
        category: "gaming",
        description: "49-inch super ultrawide monitor with a 1000R curve.",
        offers: [
          { supplier_code: "wh-ctoneline", cost: 1189.99 }
        ]
      }
    ],
    list_price_markup_pct: 22
  };

  const rpc = async (route, params, opts) => {
    const timeoutMs = Number((opts && opts.timeout_ms) || 25000);
    const maxRetries = Number((opts && opts.max_retries) || 2);
    let lastError = "";
    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      let timer = 0;
      try {
        if (controller && timeoutMs > 0) {
          timer = setTimeout(() => controller.abort("timeout"), timeoutMs);
        }
        const response = await fetch(route, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          signal: controller ? controller.signal : undefined,
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "call",
            params: params || {},
            id: Date.now() + Math.floor(Math.random() * 1000)
          })
        });
        if (timer) clearTimeout(timer);
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
        if (timer) clearTimeout(timer);
        lastError = String((error && error.message) || error || "unknown_rpc_error");
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 200 * attempt));
          continue;
        }
      }
    }
    throw new Error("rpc_failed route=" + route + " error=" + lastError);
  };

  const callKw = (model, method, args, kwargs) =>
    rpc("/web/dataset/call_kw/" + model + "/" + method, {
      model,
      method,
      args: args || [],
      kwargs: kwargs || {}
    });

  const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
  const nonEmpty = (value) => String(value || "").trim() !== "";

  const session = await rpc("/web/session/get_session_info", {});
  if (!session || !session.uid) {
    return JSON.stringify({
      ok: false,
      reason: "not_authenticated",
      session_uid: session && session.uid ? session.uid : 0
    });
  }

  const partnerFieldSet = {
    supplier_rank: true,
    email: true
  };
  const productFieldSet = {
    default_code: true,
    categ_id: true,
    list_price: true,
    sale_ok: true,
    purchase_ok: true,
    website_published: true,
    detailed_type: false,
    type: true,
    description_sale: true,
    description: true
  };
  const supplierInfoFieldSet = {
    product_tmpl_id: true,
    partner_id: true,
    min_qty: true,
    delay: true,
    price: true,
    product_code: true
  };

  const categoryIdByKey = {};
  const categoryOps = { created: 0, updated: 0 };
  for (const category of seed.categories) {
    const existing = await callKw("product.category", "search_read", [[["name", "=", category.name]]], {
      fields: ["id", "name"],
      limit: 1
    });
    let categoryId = 0;
    if (existing && existing.length > 0) {
      categoryId = existing[0].id;
      categoryOps.updated += 1;
    } else {
      categoryId = await callKw("product.category", "create", [{ name: category.name }], {});
      categoryOps.created += 1;
    }
    categoryIdByKey[category.key] = categoryId;
  }

  const supplierIdByCode = {};
  const supplierOps = { created: 0, updated: 0 };
  for (const supplier of seed.suppliers) {
    const existing = await callKw("res.partner", "search_read", [[["name", "=", supplier.name]]], {
      fields: ["id", "name", "supplier_rank"],
      limit: 1
    });
    const vals = { name: supplier.name };
    if (partnerFieldSet.supplier_rank) vals.supplier_rank = 1;
    if (partnerFieldSet.email && nonEmpty(supplier.email)) vals.email = supplier.email;

    let partnerId = 0;
    if (existing && existing.length > 0) {
      partnerId = existing[0].id;
      await callKw("res.partner", "write", [[partnerId], vals], {});
      supplierOps.updated += 1;
    } else {
      partnerId = await callKw("res.partner", "create", [vals], {});
      supplierOps.created += 1;
    }
    supplierIdByCode[supplier.code] = partnerId;
  }

  const productOps = { created: 0, updated: 0 };
  const supplierLineOps = { created: 0, updated: 0 };
  const seededProductCodes = [];
  for (const product of seed.products) {
    const categoryId = categoryIdByKey[product.category];
    if (!categoryId) continue;

    const costs = (product.offers || []).map((offer) => Number(offer.cost || 0)).filter((v) => v > 0);
    const minCost = costs.length ? Math.min(...costs) : 0;
    const listPrice = minCost > 0 ? round2(minCost * (1 + seed.list_price_markup_pct / 100)) : 0;
    const defaultCode = "ELECTRO-" + String(product.id || "").toUpperCase();
    seededProductCodes.push(defaultCode);

    const vals = {
      name: product.name,
      default_code: defaultCode,
      categ_id: categoryId,
      list_price: listPrice,
      sale_ok: true,
      purchase_ok: true
    };
    if (!productFieldSet.default_code) delete vals.default_code;
    if (!productFieldSet.categ_id) delete vals.categ_id;
    if (!productFieldSet.list_price) delete vals.list_price;
    if (!productFieldSet.sale_ok) delete vals.sale_ok;
    if (!productFieldSet.purchase_ok) delete vals.purchase_ok;
    if (productFieldSet.website_published) vals.website_published = true;
    if (productFieldSet.detailed_type) vals.detailed_type = "consu";
    else if (productFieldSet.type) vals.type = "consu";
    if (productFieldSet.description_sale && nonEmpty(product.description)) vals.description_sale = product.description;
    else if (productFieldSet.description && nonEmpty(product.description)) vals.description = product.description;

    const existing = await callKw("product.template", "search_read", [[["default_code", "=", defaultCode]]], {
      fields: ["id", "name", "default_code"],
      limit: 1
    });

    let templateId = 0;
    if (existing && existing.length > 0) {
      templateId = existing[0].id;
      await callKw("product.template", "write", [[templateId], vals], {});
      productOps.updated += 1;
    } else {
      templateId = await callKw("product.template", "create", [vals], {});
      productOps.created += 1;
    }

    for (const offer of product.offers || []) {
      const partnerId = supplierIdByCode[offer.supplier_code];
      if (!partnerId) continue;

      const supVals = {
        product_tmpl_id: templateId,
        partner_id: partnerId,
        min_qty: 1,
        delay: 2,
        price: Number(offer.cost || 0),
        product_code: defaultCode
      };
      if (!supplierInfoFieldSet.product_tmpl_id) delete supVals.product_tmpl_id;
      if (!supplierInfoFieldSet.partner_id) delete supVals.partner_id;
      if (!supplierInfoFieldSet.min_qty) delete supVals.min_qty;
      if (!supplierInfoFieldSet.delay) delete supVals.delay;
      if (!supplierInfoFieldSet.price) delete supVals.price;
      if (!supplierInfoFieldSet.product_code) delete supVals.product_code;

      const existingInfo = await callKw("product.supplierinfo", "search_read", [[
        ["product_tmpl_id", "=", templateId],
        ["partner_id", "=", partnerId]
      ]], { fields: ["id"], limit: 1 });

      if (existingInfo && existingInfo.length > 0) {
        await callKw("product.supplierinfo", "write", [[existingInfo[0].id], supVals], {});
        supplierLineOps.updated += 1;
      } else {
        await callKw("product.supplierinfo", "create", [supVals], {});
        supplierLineOps.created += 1;
      }
    }
  }

  return JSON.stringify({
    ok: true,
    session_uid: session.uid,
    source_repo: "C:\\git\\customers\\bu\\electroprice",
    seed_summary: {
      categories: seed.categories.length,
      suppliers: seed.suppliers.length,
      products: seed.products.length,
      list_price_markup_pct: seed.list_price_markup_pct
    },
    category_ops: categoryOps,
    supplier_ops: supplierOps,
    product_ops: productOps,
    supplier_line_ops: supplierLineOps,
    seeded_product_codes: seededProductCodes
  });
})().catch((error) => {
  return JSON.stringify({
    ok: false,
    reason: "exception",
    error: String((error && error.message) || error || "unknown_error")
  });
}))()
