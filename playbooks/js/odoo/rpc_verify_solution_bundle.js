(() => (async () => {
  const expectedActionNames = [
    "Electroprice: SO -> Dropship review note",
    "Electroprice: PO vendor sync note",
    "Electroprice: Picking rebranding queue note"
  ];
  const expectedPublicCategories = ["Smartphones", "Laptops", "Headphones", "Cameras", "TVs", "Gaming"];

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

  const actionRows = await callKw("ir.actions.server", "search_read", [[["name", "in", expectedActionNames]]], {
    fields: ["id", "name"],
    limit: expectedActionNames.length + 10
  });
  const actionNames = (actionRows || []).map((row) => String(row.name || ""));
  const missingActions = expectedActionNames.filter((name) => !actionNames.includes(name));

  const publicCatRows = await callKw("product.public.category", "search_read", [[["name", "in", expectedPublicCategories]]], {
    fields: ["id", "name"],
    limit: expectedPublicCategories.length + 20
  });
  const publicCatNames = (publicCatRows || []).map((row) => String(row.name || ""));
  const missingPublicCategories = expectedPublicCategories.filter((name) => !publicCatNames.includes(name));

  const electroProducts = await callKw("product.template", "search_read", [[["default_code", "ilike", "ELECTRO-%"]]], {
    fields: ["id", "default_code", "public_categ_ids", "website_published"],
    limit: 200
  });

  const missingFrontendAssignments = [];
  for (const row of electroProducts || []) {
    const code = String(row.default_code || "");
    const publicCats = row.public_categ_ids || [];
    const published = !!row.website_published;
    if (!code || publicCats.length <= 0 || !published)
      missingFrontendAssignments.push(code || "<missing_code>");
  }

  const ok =
    missingActions.length === 0 &&
    missingPublicCategories.length === 0 &&
    (electroProducts || []).length >= 10 &&
    missingFrontendAssignments.length === 0;

  return JSON.stringify({
    ok,
    session_uid: session.uid,
    counts: {
      actions_found: actionRows ? actionRows.length : 0,
      public_categories_found: publicCatRows ? publicCatRows.length : 0,
      electro_products_found: electroProducts ? electroProducts.length : 0
    },
    missing_actions: missingActions,
    missing_public_categories: missingPublicCategories,
    missing_frontend_assignments: missingFrontendAssignments
  });
})().catch((error) => {
  return JSON.stringify({
    ok: false,
    reason: "exception",
    error: String((error && error.message) || error || "unknown_error")
  });
}))()
