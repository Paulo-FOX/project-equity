/* Project Equity — aba Industries: comparativos setoriais com charts interativos (SVG, offline). */
(function () {
  "use strict";
  var IND = window.EQ_IND || {};

  // ---------- chart helpers (SVG nativo + hover via data-eqtip) ----------
  function legend(series) {
    return '<div class="nd-legend">' + series.map(function (s) {
      return '<span class="nd-leg"><span class="nd-sw" style="background:' + s.color + '"></span>' + s.name + "</span>";
    }).join("") + "</div>";
  }
  function yAxis(mn, mx, pad, iw, ih, fmt) {
    var g = "";
    for (var i = 0; i <= 4; i++) {
      var v = mn + (mx - mn) * i / 4, y = (pad.t + ih - (v - mn) / (mx - mn) * ih);
      g += '<line x1="' + pad.l + '" x2="' + (pad.l + iw) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="#f1f5f9"/>' +
        '<text x="' + (pad.l - 6) + '" y="' + (y + 3).toFixed(1) + '" text-anchor="end" font-size="9" fill="#94a3b8">' + fmt(v) + "</text>";
    }
    return g;
  }
  function xLabels(labels, X, h) {
    var n = labels.length, k = Math.max(1, Math.ceil(n / 9)), s = "";
    for (var i = 0; i < n; i += k) s += '<text x="' + X(i).toFixed(1) + '" y="' + (h - 12) + '" text-anchor="middle" font-size="9" fill="#94a3b8">' + labels[i] + "</text>";
    return s;
  }
  function range(series, zero) {
    var all = [];
    series.forEach(function (s) { s.values.forEach(function (v) { if (v != null) all.push(v); }); });
    var mn = Math.min.apply(null, all), mx = Math.max.apply(null, all);
    if (zero) mn = Math.min(0, mn);
    var p = (mx - mn) * 0.08 || 1;
    return [mn - (mn < 0 ? p : (zero ? 0 : p)), mx + p];
  }

  function multiLine(labels, series, opts) {
    opts = opts || {};
    var g = opts.guidance, labs = labels, series0 = series;
    if (g) {
      labs = labels.concat([g.label]);
      series = series.map(function (s) { var v = s.values.slice(); v.push(s.name === g.series ? g.yoy_mid : null); return { name: s.name, color: s.color, values: v }; });
    }
    var w = 900, h = opts.h || 300, pad = { l: 50, r: 56, t: 14, b: 42 }, iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    var lg = opts.log, n = labs.length, mn, mx;
    if (lg) {
      var av = []; series.forEach(function (s) { s.values.forEach(function (v) { if (v != null && v > 0) av.push(v); }); });
      mn = Math.pow(10, Math.floor(Math.log10(Math.min.apply(null, av)))); mx = Math.max.apply(null, av) * 1.12;
    } else {
      var r = range(series, opts.zero); mn = r[0]; mx = r[1];
      if (g) { mn = Math.min(mn, g.yoy_lo); mx = Math.max(mx, g.yoy_hi); }
    }
    var L = Math.log10;
    var X = function (i) { return pad.l + (n < 2 ? iw / 2 : i / (n - 1) * iw); };
    var Y = lg ? function (v) { return pad.t + ih - (L(v) - L(mn)) / (L(mx) - L(mn)) * ih; }
               : function (v) { return pad.t + ih - (v - mn) / (mx - mn) * ih; };
    var gwhisk = "";
    if (g) {
      var gx = X(labs.length - 1);
      gwhisk = '<line x1="' + gx.toFixed(1) + '" x2="' + gx.toFixed(1) + '" y1="' + Y(g.yoy_lo).toFixed(1) + '" y2="' + Y(g.yoy_hi).toFixed(1) + '" stroke="#16a34a" stroke-width="1.5" stroke-dasharray="2 2" data-eqtip="META guidance ' + g.label + ': +' + g.yoy_lo + "–" + g.yoy_hi + '% a/a"/>';
    }
    var fmt = opts.pct ? function (v) { return v.toFixed(0) + "%"; } : (opts.dollar ? function (v) { return "$" + v.toFixed(0); } : function (v) { return v.toFixed(0); });
    var zl = (mn < 0 && mx > 0) ? '<line x1="' + pad.l + '" x2="' + (pad.l + iw) + '" y1="' + Y(0).toFixed(1) + '" y2="' + Y(0).toFixed(1) + '" stroke="#cbd5e1" stroke-dasharray="3 3"/>' : "";
    var lines = series.map(function (s) {
      var pts = [], dots = "";
      s.values.forEach(function (v, i) {
        if (v == null) return;
        pts.push(X(i).toFixed(1) + "," + Y(v).toFixed(1));
        dots += '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(v).toFixed(1) + '" r="3" fill="' + s.color + '" data-eqtip="' + s.name + " · " + labs[i] + ": " + v + (opts.pct ? "%" : (opts.dollar ? " B" : "")) + '"/>';
      });
      var li = s.values.length - 1; while (li >= 0 && s.values[li] == null) li--;
      var lbl = li >= 0 ? '<text x="' + (X(li) + 5).toFixed(1) + '" y="' + (Y(s.values[li]) + 3).toFixed(1) + '" font-size="10" font-weight="700" fill="' + s.color + '">' + s.values[li] + (opts.pct ? "%" : "") + "</text>" : "";
      return '<polyline fill="none" stroke="' + s.color + '" stroke-width="2.2" points="' + pts.join(" ") + '"/>' + dots + lbl;
    }).join("");
    var yax = lg ? logYAxis(mn, mx, pad, iw, Y, fmt) : yAxis(mn, mx, pad, iw, ih, fmt);
    return '<svg viewBox="0 0 ' + w + " " + h + '" width="100%">' + yax + zl + lines + gwhisk + xLabels(labs, X, h) + "</svg>" + legend(series0);
  }
  function logYAxis(mn, mx, pad, iw, Y, fmt) {
    var t = [];
    for (var e = Math.floor(Math.log10(mn)); e <= Math.ceil(Math.log10(mx)); e++)
      [1, 2, 3, 5].forEach(function (m) { var v = m * Math.pow(10, e); if (v >= mn && v <= mx) t.push(v); });
    return t.map(function (v) {
      var y = Y(v);
      return '<line x1="' + pad.l + '" x2="' + (pad.l + iw) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="#f1f5f9"/>' +
        '<text x="' + (pad.l - 6) + '" y="' + (y + 3).toFixed(1) + '" text-anchor="end" font-size="9" fill="#94a3b8">' + fmt(v) + "</text>";
    }).join("");
  }

  function groupedBars(labels, series, opts) {
    opts = opts || {};
    var g = opts.guidance, labs = labels, ser = series, gi = -1;
    if (g) {
      labs = labels.concat([g.label]); gi = labs.length - 1;
      ser = series.map(function (s) { var v = s.values.slice(); v.push(s.name === g.series ? g.mid : null); return { name: s.name, color: s.color, values: v }; });
    }
    var w = 900, h = opts.h || 300, pad = { l: 46, r: 16, t: 14, b: 46 }, iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    var mx = range(ser, true)[1]; if (g) mx = Math.max(mx, g.hi);
    var mn = 0, n = labs.length, m = ser.length;
    var gw = iw / n, bw = gw * 0.78 / m;
    var Y = function (v) { return pad.t + ih - (v - mn) / (mx - mn) * ih; };
    var bars = "";
    for (var i = 0; i < n; i++) for (var j = 0; j < m; j++) {
      var v = ser[j].values[i]; if (v == null) continue;
      var x = pad.l + i * gw + gw * 0.11 + j * bw, y = Y(v);
      bars += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (Y(0) - y).toFixed(1) + '"' + (i === gi ? ' opacity="0.5"' : "") + ' fill="' + ser[j].color + '" data-eqtip="' + ser[j].name + " · " + labs[i] + ": $" + v + 'B"/>';
    }
    if (g) {
      var mj = 0; for (var k = 0; k < ser.length; k++) if (ser[k].name === g.series) mj = k;
      var cx = pad.l + gi * gw + gw * 0.11 + mj * bw + bw / 2;
      bars += '<line x1="' + cx.toFixed(1) + '" x2="' + cx.toFixed(1) + '" y1="' + Y(g.lo).toFixed(1) + '" y2="' + Y(g.hi).toFixed(1) + '" stroke="#1b3454" stroke-width="1.5"/>' +
        '<line x1="' + (cx - 4).toFixed(1) + '" x2="' + (cx + 4).toFixed(1) + '" y1="' + Y(g.hi).toFixed(1) + '" y2="' + Y(g.hi).toFixed(1) + '" stroke="#1b3454" stroke-width="1.5"/>' +
        '<line x1="' + (cx - 4).toFixed(1) + '" x2="' + (cx + 4).toFixed(1) + '" y1="' + Y(g.lo).toFixed(1) + '" y2="' + Y(g.lo).toFixed(1) + '" stroke="#1b3454" stroke-width="1.5" data-eqtip="META guidance ' + g.label + ': $' + g.lo + "–" + g.hi + 'B"/>';
    }
    var X = function (i) { return pad.l + i * gw + gw / 2; };
    return '<svg viewBox="0 0 ' + w + " " + h + '" width="100%">' + yAxis(mn, mx, pad, iw, ih, function (v) { return "$" + v.toFixed(0); }) + bars + xLabels(labs, X, h) + "</svg>" + legend(series);
  }

  // ---------- blocos ----------
  function bullets(title, arr, sub) {
    var lbl = title ? '<div class="ind-sec-label">' + title + (sub ? ' <span>' + sub + "</span>" : "") + "</div>" : "";
    return lbl + '<ul class="ind-bullets">' + arr.map(function (b) { return "<li>" + b + "</li>"; }).join("") + "</ul>";
  }
  function cardHtml(c) {
    var ytd = c.ytd == null ? '<span class="muted">—</span>' : '<span class="' + (c.ytd >= 0 ? "pos" : "neg") + '">' + (c.ytd > 0 ? "+" : "") + c.ytd + "%</span>";
    return '<div class="ind-card' + (c.private ? " ind-card-priv" : "") + '"><div class="ind-card-h">' + c.name + ' <span class="ind-card-tk">' + c.ticker + (c.private ? " · Privada" : "") + "</span></div>" +
      (c.sub ? '<div class="ind-card-sub">' + c.sub + "</div>" : "") +
      '<div class="ind-card-row"><span>Mkt Cap</span><b>' + c.mktcap + "</b></div>" +
      '<div class="ind-card-row"><span>EV</span><b>' + c.ev + "</b></div>" +
      '<div class="ind-card-row"><span>' + (c.rev_label || "FY26E Rev") + "</span><b>" + (c.rev || "—") + "</b></div>" +
      '<div class="ind-card-row"><span>YTD</span><b>' + ytd + "</b></div></div>";
  }
  function chartPair(left, right) {
    return '<div class="ind-2col"><div class="chart-box">' + left + "</div><div class=\"chart-box\">" + right + "</div></div>";
  }
  function indToggle() {
    var m = window._indMode || "quarterly";
    return '<div class="ind-toggle">' +
      '<button class="' + (m === "quarterly" ? "active" : "") + '" onclick="indSetMode(\'quarterly\')">Quarterly</button>' +
      '<button class="' + (m === "annual" ? "active" : "") + '" onclick="indSetMode(\'annual\')">Annual</button></div>';
  }
  window.indSetMode = function (m) {
    window._indMode = m;
    if (window.selectIndustry && window._indKey) window.selectIndustry(window._indKey);
  };

  window.renderIndustry = function (key) {
    var d = IND[key];
    if (!d) return '<div class="ind-wrap"><div class="ind-empty">Relatório em breve.</div></div>';
    var h = "";
    // cabecalho que SO aparece na impressao (PDF) — branding FOX
    h += '<div class="ind-print-header"><img src="assets/fox-logo.svg" alt="FOX" class="ind-print-logo">' +
      '<div class="ind-print-meta"><b>' + d.title + " — " + d.kind + "</b><span>" + d.subtitle +
      " · Fox Investimentos · gerado " + (d.as_of || "") + "</span></div></div>";
    h += '<div class="ind-head"><div><h2>' + d.title + " — " + d.kind + "</h2><div class=\"ind-sub\">" + d.subtitle + "</div></div>" +
      '<button class="ind-pdf-btn" onclick="window.print()" title="Salvar/imprimir este relatório em PDF">⎙ Salvar PDF</button></div>';
    h += '<div class="ind-cards" style="grid-template-columns:repeat(' + Math.min(d.cards.length, 5) + ',1fr)">' + d.cards.map(cardHtml).join("") + "</div>";
    if (d.ad_revenue) h += indToggle();
    h += bullets("The state of play", d.state_of_play);
    if (d.ad_revenue) {
      var ann = (window._indMode === "annual") && d.ad_revenue_annual;
      var rev = ann ? d.ad_revenue_annual : d.ad_revenue;
      var yo = ann ? d.ad_yoy_annual : d.ad_yoy;
      var labs = ann ? rev.years : rev.quarters;
      var gd = ann ? null : d.guidance;
      var sub = ann ? (d.revenue_sub_annual || "$B/ano") : (d.revenue_sub || "$B/trimestre · guidance como faixa");
      var stack = d.revenue_stack !== false;  // PADRAO: empilhado full-width (tamanho uniforme em todas as industrias)
      var barsC = groupedBars(labs, rev.series, { guidance: gd, h: stack ? 340 : 300 });
      var yoyC = multiLine(labs, yo.series, { pct: true, zero: true, guidance: gd, h: stack ? 340 : 300 });
      h += '<div class="ind-sec-label">' + (d.revenue_title || "Ad Revenue") + " <span>(" + sub + ") — passe o mouse</span></div>" +
        (stack
          ? '<div class="chart-box">' + barsC + '</div><div class="chart-box" style="margin-top:14px">' + yoyC + "</div>"
          : chartPair(barsC, yoyC));
    }
    if (d.operating_trends) h += bullets("Operating trends", d.operating_trends);
    if (d.op_margin) {
      h += '<div class="ind-sec-label">' + (d.op_margin_title || "Operating Margin") + " <span>" + (d.op_margin_sub || "(%) — proxy consolidado") + "</span></div>" +
        '<div class="chart-box">' + multiLine(d.op_margin.quarters, d.op_margin.series, { pct: true, zero: true }) + "</div>";
    }
    if (d.margin_notes) h += bullets(d.margin_notes_title || "Margens", d.margin_notes);
    // blocos extras especificos do setor (engagement, backlog/RPO, capex, etc.)
    (d.extra || []).forEach(function (blk) {
      h += '<div class="ind-sec-label">' + blk.title + (blk.sub ? " <span>" + blk.sub + "</span>" : "") + "</div>";
      if (blk.kind === "matrix" && blk.rows) {
        var hd = "<tr><th>" + (blk.row_label || "Empresa") + "</th>" + blk.dims.map(function (x) { return "<th>" + x + "</th>"; }).join("") + "</tr>";
        var rws = blk.rows.map(function (r) {
          return "<tr" + (r.highlight ? ' class="cm-self"' : "") + "><td><b>" + r.name + "</b></td>" + r.cells.map(function (x) { return "<td>" + x + "</td>"; }).join("") + "</tr>";
        }).join("");
        h += '<div class="table-wrap"><table class="cm-tbl"><thead>' + hd + "</thead><tbody>" + rws + "</tbody></table></div>";
      } else if (blk.series && blk.labels) {
        var ch = blk.kind === "bars" ? groupedBars(blk.labels, blk.series, blk.opts || {}) : multiLine(blk.labels, blk.series, blk.opts || {});
        h += '<div class="chart-box">' + ch + "</div>";
      }
      if (blk.notes && blk.notes.length) h += bullets(blk.notes_title || "", blk.notes);
      if (blk.note) h += '<div class="hyp-note">' + blk.note + "</div>";
    });
    h += '<div class="ic-sources"><div class="ic-sources-t">Data sources</div>' + d.sources + "</div>";
    return '<div class="ind-wrap">' + h + "</div>";
  };
})();
