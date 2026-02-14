(() => (async () => {
  const moduleNames = ["website_sale"];
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

  const readModules = async (names) =>
    callKw(
      "ir.module.module",
      "search_read",
      [[["name", "in", names]]],
      { fields: ["id", "name", "state"], limit: names.length }
    );

  const ensureInstalled = async (names, timeoutMs) => {
    let modules = await readModules(names);
    const byName = {};
    for (const row of modules) byName[row.name] = row;
    const missingDefinitions = names.filter((n) => !byName[n]);
    if (missingDefinitions.length > 0) {
      return {
        ok: false,
        reason: "module_definitions_missing",
        missing_definitions: missingDefinitions,
        modules
      };
    }

    const installIds = modules.filter((m) => m.state !== "installed").map((m) => m.id);
    if (installIds.length > 0) {
      await callKw("ir.module.module", "button_immediate_install", [installIds], {});
    }

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      modules = await readModules(names);
      if (modules.every((m) => m.state === "installed")) {
        return { ok: true, modules, install_triggered: installIds.length > 0 };
      }
      await sleep(1500);
    }
    return { ok: false, reason: "install_timeout", modules };
  };

  const session = await rpc("/web/session/get_session_info", {});
  if (!session || !session.uid) {
    return JSON.stringify({
      ok: false,
      reason: "not_authenticated",
      session_uid: session && session.uid ? session.uid : 0
    });
  }

  const install = await ensureInstalled(moduleNames, 300000);
  return JSON.stringify({
    ok: !!install.ok,
    session_uid: session.uid,
    modules: install.modules || [],
    install_triggered: !!install.install_triggered,
    reason: install.reason || ""
  });
})().catch((error) => {
  return JSON.stringify({
    ok: false,
    reason: "exception",
    error: String((error && error.message) || error || "unknown_error")
  });
}))()
