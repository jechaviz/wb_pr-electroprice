(() => {
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
    const url = String(location.href || "");
    const session = await timed("rpc.session.get_session_info", () =>
      rpc("/web/session/get_session_info", {}, 15000)
    );
    if (!session || !session.uid) {
      return JSON.stringify({
        ok: false,
        reason: "not_authenticated",
        url,
        session_uid: session && session.uid ? session.uid : 0,
        elapsed_ms: Date.now() - startedAt,
        timings_ms: timingsMs
      });
    }

    const currentUserRows = await timed("rpc.res.users.search_read", () =>
      callKw(
        "res.users",
        "search_read",
        [[["id", "=", session.uid]]],
        { fields: ["id", "login", "name"], limit: 1 },
        20000
      )
    );
    const currentUser = currentUserRows && currentUserRows.length ? currentUserRows[0] : {};
    const sessionLogin = String(
      (session && (session.username || session.login || session.user_login)) ||
        (currentUser && currentUser.login) ||
        ""
    );
    const sessionName = String((session && session.name) || (currentUser && currentUser.name) || "");
    const sessionDb = String((session && session.db) || "");
    const sessionIdentityOk = !!(session.uid && sessionLogin);

    const modules = await timed("rpc.ir.module.module.search_read", () =>
      callKw(
        "ir.module.module",
        "search_read",
        [[["name", "in", requiredModules]]],
        { fields: ["id", "name", "state"], limit: requiredModules.length },
        25000
      )
    );
    const installed = {};
    for (const row of modules || []) installed[row.name] = row.state === "installed";
    const missingModules = requiredModules.filter((name) => !installed[name]);

    const companyRows = await timed("rpc.res.company.search_read", () =>
      callKw("res.company", "search_read", [[]], { fields: ["id", "name"], limit: 1 }, 20000)
    );
    const websiteRows = await timed("rpc.website.search_read", () =>
      callKw("website", "search_read", [[]], { fields: ["id", "name"], limit: 1 }, 20000)
    );
    const dropRoutes = await timed("rpc.stock.route.search_read", () =>
      callKw("stock.route", "search_read", [[["name", "ilike", "drop"]]], { fields: ["id", "name"], limit: 50 }, 25000)
    );

    const companyName = companyRows && companyRows.length ? String(companyRows[0].name || "") : "";
    const websiteName = websiteRows && websiteRows.length ? String(websiteRows[0].name || "") : "";
    const companyBrandOk = companyName.toLowerCase().indexOf(expectedBrand) >= 0;
    const websiteBrandOk = websiteName.toLowerCase().indexOf(expectedBrand) >= 0;
    const hasDropRoutes = !!(dropRoutes && dropRoutes.length > 0);

    const ok =
      missingModules.length === 0 &&
      companyBrandOk &&
      websiteBrandOk &&
      hasDropRoutes &&
      sessionIdentityOk;
    return JSON.stringify({
      ok,
      url,
      session_uid: session.uid,
      session_login: sessionLogin,
      session_name: sessionName,
      session_db: sessionDb,
      session_identity_ok: sessionIdentityOk,
      required_modules: requiredModules,
      missing_modules: missingModules,
      modules,
      company_name: companyName,
      website_name: websiteName,
      company_brand_ok: companyBrandOk,
      website_brand_ok: websiteBrandOk,
      has_drop_routes: hasDropRoutes,
      drop_routes: dropRoutes || [],
      elapsed_ms: Date.now() - startedAt,
      rpc_default_timeout_ms: rpcDefaultTimeoutMs,
      timings_ms: timingsMs
    });
  };

  return main().catch((error) => {
    return JSON.stringify({
      ok: false,
      reason: "exception",
      url: String(location.href || ""),
      error: String((error && error.message) || error || "unknown_error"),
      elapsed_ms: Date.now() - startedAt,
      rpc_default_timeout_ms: rpcDefaultTimeoutMs,
      timings_ms: timingsMs
    });
  });
})()
