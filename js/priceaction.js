/* Project Equity — aba Historical Price Action: preço vs S&P 500 + eras + comentário. */
(function () {
  "use strict";
  var PA = window.EQ_PA || {};
  var cur = { ticker: null, range: "10Y", mode: "indexed", bench: "spx" };
  var RANGES = ["MAX", "10Y", "5Y", "2Y", "YTD"];
  var BENCH = { spx: { col: 2, name: "S&P 500", retk: "vs_sp", rk: "sp_ret" }, ndx: { col: 3, name: "Nasdaq", retk: "vs_nq", rk: "nq_ret" } };

  var MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function fmtDate(iso) { var p = String(iso).split("-"); return p.length === 3 ? MO[+p[1] - 1] + " " + p[2] + ", " + p[0] : iso; }
  function fBig(v) { if (v == null) return "—"; if (v >= 1e12) return "$" + (v / 1e12).toFixed(2) + "T"; if (v >= 1e9) return "$" + (v / 1e9).toFixed(0) + "B"; return "$" + (v / 1e6).toFixed(0) + "M"; }
  function pctSign(v) { return v == null ? "—" : (v > 0 ? "+" : "") + v + "%"; }

  window.renderPA = function (ticker) {
    var d = PA[ticker];
    if (!d) return null;
    cur.ticker = ticker; cur.range = "10Y"; cur.mode = "indexed";
    var h = d.header || {};
    var banner = '<div class="ic-banner"><h2>' + d.name + " (" + ticker + ") — Price Action</h2>" +
      '<div class="ic-thesis">Histórico de preço vs S&amp;P 500, marcadores de era e performance relativa</div></div>' +
      '<div class="ic-statbox">Price <b>' + (h.price != null ? "$" + h.price.toFixed(2) : "—") + "</b> &nbsp;|&nbsp; Mkt Cap <b>" + fBig(h.mktcap) +
      "</b> &nbsp;|&nbsp; EV <b>" + fBig(h.ev) + "</b> &nbsp;|&nbsp; Fwd P/E <b>" + (h.fwd_pe != null ? h.fwd_pe.toFixed(1) + "x" : "—") +
      '</b> <span style="float:right;color:#94a3b8;font-size:11px">live · ' + fmtDate(h.asof) + "</span></div>";

    var toggles = '<div class="pa-toolbar"><div class="val-ranges" id="pa-ranges"></div>' +
      '<div class="val-metric-toggle" id="pa-bench"><button class="pa-bench-btn active" onclick="paSetBench(\'spx\')">vs S&amp;P 500</button>' +
      '<button class="pa-bench-btn" onclick="paSetBench(\'ndx\')">vs Nasdaq</button></div>' +
      '<div class="val-metric-toggle"><button class="pa-mode-btn active" onclick="paSetMode(\'indexed\')">Indexed</button>' +
      '<button class="pa-mode-btn" onclick="paSetMode(\'price\')">Price ($)</button></div></div>';
    var retLabel = '<div class="pa-retlabel" id="pa-retlabel"></div>';
    var chart = '<div class="chart-box pa-chart-box"><div id="pa-chart"></div></div>';

    // era cards (renderizados em refresh() p/ acompanhar o benchmark)
    var cards = '<div class="ov-sec-label" style="margin-top:24px">Comentário era-a-era <span style="font-weight:400;text-transform:none;color:#94a3b8">— fundamento (receita oficial) + preço vs benchmark</span></div><div class="era-grid" id="pa-eras"></div>';

    return "<div class='pa-tab'>" + banner +
      '<div class="ov-sec-label" style="margin-top:18px">Stock price history <span style="font-weight:400;text-transform:none">(desde 1999 IPO · split-adjusted · semanal)</span></div>' +
      toggles + retLabel + chart + cards + "</div>";
  };

  window.paSetRange = function (r) { cur.range = r; refresh(); };
  window.paSetMode = function (m) {
    cur.mode = m;
    document.querySelectorAll(".pa-mode-btn").forEach(function (b) { b.classList.toggle("active", b.textContent.indexOf(m === "indexed" ? "Indexed" : "Price") >= 0); });
    refresh();
  };
  window.paSetBench = function (bk) {
    cur.bench = bk;
    document.querySelectorAll(".pa-bench-btn").forEach(function (b) { b.classList.toggle("active", b.textContent.indexOf(bk === "spx" ? "S&P" : "Nasdaq") >= 0); });
    refresh();
  };
  window.setupPA = function () { refresh(); };

  function eraCards(d) {
    var box = document.getElementById("pa-eras"); if (!box) return;
    var B = BENCH[cur.bench];
    box.innerHTML = d.eras.map(function (e) {
      var pos = e.co_ret != null && e.co_ret >= 0;
      var vs = e[B.retk];
      var rev = (e.rev0 != null && e.rev1 != null)
        ? '<div class="era-rev">Receita <b>$' + e.rev0 + "B → $" + e.rev1 + "B</b> <span class='" + (e.rev_growth >= 0 ? "pos" : "neg") + "'>" + pctSign(e.rev_growth) + "</span></div>"
        : "";
      return '<div class="era-card" style="border-left-color:' + (pos ? "#16a34a" : "#dc2626") + '">' +
        '<div class="era-period">' + e.start.slice(0, 7) + " → " + e.end.slice(0, 7) +
        '<span class="era-ret ' + (pos ? "pos" : "neg") + '">' + pctSign(e.co_ret) + "</span>" +
        '<span class="era-vssp">' + pctSign(vs) + " vs " + B.name + "</span></div>" +
        '<div class="era-title">' + e.title + "</div>" + rev +
        '<div class="era-desc">' + e.desc + "</div></div>";
    }).join("");
  }

  function filterRange(series, range) {
    if (range === "MAX" || !series.length) return series;
    var last = new Date(series[series.length - 1][0]);
    var cut;
    if (range === "YTD") cut = (last.getFullYear()) + "-01-01";
    else { var yrs = { "2Y": 2, "5Y": 5, "10Y": 10 }[range] || 99; cut = new Date(last.getFullYear() - yrs, last.getMonth(), last.getDate()).toISOString().slice(0, 10); }
    return series.filter(function (p) { return p[0] >= cut; });
  }

  function refresh() {
    var d = PA[cur.ticker]; if (!d) return;
    var rc = document.getElementById("pa-ranges");
    if (rc) rc.innerHTML = RANGES.map(function (r) {
      var lab = r === "MAX" ? "MAX" : r;
      return '<button class="val-range-btn' + (r === cur.range ? " active" : "") + '" onclick="paSetRange(\'' + r + '\')">' + lab + "</button>";
    }).join("");
    var vis = filterRange(d.series, cur.range);
    if (vis.length < 2) return;
    var B = BENCH[cur.bench];
    var nvR = Math.round((vis[vis.length - 1][1] / vis[0][1] - 1) * 100);
    var bR = Math.round((vis[vis.length - 1][B.col] / vis[0][B.col] - 1) * 100);
    var rl = document.getElementById("pa-retlabel");
    var yrs = cur.range === "MAX" ? "22-year" : (cur.range === "YTD" ? "YTD" : cur.range + " ");
    if (rl) rl.innerHTML = yrs + " return: <b class='pos'>" + d.ticker + " " + pctSign(nvR) + "</b> &nbsp;·&nbsp; " + B.name + " <b>" + pctSign(bR) + "</b>";
    drawPA(d, vis);
    eraCards(d);
  }

  function drawPA(d, vis) {
    var box = document.getElementById("pa-chart"); if (!box) return;
    var indexed = cur.mode === "indexed";
    var bcol = BENCH[cur.bench].col, bname = BENCH[cur.bench].name;
    var nb = vis[0][1], sb = vis[0][bcol];
    var nv = vis.map(function (p) { return indexed ? p[1] / nb * 100 : p[1]; });
    var sv = vis.map(function (p) { return p[bcol] / sb * 100; });
    var w = 1000, h = 380, pad = { l: 52, r: 16, t: 28, b: 28 };
    var iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    var allv = indexed ? nv.concat(sv) : nv;
    var min = Math.min.apply(null, allv), max = Math.max.apply(null, allv);
    min = Math.min(min, indexed ? 100 : min); var range = (max - min) || 1;
    var X = function (i) { return pad.l + (i / (vis.length - 1)) * iw; };
    var Y = function (v) { return pad.t + ih - (v - min) / range * ih; };
    function idxOfDate(dt) { var lo = 0; for (var i = 0; i < vis.length; i++) { if (vis[i][0] <= dt) lo = i; else break; } return lo; }

    // era bands
    var bands = "";
    (d.eras || []).forEach(function (e) {
      if (e.end < vis[0][0] || e.start > vis[vis.length - 1][0]) return;
      var i0 = idxOfDate(e.start < vis[0][0] ? vis[0][0] : e.start);
      var i1 = idxOfDate(e.end > vis[vis.length - 1][0] ? vis[vis.length - 1][0] : e.end);
      var x0 = X(i0), x1 = X(i1); if (x1 - x0 < 4) return;
      var pos = e.co_ret >= 0;
      bands += '<rect x="' + x0.toFixed(1) + '" y="' + pad.t + '" width="' + (x1 - x0).toFixed(1) + '" height="' + ih + '" fill="' + (pos ? "#16a34a" : "#dc2626") + '" opacity="0.06"/>';
      if (x1 - x0 > 40) {
        var cx = (x0 + x1) / 2;
        bands += '<rect x="' + (cx - 26).toFixed(1) + '" y="' + (pad.t + 4) + '" width="52" height="16" rx="3" fill="#fff" stroke="' + (pos ? "#16a34a" : "#dc2626") + '"/>' +
          '<text x="' + cx.toFixed(1) + '" y="' + (pad.t + 15) + '" text-anchor="middle" font-size="10" font-weight="700" fill="' + (pos ? "#15803d" : "#dc2626") + '">' + (e.co_ret >= 0 ? "+" : "") + e.co_ret + "%</text>" +
          '<text x="' + cx.toFixed(1) + '" y="' + (pad.t + 30) + '" text-anchor="middle" font-size="8.5" fill="#94a3b8">' + (e.vs_sp >= 0 ? "+" : "") + e.vs_sp + "% vs S&amp;P</text>";
      }
    });
    // grid + y labels
    var grid = "";
    for (var k = 0; k <= 4; k++) {
      var gv = min + range * k / 4, gy = Y(gv);
      grid += '<line x1="' + pad.l + '" x2="' + (w - pad.r) + '" y1="' + gy.toFixed(1) + '" y2="' + gy.toFixed(1) + '" stroke="#f1f3f5"/>' +
        '<text x="' + (pad.l - 6) + '" y="' + (gy + 3).toFixed(1) + '" text-anchor="end" font-size="9" fill="#94a3b8">' + (indexed ? (gv >= 1000 ? (gv / 1000).toFixed(0) + "k" : Math.round(gv)) : "$" + Math.round(gv)) + "</text>";
    }
    var nvPts = vis.map(function (p, i) { return X(i).toFixed(1) + "," + Y(nv[i]).toFixed(1); }).join(" ");
    var spLine = indexed ? '<polyline fill="none" stroke="#9ca3af" stroke-width="1.2" stroke-dasharray="5 4" points="' +
      vis.map(function (p, i) { return X(i).toFixed(1) + "," + Y(sv[i]).toFixed(1); }).join(" ") + '"/>' : "";
    var nvLine = '<polyline fill="none" stroke="#1b3454" stroke-width="1.5" points="' + nvPts + '"/>';
    // x labels
    var xl = "";
    [0, Math.floor(vis.length / 3), Math.floor(2 * vis.length / 3), vis.length - 1].forEach(function (i) {
      xl += '<text x="' + X(i).toFixed(1) + '" y="' + (h - 8) + '" text-anchor="middle" font-size="9" fill="#94a3b8">' + String(vis[i][0]).slice(0, 7) + "</text>";
    });
    // legend
    var legend = '<text x="' + (pad.l + 4) + '" y="' + (pad.t - 14) + '" font-size="10" fill="#1b3454" font-weight="600">— ' + d.ticker + "</text>" +
      (indexed ? '<text x="' + (pad.l + 60) + '" y="' + (pad.t - 14) + '" font-size="10" fill="#9ca3af">-- ' + bname + "</text>" : "");
    var li = vis.length - 1;
    var endMark = '<circle cx="' + X(li).toFixed(1) + '" cy="' + Y(nv[li]).toFixed(1) + '" r="4" fill="#16a34a" stroke="#fff" stroke-width="1.5"/>';
    var guide = '<line class="phg" x1="0" x2="0" y1="' + pad.t + '" y2="' + (pad.t + ih) + '" stroke="#94a3b8" stroke-dasharray="3 3" visibility="hidden"/>' +
      '<circle class="phd" r="4" fill="#1b3454" stroke="#fff" stroke-width="1.5" visibility="hidden"/>';

    box.innerHTML = '<svg id="pa-svg" viewBox="0 0 ' + w + " " + h + '" width="100%" style="cursor:crosshair">' +
      bands + grid + spLine + nvLine + xl + legend + endMark + guide + "</svg>";
    wireHover(document.getElementById("pa-svg"), vis, nv, sv, indexed, w, pad, iw, X, Y, d.ticker, bname);
  }

  function wireHover(svg, vis, nv, sv, indexed, w, pad, iw, X, Y, tk, bname) {
    if (!svg) return;
    var guide = svg.querySelector(".phg"), dot = svg.querySelector(".phd"), box = svg.parentNode;
    var tip = box.querySelector(".chart-tip"); if (!tip) { tip = document.createElement("div"); tip.className = "chart-tip"; box.appendChild(tip); }
    var n = vis.length;
    svg.addEventListener("mousemove", function (e) {
      var r = svg.getBoundingClientRect();
      var i = Math.round(((e.clientX - r.left) / r.width * w - pad.l) / iw * (n - 1));
      i = Math.max(0, Math.min(n - 1, i));
      var gx = X(i), gy = Y(nv[i]);
      guide.setAttribute("x1", gx); guide.setAttribute("x2", gx); guide.setAttribute("visibility", "visible");
      dot.setAttribute("cx", gx); dot.setAttribute("cy", gy); dot.setAttribute("visibility", "visible");
      var v = indexed ? "<b>" + tk + " " + Math.round(nv[i]) + "</b><span>" + bname + " " + Math.round(sv[i]) + " · " + fmtDate(vis[i][0]) + "</span>"
        : "<b>$" + vis[i][1].toFixed(2) + "</b><span>" + fmtDate(vis[i][0]) + "</span>";
      tip.innerHTML = v; tip.style.display = "block";
      var pr = box.getBoundingClientRect();
      var left = e.clientX - pr.left + 14; if (left > pr.width - 120) left = e.clientX - pr.left - 120;
      tip.style.left = left + "px"; tip.style.top = Math.max(4, e.clientY - pr.top - 6) + "px";
    });
    svg.addEventListener("mouseleave", function () { guide.setAttribute("visibility", "hidden"); dot.setAttribute("visibility", "hidden"); tip.style.display = "none"; });
  }
})();
