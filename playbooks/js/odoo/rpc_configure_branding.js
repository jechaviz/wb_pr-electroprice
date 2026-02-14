(() => (async () => {
  const companyName = "Electroprice";
  const websiteName = "Electroprice";

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

  const result = {
    ok: true,
    session_uid: session.uid,
    company_updated: false,
    website_updated: false
  };

  const companies = await callKw("res.company", "search_read", [[]], {
    fields: ["id", "name"],
    limit: 1
  });
  if (companies && companies.length > 0) {
    const companyId = companies[0].id;
    await callKw("res.company", "write", [[companyId], { name: companyName }], {});
    result.company_id = companyId;
    result.company_updated = true;
  }

  const websites = await callKw("website", "search_read", [[]], {
    fields: ["id", "name", "company_id"],
    limit: 1
  });
  if (websites && websites.length > 0) {
    const websiteId = websites[0].id;
    await callKw("website", "write", [[websiteId], { name: websiteName }], {});
    result.website_id = websiteId;
    result.website_updated = true;
  }

  result.company_name = companyName;
  result.website_name = websiteName;
  return JSON.stringify(result);
})().catch((error) => {
  return JSON.stringify({
    ok: false,
    reason: "exception",
    error: String((error && error.message) || error || "unknown_error")
  });
}))()
