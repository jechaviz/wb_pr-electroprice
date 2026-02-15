(() => (async () => {
  const categoryByProductCode = {
    "ELECTRO-PROD-023": "Smartphones",
    "ELECTRO-PROD-024": "Smartphones",
    "ELECTRO-PROD-021": "Laptops",
    "ELECTRO-PROD-022": "Laptops",
    "ELECTRO-PROD-025": "Cameras",
    "ELECTRO-PROD-026": "TVs",
    "ELECTRO-PROD-027": "TVs",
    "ELECTRO-PROD-028": "Headphones",
    "ELECTRO-PROD-011": "Smartphones",
    "ELECTRO-PROD-016": "Headphones",
    "ELECTRO-PROD-019": "Laptops",
    "ELECTRO-PROD-020": "Gaming"
  };
  const publicCategoryNames = ["Smartphones", "Laptops", "Headphones", "Cameras", "TVs", "Gaming"];

  const rpc = async (route, params) => {
    const response = await fetch(route, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        params: params || {},
        id: Date.now() + Math.floor(Math.random() * 1000)
      })
    });
    const json = await response.json();
    if (json.error) {
      const message =
        (json.error.data && (json.error.data.message || json.error.data.debug)) ||
        json.error.message ||
        "jsonrpc_error";
      throw new Error(message);
    }
    return json.result;
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
      if (row && row.name) set[row.name] = true;
    }
    return set;
  };

  const session = await rpc("/web/session/get_session_info", {});
  if (!session || !session.uid) {
    return JSON.stringify({
      ok: false,
      reason: "not_authenticated",
      session_uid: session && session.uid ? session.uid : 0
    });
  }

  const productFieldSet = await modelFields("product.template", [
    "public_categ_ids", "website_published", "default_code", "name"
  ]);

  const publicCategoryIdByName = {};
  const categoryOps = { created: 0, updated: 0 };
  for (const categoryName of publicCategoryNames) {
    const existing = await callKw("product.public.category", "search_read", [[["name", "=", categoryName]]], {
      fields: ["id", "name"],
      limit: 1
    });
    let categoryId = 0;
    if (existing && existing.length > 0) {
      categoryId = existing[0].id;
      categoryOps.updated += 1;
    } else {
      categoryId = await callKw("product.public.category", "create", [{ name: categoryName }], {});
      categoryOps.created += 1;
    }
    publicCategoryIdByName[categoryName] = categoryId;
  }

  const productCodes = Object.keys(categoryByProductCode);
  const productRows = await callKw("product.template", "search_read", [[["default_code", "in", productCodes]]], {
    fields: ["id", "name", "default_code", "public_categ_ids", "website_published"],
    limit: productCodes.length + 20
  });

  const rowsByCode = {};
  for (const row of productRows || []) {
    const code = String(row.default_code || "");
    if (!code) continue;
    if (!rowsByCode[code]) rowsByCode[code] = [];
    rowsByCode[code].push(row);
  }

  const productOps = { updated: 0, missing_products: [] };
  for (const code of productCodes) {
    const rows = rowsByCode[code] || [];
    if (rows.length <= 0) {
      productOps.missing_products.push(code);
      continue;
    }
    const publicCategoryName = categoryByProductCode[code];
    const publicCategoryId = publicCategoryIdByName[publicCategoryName];
    if (!publicCategoryId) continue;

    const vals = {};
    if (productFieldSet.public_categ_ids) vals.public_categ_ids = [[6, 0, [publicCategoryId]]];
    if (productFieldSet.website_published) vals.website_published = true;

    if (Object.keys(vals).length > 0) {
      for (const row of rows) {
        await callKw("product.template", "write", [[row.id], vals], {});
        productOps.updated += 1;
      }
    }
  }

  return JSON.stringify({
    ok: true,
    session_uid: session.uid,
    public_categories: {
      expected: publicCategoryNames.length,
      created: categoryOps.created,
      updated: categoryOps.updated
    },
    products: productOps
  });
})().catch((error) => {
  return JSON.stringify({
    ok: false,
    reason: "exception",
    error: String((error && error.message) || error || "unknown_error")
  });
}))()
