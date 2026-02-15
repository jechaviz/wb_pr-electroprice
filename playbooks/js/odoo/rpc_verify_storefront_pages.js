(() => {
  const startedAt = Date.now();
  return (async () => {
  const expected = {
    homepageUrl: "/",
    homepageViewKey: "electroprice.homepage",
    homepageMarkers: ["Electroprice", "Busqueda rapida", "Categorias destacadas"],
    productEnhancementKey: "electroprice.product.page.enhancements",
    productMarkers: ["Atributos tecnicos", "Comparador rapido", "Opiniones recientes", "Relacionados sugeridos"]
  };

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

  const containsAll = (text, markers) => {
    const t = String(text || "").toLowerCase();
    const missing = [];
    for (const m of markers || []) {
      const needle = String(m || "").toLowerCase();
      if (!t.includes(needle)) missing.push(m);
    }
    return { ok: missing.length === 0, missing };
  };

  const preview = (text, maxLen) => {
    const s = String(text || "").replace(/\s+/g, " ").trim();
    return s.length > (maxLen || 240) ? s.slice(0, maxLen || 240) : s;
  };

  const m2oId = (val) => {
    if (Array.isArray(val) && val.length > 0) return Number(val[0] || 0);
    if (typeof val === "number") return Number(val || 0);
    if (typeof val === "string" && val.trim() !== "" && !isNaN(Number(val))) return Number(val);
    return 0;
  };

  const readView = async (viewId) => {
    const id = Number(viewId || 0);
    if (!id) return null;
    const rows = await callKw("ir.ui.view", "read", [[id], ["id", "key", "name", "arch_db", "arch", "active", "type", "inherit_id"]], {}, 25000);
    return rows && rows.length ? rows[0] : null;
  };

  const session = await timed("rpc.session.get_session_info", () => rpc("/web/session/get_session_info", {}, 15000));
  if (!session || !session.uid) {
    return {
      ok: false,
      reason: "not_authenticated",
      session_uid: session && session.uid ? session.uid : 0,
      elapsed_ms: Date.now() - startedAt,
      timings_ms: timingsMs
    };
  }

  const homeRows = await timed("rpc.website.page.search_read", () =>
    callKw("website.page", "search_read", [[["url", "=", expected.homepageUrl]]], { fields: ["id", "url", "key", "view_id"], limit: 1 }, 25000)
  );
  const home = homeRows && homeRows.length ? homeRows[0] : null;
  const homeFound = !!home;
  const homePageId = home ? Number(home.id || 0) : 0;
  const homePageKey = home ? String(home.key || "") : "";
  let homeViewId = home ? m2oId(home.view_id) : 0;

  if (!homeViewId) {
    const viewRows = await timed("rpc.ir.ui.view.search_read.home_key", () =>
      callKw("ir.ui.view", "search_read", [[["key", "=", expected.homepageViewKey]]], { fields: ["id"], limit: 1 }, 25000)
    );
    if (viewRows && viewRows.length > 0) homeViewId = Number(viewRows[0].id || 0);
  }

  const homeView = homeViewId ? await timed("rpc.ir.ui.view.read.home", () => readView(homeViewId)) : null;
  const homeArch = String((homeView && (homeView.arch_db || homeView.arch)) || "");
  const homeMarkers = containsAll(homeArch, expected.homepageMarkers);

  const extRows = await timed("rpc.ir.ui.view.search_read.ext", () =>
    callKw("ir.ui.view", "search_read", [[["key", "=", expected.productEnhancementKey]]], { fields: ["id", "key", "arch_db", "arch"], limit: 1 }, 25000)
  );
  const ext = extRows && extRows.length ? extRows[0] : null;
  const extFound = !!ext;
  const extId = ext ? Number(ext.id || 0) : 0;
  const extView = extId ? await timed("rpc.ir.ui.view.read.ext", () => readView(extId)) : null;
  const extArch = String((extView && (extView.arch_db || extView.arch)) || (ext && (ext.arch_db || ext.arch)) || "");
  const extMarkers = containsAll(extArch, expected.productMarkers);

  const extBaseId = extView && extView.inherit_id ? m2oId(extView.inherit_id) : 0;
  const extBaseView = extBaseId ? await timed("rpc.ir.ui.view.read.ext_base", () => readView(extBaseId)) : null;
  const extBaseArch = String((extBaseView && (extBaseView.arch_db || extBaseView.arch)) || "");

  const ok = homeFound && homeMarkers.ok && extFound && extMarkers.ok;

  return {
    ok,
    session_uid: session.uid,
    homepage: {
      found: homeFound,
      page_id: homePageId,
      page_key: homePageKey,
      view_id: homeViewId,
      view_key: homeView ? String(homeView.key || "") : "",
      view_type: homeView ? String(homeView.type || "") : "",
      view_inherit_id: homeView ? homeView.inherit_id || null : null,
      markers_ok: homeMarkers.ok,
      missing_markers: homeMarkers.missing,
      arch_len: homeArch.length,
      arch_preview: homeMarkers.ok ? "" : preview(homeArch, 260)
    },
    product_enhancement_view: {
      found: extFound,
      view_id: extId,
      view_key: extView ? String(extView.key || "") : (ext ? String(ext.key || "") : ""),
      view_type: extView ? String(extView.type || "") : "",
      view_inherit_id: extView ? extView.inherit_id || null : null,
      base_view_id: extBaseId,
      base_view_key: extBaseView ? String(extBaseView.key || "") : "",
      base_view_name: extBaseView ? String(extBaseView.name || "") : "",
      base_view_type: extBaseView ? String(extBaseView.type || "") : "",
      base_arch_len: extBaseArch.length,
      base_arch_preview: extBaseArch ? preview(extBaseArch, 260) : "",
      markers_ok: extMarkers.ok,
      missing_markers: extMarkers.missing,
      arch_len: extArch.length,
      arch_preview: extMarkers.ok ? "" : preview(extArch, 260)
    },
    elapsed_ms: Date.now() - startedAt,
    rpc_default_timeout_ms: rpcDefaultTimeoutMs,
    timings_ms: timingsMs
  };
  })().catch((error) => {
    return {
      ok: false,
      reason: "exception",
      error: String((error && error.message) || error || "unknown_error"),
      elapsed_ms: Date.now() - startedAt
    };
  });
})()
