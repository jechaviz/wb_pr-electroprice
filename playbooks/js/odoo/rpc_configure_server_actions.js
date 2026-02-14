(() => (async () => {
  const actionDefs = [
    {
      name: "Electroprice: SO -> Dropship review note",
      model: "sale.order",
      code:
`for record in records:
    if record.state in ('sale', 'done'):
        record.message_post(body='Electroprice workflow hook: dropship review pending')`
    },
    {
      name: "Electroprice: PO vendor sync note",
      model: "purchase.order",
      code:
`for record in records:
    if record.state in ('purchase', 'done'):
        record.message_post(body='Electroprice workflow hook: vendor order synchronized')`
    },
    {
      name: "Electroprice: Picking rebranding queue note",
      model: "stock.picking",
      code:
`for record in records:
    if record.state in ('assigned', 'confirmed'):
        record.message_post(body='Electroprice workflow hook: rebranding queue checkpoint')`
    }
  ];

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

  const actionFieldSet = await modelFields("ir.actions.server", [
    "name", "model_id", "state", "code", "binding_model_id", "binding_type"
  ]);

  const modelRows = await callKw("ir.model", "search_read", [[["model", "in", actionDefs.map((d) => d.model)]]], {
    fields: ["id", "model", "name"],
    limit: 100
  });
  const modelIdByName = {};
  for (const row of modelRows || []) {
    modelIdByName[row.model] = row.id;
  }

  const result = {
    ok: true,
    session_uid: session.uid,
    created: 0,
    updated: 0,
    skipped_missing_models: []
  };

  for (const def of actionDefs) {
    const modelId = modelIdByName[def.model];
    if (!modelId) {
      result.skipped_missing_models.push(def.model);
      continue;
    }

    const vals = {
      name: def.name,
      model_id: modelId,
      state: "code",
      code: def.code
    };
    if (!actionFieldSet.model_id) delete vals.model_id;
    if (!actionFieldSet.state) delete vals.state;
    if (!actionFieldSet.code) delete vals.code;
    if (actionFieldSet.binding_model_id) vals.binding_model_id = modelId;
    if (actionFieldSet.binding_type) vals.binding_type = "action";

    const existing = await callKw("ir.actions.server", "search_read", [[
      ["name", "=", def.name],
      ["model_id", "=", modelId]
    ]], { fields: ["id", "name"], limit: 1 });

    if (existing && existing.length > 0) {
      await callKw("ir.actions.server", "write", [[existing[0].id], vals], {});
      result.updated += 1;
    } else {
      await callKw("ir.actions.server", "create", [vals], {});
      result.created += 1;
    }
  }

  return JSON.stringify(result);
})().catch((error) => {
  return JSON.stringify({
    ok: false,
    reason: "exception",
    error: String((error && error.message) || error || "unknown_error")
  });
}))()
