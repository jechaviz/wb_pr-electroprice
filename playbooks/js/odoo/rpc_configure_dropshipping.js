(() => (async () => {
  const moduleNames = ["stock_dropshipping"];
  const settingsCandidates = [
    "module_stock_dropshipping",
    "group_stock_adv_location",
    "group_stock_multi_locations"
  ];
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
      await sleep(2000);
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
  if (!install.ok) {
    return JSON.stringify({
      ok: false,
      reason: install.reason || "dropshipping_module_install_failed",
      modules: install.modules || []
    });
  }

  const settingsFields = await callKw("ir.model.fields", "search_read", [[
    ["model", "=", "res.config.settings"],
    ["name", "in", settingsCandidates]
  ]], { fields: ["name"], limit: 100 });

  const availableFieldNames = {};
  for (const row of settingsFields || []) {
    if (row && row.name) availableFieldNames[row.name] = true;
  }

  const values = {};
  for (const fieldName of settingsCandidates) {
    if (availableFieldNames[fieldName]) values[fieldName] = true;
  }

  let settingsApplied = false;
  if (Object.keys(values).length > 0) {
    const settingsId = await callKw("res.config.settings", "create", [values], {});
    await callKw("res.config.settings", "execute", [[settingsId]], {});
    settingsApplied = true;
  }

  const routes = await callKw("stock.route", "search_read", [[["name", "ilike", "drop"]]], {
    fields: ["id", "name"],
    limit: 50
  });

  return JSON.stringify({
    ok: true,
    session_uid: session.uid,
    modules: install.modules || [],
    install_triggered: !!install.install_triggered,
    settings_applied: settingsApplied,
    settings_values: values,
    detected_drop_routes: routes || []
  });
})().catch((error) => {
  return JSON.stringify({
    ok: false,
    reason: "exception",
    error: String((error && error.message) || error || "unknown_error")
  });
}))()
