/* Project Equity — renderer do Company Overview rico (EQ_OV). SVG nativo, sem libs. */
(function () {
  "use strict";
  var OV = window.EQ_OV || {};

  /* ---------- formatters ---------- */
  function fB(v) { // valor ja em $B
    if (v == null) return "—";
    if (Math.abs(v) >= 1000) return "$" + (v / 1000).toFixed(2) + "T";
    return (v < 0 ? "-$" : "$") + Math.abs(v).toFixed(0) + "B";
  }
  function fBig(v) { // dolares crus
    if (v == null) return "—";
    if (v >= 1e12) return "$" + (v / 1e12).toFixed(2) + "T";
    if (v >= 1e9) return "$" + (v / 1e9).toFixed(0) + "B";
    return "$" + (v / 1e6).toFixed(0) + "M";
  }
  function pct(v, d) { return v == null ? "—" : (v > 0 ? "+" : "") + v.toFixed(d == null ? 1 : d) + "%"; }
  function px(v) { return v == null ? "—" : "$" + v.toFixed(2); }
  function cls(v) { return v == null ? "" : (v > 0 ? "pos" : v < 0 ? "neg" : ""); }

  /* ---------- SVG charts ---------- */
  function barChart(data, color, unit) {
    if (!data || !data.length) return "";
    var w = 380, h = 190, pad = { l: 6, r: 6, t: 20, b: 22 };
    var iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    var max = Math.max.apply(null, data.map(function (d) { return d[1]; })) * 1.18 || 1;
    var bw = iw / data.length;
    var bars = data.map(function (d, i) {
      var bh = Math.max(1, (d[1] / max) * ih);
      var x = pad.l + i * bw + bw * 0.16, y = pad.t + ih - bh;
      var lbl = unit === "%" ? Math.round(d[1]) + "%" : "$" + d[1].toFixed(d[1] < 10 ? 1 : 0) + "B";
      var tip = "FY" + String(d[0]).slice(2) + ": " + lbl;
      return '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (bw * 0.68).toFixed(1) +
        '" height="' + bh.toFixed(1) + '" fill="' + color + '" rx="2" data-eqtip="' + tip + '"/>' +
        '<text x="' + (x + bw * 0.34).toFixed(1) + '" y="' + (y - 4).toFixed(1) + '" text-anchor="middle" font-size="8.5" fill="#475569">' + lbl + '</text>' +
        '<text x="' + (x + bw * 0.34).toFixed(1) + '" y="' + (h - 7) + '" text-anchor="middle" font-size="8.5" fill="#94a3b8">' + String(d[0]).slice(2) + '</text>';
    }).join("");
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%">' + bars + '</svg>';
  }

  function lineChart(data, color, yfmt, avg, kind) {
    if (!data || data.length < 2) return "";
    var w = 540, h = 210, pad = { l: 38, r: 12, t: 12, b: 22 };
    var iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    var vals = data.map(function (d) { return d[1]; });
    var max = Math.max.apply(null, vals), min = Math.min.apply(null, vals);
    if (avg != null) { max = Math.max(max, avg); min = Math.min(min, avg); }
    var range = (max - min) || 1;
    var X = function (i) { return pad.l + (i / (data.length - 1)) * iw; };
    var Y = function (v) { return pad.t + ih - ((v - min) / range) * ih; };
    var pts = data.map(function (d, i) { return X(i).toFixed(1) + "," + Y(d[1]).toFixed(1); }).join(" ");
    var avgL = "";
    if (avg != null) {
      var ya = Y(avg);
      avgL = '<line x1="' + pad.l + '" y1="' + ya.toFixed(1) + '" x2="' + (w - pad.r) + '" y2="' + ya.toFixed(1) +
        '" stroke="#dc2626" stroke-width="1" stroke-dasharray="4 3"/>' +
        '<text x="' + (w - pad.r) + '" y="' + (ya - 4).toFixed(1) + '" text-anchor="end" font-size="9" fill="#dc2626">avg ' + yfmt(avg) + '</text>';
    }
    var yl = '<text x="3" y="' + (Y(max) + 3).toFixed(1) + '" font-size="9" fill="#94a3b8">' + yfmt(max) + '</text>' +
      '<text x="3" y="' + (Y(min) + 3).toFixed(1) + '" font-size="9" fill="#94a3b8">' + yfmt(min) + '</text>';
    var xl = "";
    [0, Math.floor(data.length / 2), data.length - 1].forEach(function (i) {
      xl += '<text x="' + X(i).toFixed(1) + '" y="' + (h - 6) + '" text-anchor="middle" font-size="9" fill="#94a3b8">' + String(data[i][0]).slice(0, 4) + '</text>';
    });
    var guide = '<line class="hg" x1="0" x2="0" y1="' + pad.t + '" y2="' + (pad.t + ih) + '" stroke="#94a3b8" stroke-width="1" stroke-dasharray="3 3" visibility="hidden"/>';
    var dot = '<circle class="hd" r="3.6" fill="' + color + '" stroke="#fff" stroke-width="1.5" visibility="hidden"/>';
    return '<svg class="ln-svg" viewBox="0 0 ' + w + ' ' + h + '" width="100%" preserveAspectRatio="none"' +
      " data-series='" + JSON.stringify(data) + "'" +
      ' data-w="' + w + '" data-padl="' + pad.l + '" data-padt="' + pad.t + '" data-iw="' + iw +
      '" data-ih="' + ih + '" data-min="' + min + '" data-max="' + max + '" data-kind="' + (kind || "price") + '">' +
      '<polyline fill="none" stroke="' + color + '" stroke-width="1.4" points="' + pts + '"/>' + avgL + yl + xl + guide + dot + '</svg>';
  }

  // Liga o hover (tooltip + guia) nos graficos de linha. Chamado pelo app apos render.
  window.setupOverviewCharts = function (root) {
    (root || document).querySelectorAll(".ln-svg").forEach(function (svg) {
      if (svg._wired) return; svg._wired = true;
      var series = JSON.parse(svg.getAttribute("data-series"));
      var w = +svg.dataset.w, padl = +svg.dataset.padl, padt = +svg.dataset.padt,
          iw = +svg.dataset.iw, ih = +svg.dataset.ih, min = +svg.dataset.min,
          max = +svg.dataset.max, kind = svg.dataset.kind;
      var range = (max - min) || 1, n = series.length;
      var guide = svg.querySelector(".hg"), dot = svg.querySelector(".hd");
      var box = svg.parentNode, tip = document.createElement("div");
      tip.className = "chart-tip"; box.appendChild(tip);
      function X(i) { return padl + (i / (n - 1)) * iw; }
      function Y(v) { return padt + ih - ((v - min) / range) * ih; }
      svg.addEventListener("mousemove", function (e) {
        var r = svg.getBoundingClientRect();
        var vx = (e.clientX - r.left) / r.width * w;
        var i = Math.round((vx - padl) / iw * (n - 1));
        i = Math.max(0, Math.min(n - 1, i));
        var dd = series[i], gx = X(i), gy = Y(dd[1]);
        guide.setAttribute("x1", gx); guide.setAttribute("x2", gx); guide.setAttribute("visibility", "visible");
        dot.setAttribute("cx", gx); dot.setAttribute("cy", gy); dot.setAttribute("visibility", "visible");
        var val = kind === "pe" ? dd[1].toFixed(1) + "x" : "$" + dd[1].toFixed(2);
        tip.innerHTML = "<b>" + val + "</b>" + tipDate(dd[0]);
        tip.style.display = "block";
        var pr = box.getBoundingClientRect();
        var left = e.clientX - pr.left + 14;
        if (left > pr.width - 100) left = e.clientX - pr.left - 100;
        tip.style.left = left + "px";
        tip.style.top = Math.max(4, e.clientY - pr.top - 4) + "px";
      });
      svg.addEventListener("mouseleave", function () {
        guide.setAttribute("visibility", "hidden");
        dot.setAttribute("visibility", "hidden");
        tip.style.display = "none";
      });
    });
  };
  function tipDate(iso) {
    var p = String(iso).split("-");
    return p.length === 3 ? "<span>" + MO[+p[1] - 1] + " " + p[2] + ", " + p[0] + "</span>" : "<span>" + iso + "</span>";
  }

  /* ---------- KPI card ---------- */
  function kpi(label, value, vcls, sub, accent) {
    return '<div class="kpi-card" style="border-left-color:' + (accent || "#1b3454") + '">' +
      '<div class="kpi-label">' + label + '</div>' +
      '<div class="kpi-val ' + (vcls || "") + '">' + value + '</div>' +
      (sub ? '<div class="kpi-sub">' + sub + '</div>' : "") + '</div>';
  }

  /* ---------- main ---------- */
  window.renderOverview = function (ticker) {
    var d = OV[ticker];
    if (!d) return null;
    var m = d.mkt || {}, fy = d.fy || {}, c = d.cagr || {}, q = d.latest_q || {}, s = d.series || {};
    // preco/mkt cap LIVE do Home (EOD diario); EV recalculado = mkt cap live + net debt do build
    var _lv = window.liveMkt && window.liveMkt(ticker);
    var pxv = _lv ? _lv.price : m.price;
    var mcv = _lv ? _lv.mktcap : m.mktcap;
    var evv = (_lv && m.ev != null && m.mktcap) ? (_lv.mktcap + (m.ev - m.mktcap)) : m.ev;
    var asofv = _lv ? _lv.asof : m.asof;

    // Banner
    var badge = d.rating ? '<span class="ov-badge ow">' + d.rating + '</span>'
      : (d.status_label ? '<span class="ov-badge st">' + d.status_label + '</span>' : "");
    var banner =
      '<div class="ov-banner">' +
        '<div class="ovb-top"><h2>' + d.name + ' (' + ticker + ') — Company Overview</h2>' + badge + '</div>' +
        (d.one_liner_html ? '<div class="ovb-sub">' + d.one_liner_html + '</div>' : "") +
        '<div class="ovb-stats">' +
          '<span><b>Price</b> ' + px(pxv) + ' <i>live · ' + fmtDate(asofv) + '</i></span>' +
          '<span><b>Mkt Cap</b> ' + fBig(mcv) + '</span>' +
          '<span><b>EV</b> ' + fBig(evv) + '</span>' +
          '<span><b>Net Debt</b> ' + fB(fy.net_debt) + (fy.net_debt < 0 ? ' <i>net cash</i>' : '') + '</span>' +
        '</div>' +
      '</div>';

    // FY highlights
    var ndCls = fy.net_debt != null ? (fy.net_debt < 0 ? "pos" : "neg") : "";
    var highlights =
      '<div class="ov-sec-label">FY' + (fy.fy || "") + ' HIGHLIGHTS (ANNUAL) · <i>SEC EDGAR</i></div>' +
      '<div class="kpi-row">' +
        kpi("REVENUE", fB(fy.revenue), "", null, "#1b3454") +
        kpi("OP MARGIN", pct(fy.op_margin), "pos", null, "#16a34a") +
        kpi("ROIC", pct(fy.roic), "pos", "NOPAT / cap. investido", "#16a34a") +
        kpi("FREE CASH FLOW", fB(fy.fcf), "", "OCF − capex", "#1b3454") +
        kpi("NET DEBT", fB(fy.net_debt), ndCls, fy.net_debt < 0 ? "net cash" : null, "#16a34a") +
      '</div>';

    // Thesis
    var thesis = d.narrative && d.narrative.thesis ?
      '<div class="ov-panel"><div class="ov-panel-label">INVESTMENT THESIS</div>' + d.narrative.thesis +
        (d.narrative.management ? '<div class="ov-mgmt"><b>Management:</b> ' + stripP(d.narrative.management) + '</div>' : "") +
      '</div>' : "";

    // Profile cards (CAGR table + ROIC bar + FCF bar)
    var cagrTable =
      '<table class="cagr-tbl"><thead><tr><th>Metric</th><th>10Y CAGR</th><th>5Y CAGR</th><th>YoY</th></tr></thead><tbody>' +
        '<tr><td>Revenue</td><td>' + pct(c.rev_10y, 0) + '</td><td>' + pct(c.rev_5y, 0) + '</td><td>' + pct(c.rev_yoy, 0) + '</td></tr>' +
        '<tr><td>Net income</td><td>' + pct(c.ni_10y, 0) + '</td><td>' + pct(c.ni_5y, 0) + '</td><td>' + pct(c.ni_yoy, 0) + '</td></tr>' +
      '</tbody></table>';
    var profiles =
      '<div class="profile-row">' +
        '<div class="profile-card"><div class="pc-title">GROWTH PROFILE — CAGRS</div>' + cagrTable +
          '<div class="pc-note">Revenue e Net income (GAAP, SEC). EPS por ação distorce por splits.</div></div>' +
        '<div class="profile-card"><div class="pc-title">RETURNS PROFILE — ROIC % (10Y)</div>' +
          barChart(s.roic, "#16a34a", "%") + '<div class="pc-note">ROIC = NOPAT / capital investido líquido de caixa.</div></div>' +
        '<div class="profile-card"><div class="pc-title">CASH GENERATION — FCF (10Y)</div>' +
          barChart(s.fcf, "#1b3454", "$B") + '<div class="pc-note">FCF = OCF − capex (SEC).</div></div>' +
      '</div>';

    // Earnings momentum
    var emBadge = (q.rev_yoy != null && q.rev_yoy > 0) ? '<span class="em-badge pos">POSITIVE</span>' : "";
    var qlabel = q.end ? fmtQuarter(q.end) : "";
    var em = q && q.revenue != null ?
      '<div class="ov-sec-label">EARNINGS MOMENTUM — LATEST QUARTER (' + qlabel + ') ' + emBadge + '</div>' +
      '<div class="kpi-row em-row">' +
        kpi("REVENUE", fB(q.revenue), "", q.rev_yoy != null ? "YoY " + pct(q.rev_yoy) : null, "#1b3454") +
        kpi("OP MARGIN", pct(q.op_margin), "pos", null, "#16a34a") +
        kpi("NET INCOME", fB(q.ni), "", q.ni_yoy != null ? "YoY " + pct(q.ni_yoy) : null, "#1b3454") +
        kpi("FWD P/E (NOW)", m.fwd_pe != null ? m.fwd_pe.toFixed(1) + "x" : "—", "neg", "NTM · live " + fmtDate(m.asof), "#dc2626") +
      '</div>' : "";

    // Charts price + fwd PE
    var charts =
      '<div class="chart-row">' +
        '<div class="chart-box"><div class="cb-title">Stock Price (5Y)</div>' +
          lineChart(s.price, "#1b3454", function (v) { return "$" + Math.round(v); }, null, "price") + '</div>' +
        '<div class="chart-box"><div class="cb-title">Forward P/E (5Y, com média 5Y)</div>' +
          lineChart(s.fwdpe, "#1b3454", function (v) { return v.toFixed(0) + "x"; }, d.fwdpe_5y_avg, "pe") + '</div>' +
      '</div>';

    // Catalysts / Risks (listas limitadas: ate 5 / ate 6)
    var cats = (d.narrative && d.narrative.catalysts) || [];
    var rsks = (d.narrative && d.narrative.risks) || [];
    var cr = "";
    if (cats.length || rsks.length) {
      cr = '<div class="cat-risk-row">' +
        '<div class="cat-col"><div class="cr-title">CATALISADORES — em ordem de relevância</div>' + liList(cats, "ol") + '</div>' +
        '<div class="risk-col"><div class="cr-title">PRIMARY RISKS</div>' + liList(rsks, "ul") + '</div>' +
      '</div>';
    }

    // Detailed tabs
    var tabs =
      '<div class="ov-sec-label">DETAILED TABS</div><div class="detail-tabs">' +
        dtab("ic", "Investment Case →", "Tese completa, vantagem competitiva, harness") +
        dtab("pa", "Price Action →", "Histórico de preço e era markers") +
        dtab("val", "Valuation →", "Fwd P/E, múltiplos, projeção") +
        dtab("er", "Earnings Review →", "Resultados trimestrais e calls") +
      '</div>';

    return '<div class="ov-rich">' + banner + highlights + thesis + profiles + em + charts + cr + tabs + '</div>';
  };

  function liList(items, tag) {
    if (!items || !items.length) return "<p>—</p>";
    return "<" + tag + ' class="cr-list">' + items.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</" + tag + ">";
  }
  function dtab(view, title, sub) {
    return '<div class="dtab" onclick="switchView(\'' + view + '\')"><div class="dt-title">' + title + '</div><div class="dt-sub">' + sub + '</div></div>';
  }
  function stripP(html) { return html.replace(/^<p>/, "").replace(/<\/p>\s*$/, ""); }

  var MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function fmtDate(iso) {
    if (!iso) return "—"; var p = String(iso).split("-");
    return p.length === 3 ? MO[+p[1] - 1] + " " + p[2] + ", " + p[0] : iso;
  }
  function fmtQuarter(iso) {
    var p = String(iso).split("-"); if (p.length !== 3) return iso;
    var mo = +p[1], q = mo <= 3 ? "Q1" : mo <= 6 ? "Q2" : mo <= 9 ? "Q3" : "Q4";
    return q + " " + p[0];
  }
})();
