/* Project Equity — aba Valuation: P/E histórico (Forward NTM desde 2021 / Trailing 12M desde IPO)
   + tabela de crescimento (CAGR · consenso · FOX). */
(function () {
  "use strict";
  var VAL = window.EQ_VAL || {};
  var cur = { ticker: null, metric: "forward", range: "MAX" };
  var RANGES = { forward: ["MAX", "5Y", "2Y", "1Y"], trailing: ["MAX", "10Y", "5Y", "2Y"] };
  var METRIC_LABEL = { forward: "Forward P/E (NTM consensus)", trailing: "Trailing P/E (12M)" };

  var MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function fmtDate(iso) { var p = String(iso).split("-"); return p.length === 3 ? MO[+p[1] - 1] + " " + p[2] + ", " + p[0] : iso; }
  function pe(v) { return v == null ? "—" : v.toFixed(1) + "x"; }
  function pct(v) { return v == null ? "—" : (v > 0 ? "+" : "") + v + "%"; }

  function curSeriesAll() { var d = VAL[cur.ticker]; return d && d.pe && d.pe[cur.metric] ? d.pe[cur.metric] : null; }

  function filterRange(series, range) {
    if (range === "MAX" || !series.length) return series;
    var yrs = { "1Y": 1, "2Y": 2, "3Y": 3, "5Y": 5, "10Y": 10 }[range] || 99;
    var last = new Date(series[series.length - 1][0]);
    var cut = new Date(last.getFullYear() - yrs, last.getMonth(), last.getDate()).toISOString().slice(0, 10);
    return series.filter(function (p) { return p[0] >= cut; });
  }

  function stats(series) {
    var v = series.map(function (p) { return p[1]; });
    var avg = v.reduce(function (a, b) { return a + b; }, 0) / v.length;
    var sd = Math.sqrt(v.reduce(function (a, b) { return a + (b - avg) * (b - avg); }, 0) / v.length);
    return { avg: avg, low: Math.min.apply(null, v), high: Math.max.apply(null, v), sigma: sd };
  }

  function card(label, value, sub, vcls, accent) {
    return '<div class="kpi-card" style="border-left-color:' + (accent || "#1b3454") + '">' +
      '<div class="kpi-label">' + label + '</div><div class="kpi-val ' + (vcls || "") + '">' + value + "</div>" +
      (sub ? '<div class="kpi-sub">' + sub + "</div>" : "") + "</div>";
  }

  window.renderVal = function (ticker) {
    var d = VAL[ticker];
    if (!d) return null;
    cur.ticker = ticker;
    cur.metric = (d.pe && d.pe.forward) ? "forward" : "trailing";
    cur.range = "MAX";

    // metric toggle (só mostra os que existem)
    var mt = ["forward", "trailing"].filter(function (m) { return d.pe && d.pe[m]; }).map(function (m) {
      return '<button class="val-metric-btn' + (m === cur.metric ? " active" : "") + '" onclick="valSetMetric(\'' + m + '\')">' +
        (m === "forward" ? "Forward (NTM)" : "Trailing (12M)") + "</button>";
    }).join("");

    var header = '<div class="val-head"><h2 class="val-title">' + d.name + " (" + ticker + ')</h2>' +
      '<div class="val-metric-toggle">' + mt + '</div><div class="val-subh" id="val-subh"></div></div>';

    // tabela de crescimento
    var yoyLab = "FY" + String(d.latest_fy).slice(2) + " YoY";
    var thead = "<tr><th>Metric</th><th class='num'>CAGR 10Y</th><th class='num'>CAGR 5Y</th><th class='num'>" + yoyLab + "</th>" +
      "<th class='num cons'>FY+1e cons.</th><th class='num cons'>FY+2e cons.</th>" +
      "<th class='num ours'>FY+1e FOX</th><th class='num ours'>FY+2e FOX</th></tr>";
    var tbody = d.rows.map(function (r) {
      var tip = r.rationale ? ' data-eqtip="' + r.rationale.replace(/"/g, "&quot;") + '"' : "";
      return "<tr><td class='vm'>" + r.metric + "</td><td class='num g'>" + pct(r.cagr10) + "</td><td class='num g'>" + pct(r.cagr5) +
        "</td><td class='num g'>" + pct(r.yoy) + "</td><td class='num cons'>" + pct(r.cons1) + "</td><td class='num cons'>" + pct(r.cons2) +
        "</td><td class='num ours'" + tip + ">" + pct(r.ours1) + "</td><td class='num ours'" + tip + ">" + pct(r.ours2) + "</td></tr>";
    }).join("");
    var table = "<div class='table-wrap'><table class='val-tbl'><thead>" + thead + "</thead><tbody>" + tbody + "</tbody></table></div>";

    var note = "<div class='val-note'>Históricos (≤FY" + String(d.latest_fy).slice(2) + ") = <b>SEC EDGAR</b> (EPS histórico usa Net income como proxy — splits distorcem EPS por ação). " +
      "Forward <b>cons.</b> = <b>Bloomberg BEst</b> (1FY/2FY); EBIT cons. = — (não pesquisado). <b>Colunas verdes (FOX)</b> = nossas estimativas — <b>hover</b> p/ o racional. " +
      "<b>Gráfico:</b> Forward (NTM) só existe desde 2021 no Bloomberg; Trailing (12M) vai até o IPO — use o toggle.</div>";

    return "<div class='val-tab'>" + header +
      "<div class='kpi-row val-cards' id='val-cards'></div>" + table + note +
      "<div class='val-ranges' id='val-ranges'></div>" +
      "<div class='chart-box val-chart-box'><div id='val-chart'></div></div></div>";
  };

  window.valSetMetric = function (m) {
    cur.metric = m;
    cur.range = (m === "trailing") ? "10Y" : "MAX";
    document.querySelectorAll(".val-metric-btn").forEach(function (b) {
      b.classList.toggle("active", b.textContent.indexOf(m === "forward" ? "Forward" : "Trailing") >= 0);
    });
    refresh();
  };
  window.valSetRange = function (r) { cur.range = r; refresh(); };
  window.setupVal = function () { refresh(); };

  function refresh() {
    var pk = curSeriesAll(); if (!pk) return;
    var d = VAL[cur.ticker];
    // subtitle
    var sub = document.getElementById("val-subh");
    if (sub) sub.textContent = METRIC_LABEL[cur.metric] + " · " + pk.first_year + " → " +
      String(pk.last_date).slice(0, 4) + " · semanal · " + pk.n + " pontos";
    // ranges
    var rc = document.getElementById("val-ranges");
    if (rc) rc.innerHTML = RANGES[cur.metric].map(function (r) {
      return '<button class="val-range-btn' + (r === cur.range ? " active" : "") + '" onclick="valSetRange(\'' + r + '\')">' + r + "</button>";
    }).join("");
    // cards (stats sobre a janela exibida)
    var shown = filterRange(pk.series, cur.range);
    var st = stats(shown);
    var live = pk.live;
    var vsavg = st.avg ? Math.round((live / st.avg - 1) * 100) : null;
    var cc = document.getElementById("val-cards");
    var rlab = cur.range === "MAX" ? "(desde " + pk.first_year + ")" : "(" + cur.range + ")";
    if (cc) cc.innerHTML =
      card((cur.metric === "forward" ? "CURRENT FWD P/E" : "CURRENT P/E"), pe(live),
        (vsavg != null ? (vsavg > 0 ? "+" : "") + vsavg + "% vs média · live" : ""), "", "#1b3454") +
      card("MÉDIA " + rlab, pe(st.avg), "±1σ = " + pe(st.sigma), "neg", "#dc2626") +
      card("LOW " + rlab, pe(st.low), "mínimo", "pos", "#16a34a") +
      card("HIGH " + rlab, pe(st.high), "máximo", "neg", "#dc2626");
    drawChart(shown, st);
  }

  function drawChart(series, st) {
    var box = document.getElementById("val-chart"); if (!box || series.length < 2) { if (box) box.innerHTML = ""; return; }
    var avg = st.avg, sig1 = st.avg + st.sigma;
    var vals = series.map(function (p) { return p[1]; });
    var w = 1000, h = 340, pad = { l: 44, r: 58, t: 14, b: 26 };
    var iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    max = Math.max(max, sig1); min = Math.min(min, avg);
    var range = (max - min) || 1;
    var X = function (i) { return pad.l + (i / (series.length - 1)) * iw; };
    var Y = function (v) { return pad.t + ih - (v - min) / range * ih; };
    var pts = series.map(function (p, i) { return X(i).toFixed(1) + "," + Y(p[1]).toFixed(1); }).join(" ");
    var step = max - min > 120 ? 40 : (max - min > 50 ? 20 : 10);
    var grid = "";
    for (var g = Math.ceil(min / step) * step; g <= max; g += step) {
      grid += '<line x1="' + pad.l + '" x2="' + (w - pad.r) + '" y1="' + Y(g).toFixed(1) + '" y2="' + Y(g).toFixed(1) + '" stroke="#f1f3f5"/>' +
        '<text x="' + (pad.l - 6) + '" y="' + (Y(g) + 3).toFixed(1) + '" text-anchor="end" font-size="10" fill="#94a3b8">' + g + "x</text>";
    }
    var avgL = '<line x1="' + pad.l + '" x2="' + (w - pad.r) + '" y1="' + Y(avg).toFixed(1) + '" y2="' + Y(avg).toFixed(1) + '" stroke="#dc2626" stroke-width="1.2" stroke-dasharray="6 4"/>' +
      '<text x="' + (w - pad.r + 4) + '" y="' + (Y(avg) + 3).toFixed(1) + '" font-size="10" fill="#dc2626">Avg ' + avg.toFixed(1) + "x</text>";
    var sigL = '<line x1="' + pad.l + '" x2="' + (w - pad.r) + '" y1="' + Y(sig1).toFixed(1) + '" y2="' + Y(sig1).toFixed(1) + '" stroke="#9ca3af" stroke-dasharray="2 3"/>' +
      '<text x="' + (w - pad.r + 4) + '" y="' + (Y(sig1) + 3).toFixed(1) + '" font-size="10" fill="#9ca3af">+1σ ' + sig1.toFixed(1) + "x</text>";
    var xLab = "";
    [0, Math.floor(series.length / 2), series.length - 1].forEach(function (i) {
      xLab += '<text x="' + X(i).toFixed(1) + '" y="' + (h - 7) + '" text-anchor="middle" font-size="10" fill="#94a3b8">' + String(series[i][0]).slice(0, 7) + "</text>";
    });
    // marcador do valor atual na ponta da linha
    var li = series.length - 1, lx = X(li), ly = Y(series[li][1]), lv = series[li][1];
    var endMark = '<circle cx="' + lx.toFixed(1) + '" cy="' + ly.toFixed(1) + '" r="4.5" fill="#16a34a" stroke="#fff" stroke-width="1.5"/>' +
      '<rect x="' + (lx + 7).toFixed(1) + '" y="' + (ly - 11).toFixed(1) + '" width="46" height="22" rx="4" fill="#16a34a"/>' +
      '<text x="' + (lx + 30).toFixed(1) + '" y="' + (ly + 4).toFixed(1) + '" text-anchor="middle" font-size="12.5" font-weight="700" fill="#fff">' + lv.toFixed(1) + "x</text>";
    var guide = '<line class="vhg" x1="0" x2="0" y1="' + pad.t + '" y2="' + (pad.t + ih) + '" stroke="#94a3b8" stroke-dasharray="3 3" visibility="hidden"/>' +
      '<circle class="vhd" r="4" fill="#1b3454" stroke="#fff" stroke-width="1.5" visibility="hidden"/>';
    box.innerHTML = '<svg id="val-svg" viewBox="0 0 ' + w + " " + h + '" width="100%" style="cursor:crosshair">' + grid +
      '<polyline fill="none" stroke="#1b3454" stroke-width="1.3" points="' + pts + '"/>' + avgL + sigL + xLab + endMark + guide + "</svg>";
    wireHover(document.getElementById("val-svg"), series, w, pad, iw, X, Y);
  }

  function wireHover(svg, series, w, pad, iw, X, Y) {
    if (!svg) return;
    var guide = svg.querySelector(".vhg"), dot = svg.querySelector(".vhd"), box = svg.parentNode;
    var tip = box.querySelector(".chart-tip");
    if (!tip) { tip = document.createElement("div"); tip.className = "chart-tip"; box.appendChild(tip); }
    var n = series.length;
    svg.addEventListener("mousemove", function (e) {
      var r = svg.getBoundingClientRect();
      var i = Math.round(((e.clientX - r.left) / r.width * w - pad.l) / iw * (n - 1));
      i = Math.max(0, Math.min(n - 1, i));
      var gx = X(i), gy = Y(series[i][1]);
      guide.setAttribute("x1", gx); guide.setAttribute("x2", gx); guide.setAttribute("visibility", "visible");
      dot.setAttribute("cx", gx); dot.setAttribute("cy", gy); dot.setAttribute("visibility", "visible");
      tip.innerHTML = "<b>" + series[i][1].toFixed(1) + "x</b><span>" + fmtDate(series[i][0]) + "</span>";
      tip.style.display = "block";
      var pr = box.getBoundingClientRect();
      var left = e.clientX - pr.left + 14; if (left > pr.width - 90) left = e.clientX - pr.left - 90;
      tip.style.left = left + "px"; tip.style.top = Math.max(4, e.clientY - pr.top - 6) + "px";
    });
    svg.addEventListener("mouseleave", function () {
      guide.setAttribute("visibility", "hidden"); dot.setAttribute("visibility", "hidden"); tip.style.display = "none";
    });
  }
})();
