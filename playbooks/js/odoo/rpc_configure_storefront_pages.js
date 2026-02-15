(() => {
  const startedAt = Date.now();
  return (async () => {
  // Storefront polish for Odoo Online:
  // - Homepage: upsert website.page url "/"
  // - Product detail page: create/update an inherited qweb view extending website_sale.product
  //
  // NOTE: Odoo Online may sanitize qweb extension views when written via RPC.
  // We use a small set of strategies and verify persistence by reading back the view arch and checking markers.

  const expected = {
    brand: "Electroprice",
    homepage: {
      url: "/",
      key: "electroprice.homepage",
      name: "Electroprice - Inicio"
    },
    productEnhancementView: {
      key: "electroprice.product.page.enhancements",
      name: "Electroprice: Product page enhancements"
    },
    productBaseKeys: ["website_sale.product", "website_sale.product_template", "website_sale.product_page"]
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
    const s = String(text || "").replace(/\\s+/g, " ").trim();
    return s.length > (maxLen || 240) ? s.slice(0, maxLen || 240) : s;
  };

  const readView = async (viewId, fields) => {
    const id = Number(viewId || 0);
    if (!id) return null;
    const readFields = Array.isArray(fields) && fields.length > 0
      ? fields
      : ["id", "key", "name", "arch_db", "arch", "active", "type", "inherit_id"];
    const rows = await callKw("ir.ui.view", "read", [[id], readFields], {}, 25000);
    return rows && rows.length ? rows[0] : null;
  };

  const modelFields = async (model, names) => {
    const rows = await callKw(
      "ir.model.fields",
      "search_read",
      [[["model", "=", model], ["name", "in", names]]],
      { fields: ["name"], limit: 200 },
      20000
    );
    const set = {};
    for (const row of rows || []) {
      if (row && row.name) set[row.name] = true;
    }
    return set;
  };

  const modelExists = async (model) => {
    const rows = await callKw("ir.model", "search_read", [[["model", "=", model]]], { fields: ["id"], limit: 1 }, 15000);
    return !!(rows && rows.length > 0);
  };

  const findFirstViewIdByKeys = async (keys) => {
    for (const key of keys || []) {
      const k = String(key || "").trim();
      if (!k) continue;
      const rows = await callKw("ir.ui.view", "search_read", [[["key", "=", k]]], { fields: ["id", "key", "type", "name"], limit: 1 }, 25000);
      if (rows && rows.length > 0) return { id: Number(rows[0].id || 0), key: k, type: String(rows[0].type || ""), name: String(rows[0].name || "") };
    }
    return { id: 0, key: "", type: "", name: "" };
  };

  const ensureWebsitePage = async (page, fieldSet, viewFieldSet) => {
    const existing = await callKw("website.page", "search_read", [[["url", "=", page.url]]], {
      fields: ["id", "name", "url", "view_id", "key"],
      limit: 1
    });
    const canWriteArchDirect = !!(fieldSet.arch_db || fieldSet.arch);
    const canWriteViewMode = !!(fieldSet.view_id && (viewFieldSet.arch_db || viewFieldSet.arch));

    if (!canWriteArchDirect && !canWriteViewMode)
      throw new Error("website.page missing arch/write path");

    if (canWriteViewMode) {
      const viewKey = page.key;
      let viewId = 0;
      const existingPage = existing && existing.length > 0 ? existing[0] : null;
      const existingViewRel = existingPage && existingPage.view_id;
      if (Array.isArray(existingViewRel) && existingViewRel.length > 0)
        viewId = Number(existingViewRel[0] || 0);

      if (!viewId) {
        const existingView = await callKw("ir.ui.view", "search_read", [[["key", "=", viewKey]]], {
          fields: ["id", "key"],
          limit: 1
        });
        if (existingView && existingView.length > 0)
          viewId = Number(existingView[0].id || 0);
      }

      if (viewId) {
        const viewVals = {};
        if (viewFieldSet.name) viewVals.name = page.name;
        if (viewFieldSet.key) viewVals.key = viewKey;
        if (viewFieldSet.type) viewVals.type = "qweb";
        if (viewFieldSet.arch_db) viewVals.arch_db = page.html;
        else if (viewFieldSet.arch) viewVals.arch = page.html;
        await callKw("ir.ui.view", "write", [[viewId], viewVals], {}, 25000);
      } else {
        const viewVals = {};
        if (viewFieldSet.name) viewVals.name = page.name;
        if (viewFieldSet.key) viewVals.key = viewKey;
        if (viewFieldSet.type) viewVals.type = "qweb";
        if (viewFieldSet.arch_db) viewVals.arch_db = page.html;
        else if (viewFieldSet.arch) viewVals.arch = page.html;
        viewId = await callKw("ir.ui.view", "create", [viewVals], {}, 25000);
        viewId = Number(viewId || 0);
      }
      if (!viewId)
        throw new Error("website.page view_id creation failed");

      const pageVals = {};
      if (fieldSet.name) pageVals.name = page.name;
      if (fieldSet.url) pageVals.url = page.url;
      if (fieldSet.key) pageVals.key = page.key;
      if (fieldSet.view_id) pageVals.view_id = viewId;
      if (fieldSet.website_published) pageVals.website_published = true;
      if (fieldSet.is_published) pageVals.is_published = true;

      if (existingPage) {
        await callKw("website.page", "write", [[existingPage.id], pageVals], {}, 25000);
        return { op: "updated", view_id: viewId, page_id: existingPage.id };
      }
      const newId = await callKw("website.page", "create", [pageVals], {}, 25000);
      return { op: "created", view_id: viewId, page_id: Number(newId || 0) };
    }

    if (canWriteArchDirect) {
      const vals = {};
      if (fieldSet.name) vals.name = page.name;
      if (fieldSet.url) vals.url = page.url;
      if (fieldSet.key) vals.key = page.key;
      if (fieldSet.arch) vals.arch = page.html;
      else if (fieldSet.arch_db) vals.arch_db = page.html;
      if (fieldSet.website_published) vals.website_published = true;
      if (fieldSet.is_published) vals.is_published = true;

      if (existing && existing.length > 0) {
        if (Object.keys(vals).length > 0)
          await callKw("website.page", "write", [[existing[0].id], vals], {}, 25000);
        return { op: "updated", page_id: existing[0].id };
      }
      const newId = await callKw("website.page", "create", [vals], {}, 25000);
      return { op: "created", page_id: Number(newId || 0) };
    }

    throw new Error("website.page write path unresolved");
  };

  const ensureQwebExtensionViewPersisted = async (opts) => {
    const viewKey = String(opts && opts.view_key || "");
    const viewName = String(opts && opts.view_name || "");
    const baseViewId = Number(opts && opts.base_view_id || 0);
    const baseViewKey = String(opts && opts.base_view_key || "");
    const markers = Array.isArray(opts && opts.markers) ? opts.markers : [];

    if (!(baseViewId > 0)) {
      return { ok: false, reason: "missing_base_view", view_key: viewKey, base_view_id: baseViewId, base_view_key: baseViewKey };
    }

    const existing = await callKw("ir.ui.view", "search_read", [[["key", "=", viewKey]]], {
      fields: ["id", "key", "name", "type", "inherit_id"],
      limit: 1
    }, 25000);

    const archField = (viewFieldSet.arch_db ? "arch_db" : (viewFieldSet.arch ? "arch" : ""));
    if (!archField) throw new Error("ir.ui.view missing arch_db/arch");

    const baseVals = {};
    if (viewFieldSet.name) baseVals.name = viewName;
    if (viewFieldSet.key) baseVals.key = viewKey;
    if (viewFieldSet.type) baseVals.type = "qweb";
    if (viewFieldSet.active) baseVals.active = true;
    if (baseViewId > 0 && viewFieldSet.inherit_id) baseVals.inherit_id = baseViewId;
    if (viewFieldSet.mode) baseVals.mode = "extension";
    if (viewFieldSet.priority) baseVals.priority = 16;

    let viewId = 0;
    if (existing && existing.length > 0) {
      viewId = Number(existing[0].id || 0);
      if (viewId) await callKw("ir.ui.view", "write", [[viewId], baseVals], {}, 30000);
    } else {
      const newId = await callKw("ir.ui.view", "create", [baseVals], {}, 30000);
      viewId = Number(newId || 0);
    }
    if (!viewId) throw new Error("qweb extension view creation failed key=" + viewKey);

    const productSectionHtml = String(opts && opts.section_html || "").trim();
    if (!productSectionHtml) throw new Error("missing section_html for qweb extension view");

    const archStrategies = [
      {
        id: "xpath_fragment",
        arch: "<xpath expr=\"//div[@id='wrap']\" position=\"inside\">" + productSectionHtml + "</xpath>"
      },
      {
        id: "data_root_xpath",
        arch: "<data><xpath expr=\"//div[@id='wrap']\" position=\"inside\">" + productSectionHtml + "</xpath></data>"
      },
      {
        id: "t_inherit_xpath",
        arch:
          "<t t-name=\"" + viewKey + "\" t-inherit=\"" + (baseViewKey || "website_sale.product") + "\" t-inherit-mode=\"extension\">" +
          "<xpath expr=\"//div[@id='wrap']\" position=\"inside\">" + productSectionHtml + "</xpath>" +
          "</t>"
      },
      {
        id: "template_inherit_id",
        arch:
          "<template id=\"electroprice_product_page_enhancements\" inherit_id=\"" + (baseViewKey || "website_sale.product") + "\">" +
          "<xpath expr=\"//div[@id='wrap']\" position=\"inside\">" + productSectionHtml + "</xpath>" +
          "</template>"
      },
      {
        id: "t_extend_jquery",
        arch:
          "<t t-name=\"" + viewKey + "\" t-extend=\"" + (baseViewKey || "website_sale.product") + "\">" +
          "<t t-jquery=\"div#wrap\" t-operation=\"append\">" + productSectionHtml + "</t>" +
          "</t>"
      }
    ];

    const attempts = [];
    for (const strat of archStrategies) {
      const arch = String(strat.arch || "");
      const vals = { ...baseVals };
      vals[archField] = arch;
      await callKw("ir.ui.view", "write", [[viewId], vals], {}, 30000);

      const afterFields = ["id", "key", "name", "type", "inherit_id", "arch_db", "arch"];
      if (viewFieldSet.mode) afterFields.push("mode");
      if (viewFieldSet.priority) afterFields.push("priority");
      const after = await readView(viewId, afterFields);
      const afterArch = String((after && (after.arch_db || after.arch)) || "");
      const afterMarkers = containsAll(afterArch, markers);
      attempts.push({
        strategy: strat.id,
        arch_len: afterArch.length,
        markers_ok: afterMarkers.ok,
        missing_markers: afterMarkers.missing,
        arch_preview: afterMarkers.ok ? "" : preview(afterArch, 260)
      });
      if (afterMarkers.ok) {
        return { ok: true, op: existing && existing.length > 0 ? "updated" : "created", view_id: viewId, base_view_id: baseViewId, base_view_key: baseViewKey, strategy: strat.id, attempts };
      }
    }

    return { ok: false, view_id: viewId, base_view_id: baseViewId, base_view_key: baseViewKey, attempts };
  };

  const homepageHtml = (() => {
    // IMPORTANT:
    // `website.page` uses a QWeb view under the hood. The arch must be valid QWeb/XML.
    // Keep MVP HTML minimal to avoid Odoo sanitizing/stripping nodes on save.
    //
    // NOTE: Do NOT use JS template interpolation (template literals with dollar-brace) in JS files executed by waiba.
    // waiba's template engine uses the same syntax and will rewrite it before execution.
    const tpl = `
<t t-name="__HOME_VIEW_KEY__">
  <t t-call="website.layout">
    <div id="wrap" class="oe_structure">
      <section class="container py-5">
        <h1 class="display-5 fw-bold mb-3">Electroprice</h1>
        <p class="lead mb-4">Dropshipping inteligente: compara mayoristas, compra seguro, recibe rapido.</p>
        <div class="row g-3">
          <div class="col-lg-6">
            <div class="p-4 border rounded-3 h-100">
              <h2 class="h5 mb-2">Busqueda rapida</h2>
              <form action="/shop" method="get">
                <div class="input-group input-group-lg">
                  <input class="form-control" type="text" name="search" placeholder="Busca: laptop, camara, audifonos" />
                  <button class="btn btn-primary" type="submit">Buscar</button>
                </div>
              </form>
              <div class="mt-3 small text-muted">Tip: escribe un modelo, marca, o codigo.</div>
            </div>
          </div>
          <div class="col-lg-6">
            <div class="p-4 border rounded-3 h-100">
              <h2 class="h5 mb-2">Categorias destacadas</h2>
              <div class="d-flex flex-wrap gap-2">
                <a class="btn btn-outline-secondary btn-sm" href="/shop?search=Smartphones">Smartphones</a>
                <a class="btn btn-outline-secondary btn-sm" href="/shop?search=Laptops">Laptops</a>
                <a class="btn btn-outline-secondary btn-sm" href="/shop?search=Headphones">Headphones</a>
                <a class="btn btn-outline-secondary btn-sm" href="/shop?search=Cameras">Cameras</a>
                <a class="btn btn-outline-secondary btn-sm" href="/shop?search=TVs">TVs</a>
                <a class="btn btn-outline-secondary btn-sm" href="/shop?search=Gaming">Gaming</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </t>
</t>`;
    return tpl.replace(/__HOME_VIEW_KEY__/g, expected.homepage.key);
  })();

  const productEnhancementSectionHtml = `
<section class="container py-4">
  <div class="p-3 border rounded-3">
    <h3 class="h5 mb-2">Atributos tecnicos</h3>
    <div class="small text-muted mb-2">Comparador rapido</div>
    <div class="small text-muted mb-2">Opiniones recientes</div>
    <div class="small text-muted">Relacionados sugeridos</div>
  </div>
</section>`.trim();

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

  const hasWebsitePageModel = await timed("rpc.ir.model.website.page.exists", () => modelExists("website.page"));
  if (!hasWebsitePageModel) {
    return {
      ok: false,
      reason: "missing_model_website.page",
      session_uid: session.uid,
      elapsed_ms: Date.now() - startedAt,
      timings_ms: timingsMs
    };
  }

  const websitePageFieldSet = await timed("rpc.fields.website.page", () =>
    modelFields("website.page", ["name", "url", "key", "arch_db", "arch", "view_id", "website_published", "is_published"])
  );
  const viewFieldSet = await timed("rpc.fields.ir.ui.view", () =>
    modelFields("ir.ui.view", ["name", "key", "type", "arch_db", "arch", "active", "inherit_id", "mode", "priority", "website_id"])
  );

  const homepagePatch = await timed("rpc.website.page.ensure_homepage", () =>
    ensureWebsitePage(
      { ...expected.homepage, html: homepageHtml },
      websitePageFieldSet,
      viewFieldSet
    )
  );

  let productBaseViewId = 0;
  let productBaseViewKey = "";
  if (viewFieldSet.inherit_id) {
    const base = await timed("rpc.ir.ui.view.find.base_product", () =>
      findFirstViewIdByKeys(expected.productBaseKeys)
    );
    productBaseViewId = Number(base && base.id || 0);
    productBaseViewKey = String(base && base.key || "");
  }

  const productMarkers = ["Atributos tecnicos", "Comparador rapido", "Opiniones recientes", "Relacionados sugeridos"];
  const productViewPatch = await timed("rpc.ir.ui.view.ensure_product_ext_persisted", () =>
    ensureQwebExtensionViewPersisted({
      view_key: expected.productEnhancementView.key,
      view_name: expected.productEnhancementView.name,
      base_view_id: productBaseViewId,
      base_view_key: productBaseViewKey,
      markers: productMarkers,
      section_html: productEnhancementSectionHtml
    })
  );

  if (!productViewPatch || !productViewPatch.ok) {
    return {
      ok: false,
      reason: "product_view_patch_failed",
      session_uid: session.uid,
      homepage_patch: homepagePatch,
      product_enhancement_view: productViewPatch,
      elapsed_ms: Date.now() - startedAt,
      rpc_default_timeout_ms: rpcDefaultTimeoutMs,
      timings_ms: timingsMs
    };
  }

  return {
    ok: true,
    session_uid: session.uid,
    homepage_patch: homepagePatch,
    product_enhancement_view: productViewPatch,
    markers: {
      homepage_contains: ["Electroprice", "Busqueda rapida", "Categorias destacadas"],
      product_contains: productMarkers
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
