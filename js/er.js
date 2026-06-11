/* Project Equity — aba Earnings Review (super deep-dive trimestral + tese + trade idea). */
(function () {
  "use strict";
  var ER = window.EQ_ER || {};

  function fBig(v) { if (v == null) return "—"; if (v >= 1e12) return "$" + (v / 1e12).toFixed(2) + "T"; if (v >= 1e9) return "$" + (v / 1e9).toFixed(0) + "B"; return "$" + (v / 1e6).toFixed(0) + "M"; }
  function pct(v) { return v == null ? "—" : (v > 0 ? "+" : "") + v + "%"; }

  // multi-line YoY/margem com dots interativos (data-eqtip via tooltip global)
  function lineChart(labels, lines, yfmt, h) {
    h = h || 240;
    var w = 1000, pad = { l: 46, r: 14, t: 16, b: 30 }, iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    var all = [];
    lines.forEach(function (l) { l.data.forEach(function (v) { if (v != null) all.push(v); }); });
    if (!all.length) return "";
    var min = Math.min.apply(null, all), max = Math.max.apply(null, all);
    min = Math.min(min, 0); var range = (max - min) || 1;
    var n = labels.length;
    var X = function (i) { return pad.l + (n < 2 ? 0 : i / (n - 1) * iw); };
    var Y = function (v) { return pad.t + ih - (v - min) / range * ih; };
    var zero = (min < 0 && max > 0) ? '<line x1="' + pad.l + '" x2="' + (w - pad.r) + '" y1="' + Y(0).toFixed(1) + '" y2="' + Y(0).toFixed(1) + '" stroke="#e5e7eb"/>' : "";
    var yl = "";
    for (var k = 0; k <= 4; k++) { var gv = min + range * k / 4; yl += '<text x="' + (pad.l - 6) + '" y="' + (Y(gv) + 3).toFixed(1) + '" text-anchor="end" font-size="9" fill="#94a3b8">' + yfmt(gv) + "</text>"; }
    var body = lines.map(function (l) {
      var pts = [], dots = "";
      l.data.forEach(function (v, i) {
        if (v == null) return;
        pts.push(X(i).toFixed(1) + "," + Y(v).toFixed(1));
        dots += '<circle class="ml-dot" cx="' + X(i).toFixed(1) + '" cy="' + Y(v).toFixed(1) + '" r="2.6" fill="' + l.color + '" data-eqtip="' + labels[i] + " · " + l.name + ": " + yfmt(v) + '"/>';
      });
      return '<polyline fill="none" stroke="' + l.color + '" stroke-width="1.6" ' + (l.dashed ? 'stroke-dasharray="4 3" ' : "") + 'points="' + pts.join(" ") + '"/>' + dots;
    }).join("");
    var xl = "";
    for (var i = 0; i < n; i += Math.ceil(n / 8)) xl += '<text x="' + X(i).toFixed(1) + '" y="' + (h - 10) + '" text-anchor="middle" font-size="8.5" fill="#94a3b8">' + labels[i] + "</text>";
    var leg = '<div class="ml-legend">' + lines.map(function (l) { return '<span class="ml-leg"><span class="ml-sw" style="background:' + l.color + (l.dashed ? ";opacity:.6" : "") + '"></span>' + l.name + "</span>"; }).join("") + "</div>";
    return '<svg viewBox="0 0 ' + w + " " + h + '" width="100%">' + zero + yl + body + xl + "</svg>" + leg;
  }

  function bar(label) { return '<div class="ic-sec-bar">' + label + "</div>"; }

  window.renderER = function (ticker) {
    var d = ER[ticker];
    if (!d) return null;
    var h = d.header || {};
    // preco/mkt cap LIVE do Home (EOD diario); EV recalculado = mkt cap live + net debt do build
    var _lv = window.liveMkt && window.liveMkt(ticker);
    var epx = _lv ? _lv.price : h.price;
    var emc = _lv ? _lv.mktcap : h.mktcap;
    var eev = (_lv && h.ev != null && h.mktcap) ? (_lv.mktcap + (h.ev - h.mktcap)) : h.ev;
    var banner = '<div class="ic-banner"><h2>' + d.name + " (" + ticker + ") — " + d.quarter_label + " Earnings Review</h2>" +
      '<div class="ic-thesis">' + d.reported + "</div></div>" +
      '<div class="ic-statbox">Price <b>' + (epx != null ? "$" + epx.toFixed(2) : "—") + "</b> &nbsp;|&nbsp; Mkt Cap <b>" + fBig(emc) +
      "</b> &nbsp;|&nbsp; EV <b>" + fBig(eev) + "</b> &nbsp;|&nbsp; Fwd P/E <b>" + (h.fwd_pe != null ? h.fwd_pe.toFixed(1) + "x" : "—") + "</b></div>";

    // KPI cards
    var kpis = '<div class="er-kpi-row">' + d.kpis.map(function (k) {
      return '<div class="kpi-card" style="border-left-color:#16a34a"><div class="kpi-label">' + k.label + '</div><div class="kpi-val">' + k.value + '</div><div class="kpi-sub">' + (k.sub || "") + "</div></div>";
    }).join("") + "</div>";

    // 1. Headline
    var labels = d.charts.trio.map(function (t) { return t.label; });
    var trioChart = lineChart(labels, [
      { name: "Revenue YoY%", color: "#1b3454", data: d.charts.trio.map(function (t) { return t.rev; }) },
      { name: "Op. Income YoY%", color: "#16a34a", data: d.charts.trio.map(function (t) { return t.oi; }) },
      { name: "Net Income YoY%", color: "#16a34a", dashed: true, data: d.charts.trio.map(function (t) { return t.ni; }) }
    ], function (v) { return Math.round(v) + "%"; });
    var cagrTable = '<table class="er-cagr"><thead><tr><th></th><th>CAGR 10Y</th><th>CAGR 5Y</th><th>CAGR 2Y</th><th>Tri atual YoY</th></tr></thead><tbody>' +
      d.cagr.map(function (r) { return "<tr><td>" + r.label + "</td><td>" + pct(r.c10) + "</td><td>" + pct(r.c5) + "</td><td>" + pct(r.c2) + "</td><td class='er-q'>" + pct(r.q) + "</td></tr>"; }).join("") + "</tbody></table>";
    var callouts = d.callouts_html.map(function (c) { return '<div class="er-callout">⚠️ ' + c + "</div>"; }).join("");
    var sec1 = bar("1. Headline — Executive Summary") +
      '<div class="ic-card"><div class="ic-card-title">YoY Revenue / Op. Income / Net Income</div>' + trioChart + "</div>" +
      '<div class="er-cagr-wrap">' + cagrTable + "</div>" + '<div class="er-prose">' + d.exec_html + "</div>" + callouts;

    // 2. Operating Results
    var sec2 = bar("2. Operating Results") + '<div class="er-prose">' + d.operating_html + "</div>";

    // 3. Margins & Financials
    var mt = d.margins_table || {};
    var mtbl = "";
    if (mt.cols) {
      mtbl = '<div class="table-wrap"><table class="er-mtbl"><thead><tr><th>Métrica</th>' + mt.cols.map(function (c) { return "<th class='num'>" + c + "</th>"; }).join("") + "</tr></thead><tbody>" +
        mt.rows.map(function (r) {
          var sub = r.label.indexOf("↳") === 0;
          return "<tr class='" + (sub ? "er-sub" : "") + "'><td>" + r.label + "</td>" + r.vals.map(function (v) { return "<td class='num'>" + v + "</td>"; }).join("") +
            "<td class='num er-yoy'>" + (r.yoy || "") + "</td></tr>";
        }).join("") + "</tbody></table></div>";
    }
    var gmChart = lineChart(d.charts.gm.map(function (x) { return x[0]; }), [{ name: "Gross Margin %", color: "#16a34a", data: d.charts.gm.map(function (x) { return x[1]; }) }], function (v) { return Math.round(v) + "%"; }, 200);
    var opmChart = lineChart(d.charts.opm.map(function (x) { return x[0]; }), [{ name: "Operating Margin %", color: "#1b3454", data: d.charts.opm.map(function (x) { return x[1]; }) }], function (v) { return Math.round(v) + "%"; }, 200);
    var sec3 = bar("3. Margins and Financials") + mtbl + '<div class="er-prose">' + d.margins_html + "</div>" +
      '<div class="chart-row"><div class="ic-card"><div class="ic-card-title">Gross Margin GAAP (%)</div>' + gmChart + "</div>" +
      '<div class="ic-card"><div class="ic-card-title">Operating Margin GAAP (%)</div>' + opmChart + "</div></div>";

    // 4. Guidance
    var sec4 = bar("4. Guidance and Outlook") + '<div class="er-prose">' + d.guidance_html + "</div>";

    // 5. Conference Call
    var quotes = d.cc.quotes.map(function (qt) { return '<blockquote class="er-quote">“' + qt + "”</blockquote>"; }).join("");
    var notes = d.cc.notes.map(function (nn) { return '<div class="er-note"><span class="er-note-t">' + nn.topic + "</span>" + nn.html + "</div>"; }).join("");
    var qa = d.cc.qa.map(function (x) { return '<div class="er-qa"><div class="er-q-q">Q: ' + x.q + "</div><div class='er-q-a'>" + x.html + "</div></div>"; }).join("");
    var sec5 = bar("5. Conference Call — Key Points") + '<div class="er-prose">' + d.cc.headline_html + "</div>" + quotes +
      '<div class="er-sublabel">Notas por tópico</div>' + notes + '<div class="er-sublabel">Q&amp;A — o que importou</div>' + qa;

    // 6. Thesis Update + Trade Idea
    var act = (d.trade.action || "").toUpperCase();
    var acls = act.indexOf("COMPRAR") >= 0 ? "buy" : (act.indexOf("VENDER") >= 0 || act.indexOf("REDUZIR") >= 0 || act.indexOf("REALIZAR") >= 0) ? "sell" : "hold";
    var trade = '<div class="er-trade er-trade-' + acls + '"><div class="er-trade-head"><span class="er-trade-lbl">TRADE IDEA</span><span class="er-trade-act">' + d.trade.action + "</span></div>" +
      '<div class="er-trade-body">' + d.trade.rationale_html + "</div></div>";
    var sec6 = bar("6. Thesis Update") +
      '<div class="er-thesis-grid">' +
        '<div class="er-th-card"><div class="er-th-t">Tese central</div>' + d.thesis.core + "</div>" +
        '<div class="er-th-card"><div class="er-th-t">Novos drivers</div>' + d.thesis.drivers + "</div>" +
        '<div class="er-th-card er-bear"><div class="er-th-t">Bear case / riscos</div>' + d.thesis.bear + "</div>" +
        '<div class="er-th-card"><div class="er-th-t">Monitorar no próximo tri</div>' + d.thesis.monitor + "</div>" +
      "</div>" + trade;

    var src = '<div class="ic-src" style="margin-top:18px">FONTE OFICIAL — ' + d.source + "</div>";

    // cabecalho FOX (so na impressao) + botao Salvar PDF
    var printHeader = '<div class="ind-print-header"><img src="assets/fox-logo.svg" alt="FOX" class="ind-print-logo">' +
      '<div class="ind-print-meta"><b>' + d.name + " (" + ticker + ") — " + d.quarter_label + " Earnings Review</b>" +
      "<span>Fox Investimentos · " + d.reported + "</span></div></div>";
    var pdfBar = '<div class="er-pdf-bar"><button class="ind-pdf-btn" onclick="window.print()" title="Salvar/imprimir este Earnings Review em PDF">⎙ Salvar PDF</button></div>';

    return "<div class='er-tab'>" + printHeader + pdfBar + banner + kpis + sec1 + sec2 + sec3 + sec4 + sec5 + sec6 + src + "</div>";
  };
})();
