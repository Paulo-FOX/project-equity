/* Project Equity — app shell: Home (coverage hub) + Company deep-dive. */
(function () {
  "use strict";

  var DATA = window.EQ_DATA || {};
  var HOME = window.EQ_HOME || { rows: [], as_of: "" };
  var STATUS_LABELS = {
    em_estudo: "Em estudo", em_carteira: "Em carteira", monitorando: "Monitorando",
    descartado: "Descartado"
  };

  var state = { ticker: null, view: "ov", sortKey: "mktcap", sortDir: -1 };
  function el(id) { return document.getElementById(id); }

  /* ---------- formatters ---------- */
  function fmtMktCap(v) {
    if (v == null) return "—";
    if (v >= 1e12) return "$" + (v / 1e12).toFixed(2) + "T";
    if (v >= 1e9) return "$" + (v / 1e9).toFixed(0) + "B";
    if (v >= 1e6) return "$" + (v / 1e6).toFixed(0) + "M";
    return "$" + v.toFixed(0);
  }
  function fmtPrice(v, isIndex) {
    if (v == null) return "—";
    if (isIndex) return v.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return "$" + v.toFixed(2);
  }
  function fmtPct(v) {
    if (v == null) return '<span class="muted">—</span>';
    var cls = v > 0 ? "pos" : (v < 0 ? "neg" : "");
    var s = (v > 0 ? "+" : "") + v.toFixed(1) + "%";
    return '<span class="' + cls + '">' + s + "</span>";
  }
  function fmtPE(v) { return v == null ? '<span class="muted">—</span>' : v.toFixed(1) + "x"; }

  /* ---------- Home table ---------- */
  var COLS = [
    { key: "name", label: "Company", grp: "", align: "left", cell: function (r) {
        return '<span class="c-name">' + r.name + "</span>"; } },
    { key: "ticker", label: "Ticker", grp: "", align: "left", cell: function (r) {
        return '<span class="c-ticker">' + r.ticker + "</span>"; } },
    { key: "sector", label: "Sector", grp: "", align: "left", cell: function (r) { return r.sector || "—"; } },
    { key: "mktcap", label: "Mkt Cap", grp: "MARKET DATA", align: "right", cell: function (r) { return fmtMktCap(r.mktcap); } },
    { key: "price", label: "Price", grp: "MARKET DATA", align: "right", cell: function (r) { return fmtPrice(r.price, r.is_index); } },
    { key: "d1", label: "1D", grp: "MARKET DATA", align: "right", cell: function (r) { return fmtPct(r.d1); } },
    { key: "d5", label: "5D", grp: "MARKET DATA", align: "right", cell: function (r) { return fmtPct(r.d5); } },
    { key: "d30", label: "30D", grp: "MARKET DATA", align: "right", cell: function (r) { return fmtPct(r.d30); } },
    { key: "ytd", label: "YTD", grp: "MARKET DATA", align: "right", cell: function (r) { return fmtPct(r.ytd); } },
    { key: "fwd_pe", label: "Fwd P/E", grp: "FUNDAMENTALS", align: "right", cell: function (r) { return fmtPE(r.fwd_pe); } },
    { key: "fwd_pe_5y", label: "5Y Avg Fwd P/E", grp: "FUNDAMENTALS", align: "right", cell: function (r) { return fmtPE(r.fwd_pe_5y); } },
    { key: "eps_gr_fy1", label: "EPS gr FY26E", grp: "FUNDAMENTALS", align: "right",
      cell: function (r) { return '<span title="' + (r.fy1_label || "") + '">' + fmtPct(r.eps_gr_fy1) + "</span>"; } },
    { key: "eps_gr_fy2", label: "EPS gr FY27E", grp: "FUNDAMENTALS", align: "right",
      cell: function (r) { return '<span title="' + (r.fy2_label || "") + '">' + fmtPct(r.eps_gr_fy2) + "</span>"; } },
    { key: "last_update", label: "Last update", grp: "FUNDAMENTALS", align: "right",
      cell: function (r) { return '<span class="c-update">' + fmtDate(r.last_update) + "</span>"; } },
  ];

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function fmtDate(iso) {
    if (!iso) return "—";
    var p = String(iso).split("-");
    if (p.length !== 3) return iso;
    return MONTHS[parseInt(p[1], 10) - 1] + " " + p[2] + ", " + p[0];
  }

  function sortRows(rows) {
    var k = state.sortKey, dir = state.sortDir;
    return rows.slice().sort(function (a, b) {
      var x = a[k], y = b[k];
      if (x == null && y == null) return 0;
      if (x == null) return 1;          // nulos sempre no fim
      if (y == null) return -1;
      if (typeof x === "string") return x.localeCompare(y) * dir;
      return (x - y) * dir;
    });
  }

  window.sortHome = function (key) {
    if (state.sortKey === key) state.sortDir *= -1;
    else { state.sortKey = key; state.sortDir = (key === "name" || key === "ticker" || key === "sector") ? 1 : -1; }
    renderHomeTable();
  };

  window.renderHomeTable = function () {
    var q = (el("home-filter").value || "").toLowerCase().trim();
    var rows = HOME.rows.filter(function (r) {
      if (!q) return true;
      return (r.name + " " + r.ticker + " " + (r.sector || "")).toLowerCase().indexOf(q) >= 0;
    });
    rows = sortRows(rows);

    // grupo header (linha 1) + colunas (linha 2)
    var groups = []; var last = null;
    COLS.forEach(function (c) {
      if (c.grp !== last) { groups.push({ grp: c.grp, span: 1 }); last = c.grp; }
      else groups[groups.length - 1].span++;
    });
    var gh = "<tr class='grp-row'>" + groups.map(function (g) {
      return "<th colspan='" + g.span + "' class='grp " + (g.grp ? "grp-on" : "") + "'>" + g.grp + "</th>";
    }).join("") + "</tr>";

    var hh = "<tr>" + COLS.map(function (c) {
      var arrow = state.sortKey === c.key ? (state.sortDir < 0 ? " ▾" : " ▴") : "";
      return "<th class='sortable' style='text-align:" + c.align + "' onclick=\"sortHome('" + c.key + "')\">" +
             c.label + arrow + "</th>";
    }).join("") + "</tr>";

    var benchHtml = (HOME.benchmarks || []).map(function (r) {
      return "<tr class='hrow bench'>" + COLS.map(function (c) {
        return "<td style='text-align:" + c.align + "'>" + c.cell(r) + "</td>";
      }).join("") + "</tr>";
    }).join("");

    var body = rows.map(function (r) {
      var hasDeep = !!DATA[r.ticker];
      return "<tr class='hrow" + (hasDeep ? "" : " no-deep") + "' onclick=\"openCompany('" + r.ticker + "')\">" +
        COLS.map(function (c) {
          return "<td style='text-align:" + c.align + "'>" + c.cell(r) + "</td>";
        }).join("") + "</tr>";
    }).join("");

    el("home-table").innerHTML = "<thead>" + gh + hh + "</thead><tbody>" + benchHtml + body + "</tbody>";
    el("home-count").textContent = rows.length + " de " + HOME.rows.length + " empresas";
  };

  window.openCompany = function (ticker) {
    switchTopBar("company");
    if (DATA[ticker]) { el("company-sel").value = ticker; selectCompany(ticker); }
    else { state.ticker = ticker; renderHeader(); el("view-container").innerHTML =
      '<div class="empty-view"><p>Deep-dive de <strong>' + ticker + '</strong> ainda não gerado.</p>' +
      '<p class="hint">Rode <code>site/build/build.py ' + ticker + '</code> (precisa de <code>wiki/' + ticker + '.md</code>).</p></div>'; }
  };

  /* ---------- Company deep-dive ---------- */
  function nameFor(t) {
    if (DATA[t] && DATA[t].meta && DATA[t].meta.nome_empresa) return DATA[t].meta.nome_empresa;
    var hr = (HOME.rows || []).filter(function (r) { return r.ticker === t; })[0];
    return (hr && hr.name) || (window.EQ_OV && EQ_OV[t] && EQ_OV[t].name) || t;
  }
  function companyList() {
    var set = {};
    Object.keys(DATA).forEach(function (t) { set[t] = 1; });
    Object.keys(window.EQ_OV || {}).forEach(function (t) { set[t] = 1; });  // empresas sem wiki (só dados ricos)
    return Object.keys(set).sort(function (a, b) { return nameFor(a).localeCompare(nameFor(b)); });
  }
  function populateCompanySelect() {
    var sel = el("company-sel"); sel.innerHTML = "";
    companyList().forEach(function (t) {
      var o = document.createElement("option");
      o.value = t;
      o.textContent = nameFor(t) + " (" + t + ")";
      sel.appendChild(o);
    });
  }
  // Preco/mkt cap LIVE do Home (atualizado no EOD) — usado pelas deep-dives p/ nao mostrar valor congelado no build
  window.liveMkt = function (t) {
    var r = (HOME.rows || []).filter(function (x) { return x.ticker === t; })[0];
    return r && r.price != null ? { price: r.price, mktcap: r.mktcap, ytd: r.ytd, asof: HOME.as_of } : null;
  };
  function renderHeader() {
    var rec = DATA[state.ticker];
    var hrow = (HOME.rows || []).filter(function (r) { return r.ticker === state.ticker; })[0];
    if (!rec && !hrow) { el("company-header").innerHTML = ""; return; }
    var m = (rec && rec.meta) || {};
    var name = m.nome_empresa || (hrow && hrow.name) || state.ticker;
    var sub = [];
    if (m.setor || (hrow && hrow.sector)) sub.push(m.setor || hrow.sector);
    if (hrow && hrow.mktcap) sub.push("Mkt cap " + fmtMktCap(hrow.mktcap));
    if (hrow && hrow.price) sub.push("$" + fmtPrice(hrow.price) + "  " + (hrow.ytd != null ? "YTD " + fmtPctPlain(hrow.ytd) : ""));
    if (m.fiscal_year_end) sub.push("FY end: " + m.fiscal_year_end);
    var badge = m.status_tese ? '<span class="ch-status">' + (STATUS_LABELS[m.status_tese] || m.status_tese) + "</span>" : "";
    el("company-header").innerHTML =
      '<button class="pdf-fab" onclick="window.print()" title="Baixar esta pagina em PDF"><img src="assets/pdf-icon.svg" alt="PDF"></button>' +
      '<h2 class="ch-name">' + name + '<span class="ch-ticker">' + state.ticker + "</span> " + badge + "</h2>" +
      '<div class="ch-sub">' + sub.map(function (s) { return "<span>" + s + "</span>"; }).join("") + "</div>";
    var mb = [];
    if (m.ultima_atualizacao) mb.push("Wiki: " + m.ultima_atualizacao);
    if (rec && rec.built_at) mb.push("Build: " + rec.built_at);
    el("company-meta").innerHTML = mb.join("<br>");
    el("company-source").innerHTML = rec ? "<code>" + (rec.source || "") + "</code>" : "—";
  }
  function fmtPctPlain(v) { return (v > 0 ? "+" : "") + v.toFixed(1) + "%"; }

  function renderView() {
    var rec = DATA[state.ticker];
    var c = el("view-container");
    // Overview rico (EQ_OV) tem prioridade na aba 'ov'
    if (state.view === "ov" && window.EQ_OV && window.EQ_OV[state.ticker] && window.renderOverview) {
      c.innerHTML = window.renderOverview(state.ticker);
      if (window.setupOverviewCharts) window.setupOverviewCharts(c);
      document.querySelectorAll(".nav-btn").forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-view") === state.view);
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    // Insider Trading (EQ_INSIDER) na aba 'insider'
    if (state.view === "insider" && window.EQ_INSIDER && window.EQ_INSIDER[state.ticker] && window.renderInsider) {
      c.innerHTML = window.renderInsider(state.ticker);
      document.querySelectorAll(".nav-btn").forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-view") === state.view);
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    // Earnings Review (EQ_ER) na aba 'er'
    if (state.view === "er" && window.EQ_ER && window.EQ_ER[state.ticker] && window.renderER) {
      c.innerHTML = window.renderER(state.ticker);
      document.querySelectorAll(".nav-btn").forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-view") === state.view);
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    // Price Action (EQ_PA) na aba 'pa'
    if (state.view === "pa" && window.EQ_PA && window.EQ_PA[state.ticker] && window.renderPA) {
      c.innerHTML = window.renderPA(state.ticker);
      if (window.setupPA) window.setupPA();
      document.querySelectorAll(".nav-btn").forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-view") === state.view);
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    // Valuation rica (EQ_VAL) na aba 'val'
    if (state.view === "val" && window.EQ_VAL && window.EQ_VAL[state.ticker] && window.renderVal) {
      c.innerHTML = window.renderVal(state.ticker);
      if (window.setupVal) window.setupVal();
      document.querySelectorAll(".nav-btn").forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-view") === state.view);
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    // Investment Case rico (EQ_IC) na aba 'ic'
    if (state.view === "ic" && window.EQ_IC && window.EQ_IC[state.ticker] && window.renderIC) {
      c.innerHTML = window.renderIC(state.ticker);
      if (window.setupIC) window.setupIC();
      document.querySelectorAll(".nav-btn").forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-view") === state.view);
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!rec) return;
    c.innerHTML = (rec.views && rec.views[state.view]) || "";
    document.querySelectorAll(".nav-btn").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-view") === state.view);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  window.switchView = function (v) { state.view = v; renderView(); };
  window.selectCompany = function (t) { state.ticker = t; state.view = "ov"; renderHeader(); renderView(); };

  /* ---------- top-bar ---------- */
  window.switchTopBar = function (which) {
    el("home-app-body").style.display = which === "home" ? "" : "none";
    el("company-app-body").style.display = which === "company" ? "" : "none";
    var ind = el("industries-app-body"); if (ind) ind.style.display = which === "industries" ? "" : "none";
    el("tb-home").classList.toggle("active", which === "home");
    el("tb-company").classList.toggle("active", which === "company");
    var tbi = el("tb-industries"); if (tbi) tbi.classList.toggle("active", which === "industries");
    if (which === "industries" && !window._indInit) { window._indInit = 1; selectIndustry("advertising"); }
  };
  window.selectIndustry = function (key) {
    window._indKey = key;
    var c = el("industry-container");
    if (c && window.renderIndustry) c.innerHTML = window.renderIndustry(key);
    document.querySelectorAll("#industries-app-body .nav-btn").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-ind") === key);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---------- UPDATES feed (Home) ---------- */
  var updShown = 5;
  var UPD_MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function updDate(iso) { var p = String(iso).split("-"); return p.length === 3 ? UPD_MO[+p[1] - 1] + " " + (+p[2]) + ", " + p[0] : iso; }
  window.renderUpdates = function () {
    var c = el("home-updates"); if (!c) return;
    var ups = HOME.updates || [];
    if (!ups.length) { c.innerHTML = ""; return; }
    var tagcls = { COVERAGE: "upd-cov", EARNINGS: "upd-ern" };
    var rows = ups.slice(0, updShown).map(function (u) {
      return '<div class="upd-row"><span class="upd-tag ' + (tagcls[u.tag] || "") + '">' + u.tag + "</span>" +
        '<span class="upd-date">' + updDate(u.date) + "</span><span class=\"upd-txt\">" + u.html + "</span></div>";
    }).join("");
    var more = "";
    if (ups.length > 5) {
      more = updShown < ups.length
        ? '<button class="upd-more" onclick="updToggle()">Mostrar mais ' + (ups.length - updShown) + " ▾</button>"
        : '<button class="upd-more" onclick="updToggle()">Mostrar menos ▴</button>';
    }
    c.innerHTML = '<div class="upd-card"><div class="upd-head">UPDATES</div>' + rows + more + "</div>";
  };
  window.updToggle = function () { updShown = (updShown < (HOME.updates || []).length) ? (HOME.updates || []).length : 5; window.renderUpdates(); };

  /* ---------- init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    el("home-asof").textContent = HOME.as_of ? "market data as of " + HOME.as_of : "";
    window.renderUpdates();
    populateCompanySelect();
    var first = companyList()[0];
    if (first) { state.ticker = first; el("company-sel").value = first; }
    renderHomeTable();
    if (first) { renderHeader(); renderView(); }
    switchTopBar("home");
  });
})();
