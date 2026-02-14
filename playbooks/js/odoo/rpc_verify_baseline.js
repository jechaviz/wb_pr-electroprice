(() => (async () => {
  const requiredModules = [
    "website_sale",
    "website",
    "sale_management",
    "purchase",
    "stock",
    "account",
    "stock_dropshipping"
  ];
  const expectedBrand = "electroprice";

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

  const modules = await callKw(
    "ir.module.module",
    "search_read",
    [[["name", "in", requiredModules]]],
    { fields: ["id", "name", "state"], limit: requiredModules.length }
  );
  const installed = {};
  for (const row of modules || []) installed[row.name] = row.state === "installed";
  const missingModules = requiredModules.filter((name) => !installed[name]);

  const companyRows = await callKw("res.company", "search_read", [[]], {
    fields: ["id", "name"],
    limit: 1
  });
  const websiteRows = await callKw("website", "search_read", [[]], {
    fields: ["id", "name"],
    limit: 1
  });
  const dropRoutes = await callKw("stock.route", "search_read", [[["name", "ilike", "drop"]]], {
    fields: ["id", "name"],
    limit: 50
  });

  const companyName = companyRows && companyRows.length ? String(companyRows[0].name || "") : "";
  const websiteName = websiteRows && websiteRows.length ? String(websiteRows[0].name || "") : "";
  const companyBrandOk = companyName.toLowerCase().indexOf(expectedBrand) >= 0;
  const websiteBrandOk = websiteName.toLowerCase().indexOf(expectedBrand) >= 0;
  const hasDropRoutes = !!(dropRoutes && dropRoutes.length > 0);

  const ok = missingModules.length === 0 && companyBrandOk && websiteBrandOk && hasDropRoutes;
  return JSON.stringify({
    ok,
    session_uid: session.uid,
    required_modules: requiredModules,
    missing_modules: missingModules,
    modules,
    company_name: companyName,
    website_name: websiteName,
    company_brand_ok: companyBrandOk,
    website_brand_ok: websiteBrandOk,
    has_drop_routes: hasDropRoutes,
    drop_routes: dropRoutes || []
  });
})().catch((error) => {
  return JSON.stringify({
    ok: false,
    reason: "exception",
    error: String((error && error.message) || error || "unknown_error")
  });
}))()
