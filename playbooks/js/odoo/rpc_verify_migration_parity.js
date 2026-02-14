(() => (async () => {
  const expected = {
    categories: ["Smartphones", "Laptops", "Headphones", "Cameras", "TVs", "Gaming"],
    suppliers: ["Ingram Micro", "CVA", "CTOnline", "TechData"],
    productCodes: [
      "ELECTRO-PROD-023",
      "ELECTRO-PROD-024",
      "ELECTRO-PROD-021",
      "ELECTRO-PROD-022",
      "ELECTRO-PROD-025",
      "ELECTRO-PROD-026",
      "ELECTRO-PROD-027",
      "ELECTRO-PROD-028",
      "ELECTRO-PROD-011",
      "ELECTRO-PROD-016",
      "ELECTRO-PROD-019",
      "ELECTRO-PROD-020"
    ]
  };

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

  const session = await rpc("/web/session/get_session_info", {});
  if (!session || !session.uid) {
    return JSON.stringify({
      ok: false,
      reason: "not_authenticated",
      session_uid: session && session.uid ? session.uid : 0
    });
  }

  const categoryRows = await callKw("product.category", "search_read", [[["name", "in", expected.categories]]], {
    fields: ["id", "name"],
    limit: expected.categories.length + 10
  });
  const categoryNames = (categoryRows || []).map((row) => String(row.name || ""));
  const missingCategories = expected.categories.filter((name) => !categoryNames.includes(name));

  const supplierRows = await callKw("res.partner", "search_read", [[["name", "in", expected.suppliers]]], {
    fields: ["id", "name", "supplier_rank"],
    limit: expected.suppliers.length + 10
  });
  const activeSupplierNames = (supplierRows || [])
    .filter((row) => Number(row.supplier_rank || 0) > 0)
    .map((row) => String(row.name || ""));
  const missingSuppliers = expected.suppliers.filter((name) => !activeSupplierNames.includes(name));

  const productRows = await callKw("product.template", "search_read", [[["default_code", "in", expected.productCodes]]], {
    fields: ["id", "name", "default_code"],
    limit: expected.productCodes.length + 20
  });
  const productCodeToId = {};
  for (const row of productRows || []) {
    productCodeToId[String(row.default_code || "")] = row.id;
  }
  const missingProducts = expected.productCodes.filter((code) => !productCodeToId[code]);

  const tmplIds = Object.values(productCodeToId);
  const supplierLines = tmplIds.length
    ? await callKw("product.supplierinfo", "search_read", [[["product_tmpl_id", "in", tmplIds]]], {
        fields: ["id", "product_tmpl_id"],
        limit: 2000
      })
    : [];

  const supplierLineCountByTemplate = {};
  for (const row of supplierLines || []) {
    const ref = row && row.product_tmpl_id;
    let tmplId = 0;
    if (Array.isArray(ref))
      tmplId = Number(ref[0] || 0);
    else
      tmplId = Number(ref || 0);
    if (!tmplId) continue;
    supplierLineCountByTemplate[tmplId] = Number(supplierLineCountByTemplate[tmplId] || 0) + 1;
  }

  const supplierLinesByCode = {};
  for (const code of expected.productCodes) {
    const tmplId = productCodeToId[code];
    supplierLinesByCode[code] = tmplId ? Number(supplierLineCountByTemplate[tmplId] || 0) : 0;
  }
  const productsWithoutSupplierLines = expected.productCodes.filter((code) => Number(supplierLinesByCode[code] || 0) <= 0);

  const importedCount = await callKw("product.template", "search_count", [[["default_code", "ilike", "ELECTRO-%"]]], {});

  const ok =
    missingCategories.length === 0 &&
    missingSuppliers.length === 0 &&
    missingProducts.length === 0 &&
    productsWithoutSupplierLines.length === 0;

  return JSON.stringify({
    ok,
    session_uid: session.uid,
    imported_count: Number(importedCount || 0),
    expected_counts: {
      categories: expected.categories.length,
      suppliers: expected.suppliers.length,
      products: expected.productCodes.length
    },
    missing_categories: missingCategories,
    missing_suppliers: missingSuppliers,
    missing_products: missingProducts,
    products_without_supplier_lines: productsWithoutSupplierLines,
    supplier_lines_by_code: supplierLinesByCode
  });
})().catch((error) => {
  return JSON.stringify({
    ok: false,
    reason: "exception",
    error: String((error && error.message) || error || "unknown_error")
  });
}))()
