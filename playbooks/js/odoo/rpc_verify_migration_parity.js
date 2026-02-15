(() => {
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

  const startedAt = Date.now();
  const timingsMs = {};
  const rpcDefaultTimeoutMs = 20000;

  const timed = async (label, fn) => {
    const t0 = Date.now();
    try {
      const res = await fn();
      timingsMs[label] = Date.now() - t0;
      return res;
    } catch (e) {
      timingsMs[label] = Date.now() - t0;
      throw e;
    }
  };

  const withTimeout = (promise, ms, label) =>
    new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("rpc_timeout " + label + " timeout_ms=" + ms)), ms);
      promise.then(
        (v) => (clearTimeout(t), resolve(v)),
        (e) => (clearTimeout(t), reject(e))
      );
    });

  const rpc = async (route, params, timeoutMs) => {
    const ms = Math.max(250, Number(timeoutMs || rpcDefaultTimeoutMs));
    try {
      const response = await withTimeout(
        fetch(route, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "call",
            params: params || {},
            id: Date.now() + Math.floor(Math.random() * 1000)
          })
        }),
        ms,
        "fetch route=" + route
      );

      const text = await withTimeout(response.text(), ms, "read_text route=" + route);
      let json = null;
      try {
        json = JSON.parse(text);
      } catch (_e) {
        const preview = String(text || "").slice(0, 220);
        throw new Error("non_json_response status=" + response.status + " preview=" + preview);
      }

      if (json && json.error) {
        const message =
          (json.error.data && (json.error.data.message || json.error.data.debug)) ||
          json.error.message ||
          "jsonrpc_error";
        throw new Error(message);
      }
      return json ? json.result : null;
    } catch (e) {
      throw new Error("rpc_failed route=" + route + " err=" + String((e && e.message) || e || "unknown"));
    }
  };

  const callKw = (model, method, args, kwargs, timeoutMs) =>
    rpc(
      "/web/dataset/call_kw/" + model + "/" + method,
      {
        model,
        method,
        args: args || [],
        kwargs: kwargs || {}
      },
      timeoutMs
    );

  const main = async () => {
    const session = await timed("rpc.session.get_session_info", () =>
      rpc("/web/session/get_session_info", {}, 15000)
    );
    if (!session || !session.uid) {
      return JSON.stringify({
        ok: false,
        reason: "not_authenticated",
        session_uid: session && session.uid ? session.uid : 0,
        elapsed_ms: Date.now() - startedAt,
        timings_ms: timingsMs
      });
    }

    const categoryRows = await timed("rpc.product.category.search_read", () =>
      callKw(
        "product.category",
        "search_read",
        [[["name", "in", expected.categories]]],
        { fields: ["id", "name"], limit: expected.categories.length + 10 },
        20000
      )
    );
    const categoryNames = (categoryRows || []).map((row) => String(row.name || ""));
    const missingCategories = expected.categories.filter((name) => !categoryNames.includes(name));

    const supplierRows = await timed("rpc.res.partner.search_read", () =>
      callKw(
        "res.partner",
        "search_read",
        [[["name", "in", expected.suppliers]]],
        { fields: ["id", "name", "supplier_rank"], limit: expected.suppliers.length + 10 },
        20000
      )
    );
    const activeSupplierNames = (supplierRows || [])
      .filter((row) => Number(row.supplier_rank || 0) > 0)
      .map((row) => String(row.name || ""));
    const missingSuppliers = expected.suppliers.filter((name) => !activeSupplierNames.includes(name));

    const productRows = await timed("rpc.product.template.search_read", () =>
      callKw(
        "product.template",
        "search_read",
        [[["default_code", "in", expected.productCodes]]],
        { fields: ["id", "name", "default_code"], limit: expected.productCodes.length + 20 },
        25000
      )
    );
    const productCodeToId = {};
    for (const row of productRows || []) {
      productCodeToId[String(row.default_code || "")] = row.id;
    }
    const missingProducts = expected.productCodes.filter((code) => !productCodeToId[code]);

    const tmplIds = Object.values(productCodeToId);
    const supplierLines = tmplIds.length
      ? await timed("rpc.product.supplierinfo.search_read", () =>
          callKw(
            "product.supplierinfo",
            "search_read",
            [[["product_tmpl_id", "in", tmplIds]]],
            { fields: ["id", "product_tmpl_id"], limit: 2000 },
            30000
          )
        )
      : [];

    const supplierLineCountByTemplate = {};
    for (const row of supplierLines || []) {
      const ref = row && row.product_tmpl_id;
      let tmplId = 0;
      if (Array.isArray(ref)) tmplId = Number(ref[0] || 0);
      else tmplId = Number(ref || 0);
      if (!tmplId) continue;
      supplierLineCountByTemplate[tmplId] = Number(supplierLineCountByTemplate[tmplId] || 0) + 1;
    }

    const supplierLinesByCode = {};
    for (const code of expected.productCodes) {
      const tmplId = productCodeToId[code];
      supplierLinesByCode[code] = tmplId ? Number(supplierLineCountByTemplate[tmplId] || 0) : 0;
    }
    const productsWithoutSupplierLines = expected.productCodes.filter(
      (code) => Number(supplierLinesByCode[code] || 0) <= 0
    );

    // best-effort (can be slow depending on indices/demo data)
    let importedCount = null;
    try {
      importedCount = await timed("rpc.product.template.search_count.ilike", () =>
        callKw("product.template", "search_count", [[["default_code", "ilike", "ELECTRO-%"]]], {}, 12000)
      );
    } catch (_e) {
      importedCount = null;
    }

    const ok =
      missingCategories.length === 0 &&
      missingSuppliers.length === 0 &&
      missingProducts.length === 0 &&
      productsWithoutSupplierLines.length === 0;

    return JSON.stringify({
      ok,
      session_uid: session.uid,
      imported_count: importedCount === null ? null : Number(importedCount || 0),
      expected_counts: {
        categories: expected.categories.length,
        suppliers: expected.suppliers.length,
        products: expected.productCodes.length
      },
      missing_categories: missingCategories,
      missing_suppliers: missingSuppliers,
      missing_products: missingProducts,
      products_without_supplier_lines: productsWithoutSupplierLines,
      supplier_lines_by_code: supplierLinesByCode,
      elapsed_ms: Date.now() - startedAt,
      rpc_default_timeout_ms: rpcDefaultTimeoutMs,
      timings_ms: timingsMs
    });
  };

  return main().catch((error) => {
    return JSON.stringify({
      ok: false,
      reason: "exception",
      error: String((error && error.message) || error || "unknown_error"),
      elapsed_ms: Date.now() - startedAt,
      rpc_default_timeout_ms: rpcDefaultTimeoutMs,
      timings_ms: timingsMs
    });
  });
})()
