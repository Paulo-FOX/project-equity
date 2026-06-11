/* Project Equity — renderer do Investment Case (deep-dive de 10 tópicos + nav lateral). */
(function () {
  "use strict";
  var IC = window.EQ_IC || {};

  function fBig(v) {
    if (v == null) return "—";
    if (v >= 1e12) return "$" + (v / 1e12).toFixed(2) + "T";
    if (v >= 1e9) return "$" + (v / 1e9).toFixed(0) + "B";
    return "$" + (v / 1e6).toFixed(0) + "M";
  }
  function px(v) { return v == null ? "—" : "$" + v.toFixed(2); }
  function yearPlus1(label) {
    var m = String(label).match(/([A-Za-z]+)\s+(\d{4})/);
    return m ? m[1] + " " + (parseInt(m[2], 10) + 1) : label;
  }

  window.renderIC = function (ticker) {
    var d = IC[ticker];
    if (!d) return null;
    var h = d.header || {};
    // preco/mkt cap LIVE do Home (EOD diario); EV recalculado = mkt cap live + net debt do build
    var _lv = window.liveMkt && window.liveMkt(ticker);
    var hpx = _lv ? _lv.price : h.price;
    var hmc = _lv ? _lv.mktcap : h.mktcap;
    var hev = (_lv && h.ev != null && h.mktcap) ? (_lv.mktcap + (h.ev - h.mktcap)) : h.ev;

    // nav
    var nav = '<aside class="ic-nav"><div class="ic-nav-label">NAVIGATION</div>' +
      '<button class="ic-nav-item active" data-t="exec" onclick="icGo(\'exec\')">Executive Summary</button>' +
      d.sections.map(function (s) {
        return '<button class="ic-nav-item" data-t="' + s.id + '" onclick="icGo(\'' + s.id + '\')">' + s.num + ". " + s.title + "</button>";
      }).join("") + "</aside>";

    // banner
    var banner = '<div class="ic-banner"><h2>' + d.name + " (" + ticker + ") | " + d.as_of + "</h2>" +
      (d.one_liner_html ? '<div class="ic-thesis"><b>Thesis:</b> ' + stripP(d.one_liner_html) + "</div>" : "") + "</div>";

    // exec summary
    var statbox = '<div class="ic-statbox"><b>' + d.name + " (" + ticker + ")</b> · " + d.as_of +
      "  |  Price <b>" + px(hpx) + "</b>  |  Mkt Cap <b>" + fBig(hmc) + "</b>  |  EV <b>" + fBig(hev) + "</b></div>";
    var execTag = d.exec_is_synth ? '<span class="ic-synth-tag">SÍNTESE FUNDAMENTADA</span>' : "";
    var mgmt = d.management_html ? '<div class="ic-mgmt"><b>Management:</b> ' + stripP(d.management_html) + "</div>" : "";

    var scen = "";
    if (d.scenarios && d.scenarios.length) {
      scen = '<div class="ic-sub">Scenarios (' + yearPlus1(d.as_of) + ') <span class="ic-synth-tag">síntese</span></div>' +
        '<div class="table-wrap"><table class="scen-tbl"><thead><tr><th>Scenario</th><th>O que precisa acontecer</th></tr></thead><tbody>' +
        d.scenarios.map(function (x) {
          return '<tr><td class="scen scen-' + x.name.toLowerCase() + '">' + x.name + "</td><td>" + x.what + "</td></tr>";
        }).join("") + "</tbody></table></div>";
    }

    var execSec = '<div id="ic-sec-exec" class="ic-sec"><div class="ic-sec-bar">Executive Summary</div>' +
      statbox + execTag + d.exec_summary_html + mgmt + scen + "</div>";

    // 10 sections (componentes visuais + html da wiki)
    var secs = d.sections.map(function (s) {
      var comps = (s.components || []).map(renderComp).join("");
      return '<div id="ic-sec-' + s.id + '" class="ic-sec"><div class="ic-sec-bar">' + s.num + ". " + s.title + "</div>" + comps + s.html + "</div>";
    }).join("");

    return '<div class="ic-wrap">' + nav + '<div class="ic-content">' + banner + execSec + secs + icSources(d) + "</div></div>";
  };

  // rodape consolidado de fontes (estilo da referencia) — agrega as fontes de TAM/share + oficiais
  function icSources(d) {
    var firms = {};
    (d.sections || []).forEach(function (s) {
      (s.components || []).forEach(function (c) {
        if ((c.type === "tam" || c.type === "sharetrend") && c.source) {
          var m = c.source.match(/\(([^)]+)\)/);
          if (m) m[1].split(/[\/,+]/).forEach(function (f) {
            f = f.trim();
            if (f && !/an[aá]lise|estimativa|pr[oó]pria|analistas/i.test(f)) firms[f] = 1;
          });
        }
      });
    });
    var hasShare = (d.sections || []).some(function (s) {
      return (s.components || []).some(function (c) { return c.type === "shareholders"; });
    });
    var parts = [
      "<b>SEC EDGAR</b> — 10-K / 10-Q / 8-K (financials oficiais)",
      "<b>Bloomberg</b> — preço, EV, consenso BEst",
    ];
    var fl = Object.keys(firms);
    if (fl.length) parts.push("<b>" + fl.join(", ") + "</b> — sizing de TAM e market-share");
    parts.push("earnings calls / press releases (catalysts, guidance)");
    if (hasShare) parts.push("SEC 13F + proxy statement (acionistas)");
    return '<div class="ic-sources"><div class="ic-sources-t">Sources</div>' +
      parts.join(" · ") +
      '.<div class="ic-src-note">⚠️ TAM e market-share são <b>estimativas direcionais</b> (sizing de indústria + análise própria), não números oficiais. Os financials (receita, margem, EPS, FCF) são 100% oficiais do SEC EDGAR.</div></div>';
  }

  window.icGo = function (id) {
    var elc = document.getElementById("ic-sec-" + id);
    if (elc) elc.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
  };

  function setActive(id) {
    document.querySelectorAll(".ic-nav-item").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-t") === id);
    });
  }

  // scroll-spy: destaca a seção visível
  window.setupIC = function () {
    var secs = Array.prototype.slice.call(document.querySelectorAll(".ic-sec"));
    if (!secs.length) return;
    function onScroll() {
      var y = window.scrollY + 130, cur = secs[0].id;
      secs.forEach(function (s) { if (s.offsetTop <= y) cur = s.id; });
      setActive(cur.replace("ic-sec-", ""));
    }
    window.removeEventListener("scroll", window._icSpy || function () {});
    window._icSpy = onScroll;
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  };

  function stripP(html) { return html.replace(/^<p>/, "").replace(/<\/p>\s*$/, ""); }

  /* ---------- componentes visuais ---------- */
  function renderComp(c) {
    if (c.type === "timeline") return timelineComp(c);
    if (c.type === "donut") return donutComp(c);
    if (c.type === "segtable") return segTableComp(c);
    if (c.type === "segtrend") return segTrendComp(c);
    if (c.type === "ic_bars") return icBarsComp(c);
    if (c.type === "roic_roe") return roicRoeComp(c);
    if (c.type === "ic_history") return icHistoryComp(c);
    if (c.type === "valuation") return valuationComp(c);
    if (c.type === "tam") return tamComp(c);
    if (c.type === "sharetrend") return shareTrendComp(c);
    if (c.type === "shareholders") return shareholdersComp(c);
    if (c.type === "peers") return peersComp(c);
    if (c.type === "cashwf") return cashwfComp(c);
    if (c.type === "segecon") return segEconComp(c);
    if (c.type === "compmatrix") return compMatrixComp(c);
    return "";
  }

  // waterfall de fontes & usos de caixa (SVG) — OCF -> capex -> FCF -> dividendos -> recompras
  function cashwfComp(c) {
    var st = c.steps, w = 680, h = 300, pad = { l: 16, r: 16, t: 22, b: 64 }, iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    var maxv = Math.max.apply(null, st.map(function (s) { return Math.max(Math.abs(s.lo), Math.abs(s.hi)); })) || 1;
    var n = st.length, bw = iw / n * 0.62;
    var Y = function (v) { return pad.t + ih - (v / maxv) * ih; };
    var bars = st.map(function (s, i) {
      var x = pad.l + (i + 0.5) / n * iw - bw / 2, y0 = Y(s.lo), y1 = Y(s.hi);
      var col = s.kind === "total" ? "#1b3454" : (s.value >= 0 ? "#16a34a" : "#dc2626");
      var lbl = (s.value >= 0 ? "+" : "−") + "$" + Math.abs(s.value).toFixed(1) + "B";
      var disp = s.kind === "total" ? "$" + s.hi.toFixed(1) + "B" : lbl;
      return '<rect x="' + x.toFixed(1) + '" y="' + Math.min(y0, y1).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(1, Math.abs(y1 - y0)).toFixed(1) + '" rx="2" fill="' + col + '" data-eqtip="' + s.label + ": " + disp + '"/>' +
        '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (Math.min(y0, y1) - 4).toFixed(1) + '" text-anchor="middle" font-size="9.5" fill="#475569">' + disp + "</text>" +
        '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (h - 42) + '" text-anchor="middle" font-size="9" fill="#64748b">' + s.label + "</text>";
    }).join("");
    return '<div class="ic-card"><div class="ic-comp-title">' + c.title + estTag(c) + "</div>" +
      '<svg viewBox="0 0 ' + w + " " + h + '" width="100%">' +
      '<line x1="' + pad.l + '" x2="' + (w - pad.r) + '" y1="' + Y(0).toFixed(1) + '" y2="' + Y(0).toFixed(1) + '" stroke="#e5e7eb"/>' + bars + "</svg>" +
      (c.source ? '<div class="ic-fin-note">Fonte: ' + c.source + "</div>" : "") + "</div>";
  }

  // economia por segmento: receita + margem EBIT + % de contribuicao ao lucro
  function segEconComp(c) {
    var rows = c.rows.map(function (r) {
      return "<tr><td><span class='se-dot' style='background:" + (r.color || "#94a3b8") + "'></span>" + r.label + "</td>" +
        "<td class='num'>$" + r.rev.toFixed(1) + "B</td><td class='num'>" + (r.ebit_margin != null ? r.ebit_margin + "%" : "—") + "</td>" +
        "<td class='num'><b>" + (r.contrib != null ? r.contrib + "%" : "—") + "</b><div class='se-bar'><div style='width:" + Math.max(0, Math.min(100, r.contrib || 0)) + "%;background:" + (r.color || "#1b3454") + "'></div></div></td></tr>";
    }).join("");
    return '<div class="ic-card"><div class="ic-comp-title">' + c.title + estTag(c) + "</div>" +
      '<div class="table-wrap"><table class="se-tbl"><thead><tr><th>Segmento</th><th class="num">Receita</th><th class="num">M. EBIT</th><th class="num">% do EBIT</th></tr></thead><tbody>' + rows + "</tbody></table></div>" +
      (c.source ? '<div class="ic-fin-note">Fonte: ' + c.source + "</div>" : "") + "</div>";
  }

  // matriz competitiva: concorrentes/canais (linhas) x dimensoes (colunas)
  function compMatrixComp(c) {
    var hd = "<tr><th>" + (c.row_label || "Player") + "</th>" + c.dims.map(function (d) { return "<th>" + d + "</th>"; }).join("") + "</tr>";
    var rows = c.rows.map(function (r) {
      return "<tr" + (r.highlight ? ' class="cm-self"' : "") + "><td><b>" + r.name + "</b></td>" +
        r.cells.map(function (x) { return "<td>" + x + "</td>"; }).join("") + "</tr>";
    }).join("");
    return '<div class="ic-card"><div class="ic-comp-title">' + c.title + "</div>" +
      '<div class="table-wrap"><table class="cm-tbl"><thead>' + hd + "</thead><tbody>" + rows + "</tbody></table></div>" +
      (c.source ? '<div class="ic-fin-note">Fonte: ' + c.source + "</div>" : "") + "</div>";
  }
  function estTag(c) { return c.estimate ? '<span class="ic-synth-tag">ESTIMATIVA</span>' : ""; }

  // comparação com pares — tabela (empresa destacada), montada dos financials oficiais das 40 cias
  function peersComp(c) {
    var hdr = "<tr><th>Empresa</th>" + c.metrics.map(function (m) { return '<th class="num">' + m + "</th>"; }).join("") + "</tr>";
    var rows = c.rows.map(function (r) {
      return "<tr" + (r.is_self ? ' class="peer-self"' : "") + "><td>" + r.name + ' <span class="peer-tk">' + r.ticker + "</span></td>" +
        r.vals.map(function (v) { return '<td class="num">' + (v == null ? "—" : v) + "</td>"; }).join("") + "</tr>";
    }).join("");
    return '<div class="ic-card"><div class="ic-comp-title">' + c.title + "</div>" +
      '<div class="table-wrap"><table class="peer-tbl"><thead>' + hdr + "</thead><tbody>" + rows + "</tbody></table></div>" +
      (c.source ? '<div class="ic-fin-note">Fonte: ' + c.source + "</div>" : "") + "</div>";
  }

  function tamComp(c) {
    var years = c.years, tam = c.tam;
    var maxT = Math.max.apply(null, tam) * 1.12 || 1;
    var w = 540, h = 230, pad = { l: 42, r: 42, t: 16, b: 24 }, iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    var bw = iw / years.length;
    var bars = years.map(function (yr, i) {
      var bh = tam[i] / maxT * ih, x = pad.l + i * bw + bw * 0.2, y = pad.t + ih - bh;
      return '<rect class="sb-seg" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (bw * 0.6).toFixed(1) +
        '" height="' + bh.toFixed(1) + '" fill="#16a34a" data-eqtip="FY' + String(yr).slice(2) + ' TAM: $' + tam[i] + 'B"/>' +
        '<text x="' + (x + bw * 0.3).toFixed(1) + '" y="' + (h - 8) + '" text-anchor="middle" font-size="8.5" fill="#94a3b8">' + ("'" + String(yr).slice(2)) + "</text>";
    }).join("");
    var yoy = []; for (var i = 1; i < years.length; i++) yoy.push(tam[i - 1] > 0 ? (tam[i] / tam[i - 1] - 1) * 100 : 0);
    var maxY = Math.max.apply(null, yoy) || 1;
    var X = function (i) { return pad.l + i * bw + bw * 0.5; }, Yr = function (v) { return pad.t + ih - (v / maxY) * ih; };
    var pts = yoy.map(function (v, i) { return X(i + 1).toFixed(1) + "," + Yr(v).toFixed(1); }).join(" ");
    var dots = yoy.map(function (v, i) {
      return '<circle class="ml-dot" cx="' + X(i + 1).toFixed(1) + '" cy="' + Yr(v).toFixed(1) + '" r="3" fill="#dc2626" data-eqtip="FY' + String(years[i + 1]).slice(2) + " YoY: +" + Math.round(v) + '%"/>';
    }).join("");
    var line = '<polyline fill="none" stroke="#dc2626" stroke-width="1.6" points="' + pts + '"/>' + dots;
    var yl = '<text x="4" y="' + (pad.t + 8) + '" font-size="9" fill="#94a3b8">$' + Math.round(maxT) + "B</text>";
    var legend = '<div class="ml-legend"><span class="ml-leg"><span class="ml-sw" style="background:#16a34a"></span>TAM ($B)</span><span class="ml-leg"><span class="ml-sw" style="background:#dc2626"></span>YoY %</span></div>';
    return '<div class="ic-card"><div class="ic-card-title">' + (c.title || "") + estTag(c) + "</div><svg viewBox=\"0 0 " + w + " " + h + '" width="100%">' + bars + line + yl + "</svg>" + legend + srcNote(c) + "</div>";
  }

  function shareTrendComp(c) {
    var data = c.years.map(function (y, i) { return [parseInt(y, 10), c.share[i]]; });
    var svg = multiLineSVG([{ label: "NVDA share %", color: "#16a34a", data: data }],
      { yfmt: function (v) { return Math.round(v) + "%"; } });
    return '<div class="ic-card"><div class="ic-card-title">' + (c.title || "") + estTag(c) + "</div>" + svg + srcNote(c) + "</div>";
  }

  function shareholdersComp(c) {
    var cards = c.holders.map(function (hd) {
      return '<div class="sh-card' + (hd.founder ? " sh-founder" : "") + '"><div class="sh-name">' + hd.name + "</div>" +
        '<div class="sh-pct">' + hd.pct + '%<span class="sh-vote">voto ' + (hd.voting != null ? hd.voting : hd.pct) + "%</span></div>" +
        (hd.note ? '<div class="sh-note">' + hd.note + "</div>" : "") + "</div>";
    }).join("");
    return '<div class="ic-card"><div class="ic-card-title">' + (c.title || "Estrutura de acionistas") + "</div>" +
      '<div class="sh-grid">' + cards + "</div>" +
      (c.others ? '<div class="sh-others">+ Outros (institucionais menores, varejo, ETFs): <b>~' + c.others + "%</b> econômico</div>" : "") +
      srcNote(c) + "</div>";
  }

  function valuationComp(c) {
    var price = c.price != null ? "$" + c.price.toFixed(2) : "—";
    var intro = '<p class="val-intro"><b>' + c.ticker + "</b> a " + price + " (" + c.as_of + ") negocia a:</p>";
    var grid = '<div class="val-grid">' + c.metrics.map(function (m) {
      var tg = m.tag ? '<span class="val-tag val-' + (m.tag === "actual" ? "act" : m.tag === "consenso" ? "con" : "x") + '">' + m.tag + "</span>" : "";
      return '<div class="val-metric"><span class="val-mlabel">' + m.label + tg + '</span><span class="val-mval">' + m.value + "</span></div>";
    }).join("") + "</div>";
    var peersHtml = "";
    if (c.peers && c.peers.length) {
      var allp = c.peers.slice();
      if (c.self_pe) allp.unshift({ ticker: c.ticker, pe: c.self_pe, self: true });
      var maxpe = Math.max.apply(null, allp.map(function (p) { return p.pe; }));
      peersHtml = '<div class="val-sub">Forward P/E vs Big Tech</div><div class="peers-wrap">' +
        allp.map(function (p) {
          return '<div class="peer-row' + (p.self ? " peer-self" : "") + '" data-eqtip="' + p.ticker + ": " + p.pe + 'x fwd P/E"><span class="peer-tk">' + p.ticker +
            '</span><div class="peer-track"><div class="peer-bar" style="width:' + (p.pe / maxpe * 100).toFixed(0) + '%"></div></div><span class="peer-pe">' + p.pe + "x</span></div>";
        }).join("") + "</div>";
    }
    var scenHtml = "";
    if (c.scenarios && c.scenarios.length && c.scenarios[0].rev) {
      scenHtml = '<div class="val-sub">Cenários (12m) <span class="ic-synth-tag">síntese</span></div>' +
        '<div class="table-wrap"><table class="scenv-tbl"><thead><tr><th>Scenario</th><th>Rev FY+1</th><th>EBITDA margin</th><th>EPS FY+1</th></tr></thead><tbody>' +
        c.scenarios.map(function (s) {
          return '<tr><td class="scen scen-' + s.name.toLowerCase() + '">' + s.name + "</td><td>" + (s.rev || "—") +
            "</td><td>" + (s.ebitda_margin || "—") + "</td><td>" + (s.eps || "—") + "</td></tr>";
        }).join("") + "</tbody></table></div>";
    }
    return '<div class="ic-card">' + intro + grid + peersHtml + scenHtml + srcNote(c) + "</div>";
  }

  function icHistoryComp(c) {
    var head = '<tr><th>IC como % da receita</th>' +
      c.years.map(function (y) { return '<th class="num">FY' + String(y).slice(2) + "</th>"; }).join("") +
      '<th class="num ich-d">Δ 10a</th></tr>';
    var body = c.rows.map(function (r) {
      var cells = r.values.map(function (v) {
        var cl = v == null ? "" : (v < 0 ? "neg" : "");
        return '<td class="num ' + cl + '">' + (v == null ? "—" : v + "%") + "</td>";
      }).join("");
      var d = r.delta == null ? "—" : (r.delta > 0 ? "+" : "") + r.delta + "%";
      return '<tr class="' + (r.bold ? "ich-bold" : "") + '"><td>' + r.label + "</td>" + cells +
        '<td class="num ich-d">' + d + "</td></tr>";
    }).join("");
    return '<div class="ic-card"><div class="ic-card-title">' + (c.title || "") + "</div>" +
      '<div class="table-wrap"><table class="ich-tbl"><thead>' + head + "</thead><tbody>" + body + "</tbody></table></div>" + srcNote(c) + "</div>";
  }

  // helper: multi-line chart. lines=[{label,color,dashed,data:[[x,y]]}]
  function multiLineSVG(lines, opts) {
    opts = opts || {};
    var w = 540, h = 220, pad = { l: 44, r: 14, t: 14, b: 26 };
    var iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    var aX = [], aY = [];
    lines.forEach(function (l) { l.data.forEach(function (p) { aX.push(p[0]); aY.push(p[1]); }); });
    if (!aX.length) return "";
    var minX = Math.min.apply(null, aX), maxX = Math.max.apply(null, aX);
    var minY = Math.min.apply(null, aY), maxY = Math.max.apply(null, aY);
    if (opts.y0) { minY = Math.min(minY, 0); maxY = Math.max(maxY, 0); }
    var rX = (maxX - minX) || 1, rY = (maxY - minY) || 1;
    var X = function (x) { return pad.l + (x - minX) / rX * iw; };
    var Y = function (y) { return pad.t + ih - (y - minY) / rY * ih; };
    var yf = opts.yfmt || function (v) { return Math.round(v); };
    var xlab = opts.xlabel || function (x) { return "'" + String(x).slice(2); };
    var polys = lines.map(function (l) {
      var pts = l.data.map(function (p) { return X(p[0]).toFixed(1) + "," + Y(p[1]).toFixed(1); }).join(" ");
      var line = '<polyline fill="none" stroke="' + l.color + '" stroke-width="1.8" ' + (l.dashed ? 'stroke-dasharray="5 4" ' : "") + 'points="' + pts + '"/>';
      var dots = l.data.map(function (p) {
        var tip = l.label + " · " + xlab(p[0]) + ": " + yf(p[1]);
        return '<circle class="ml-dot" cx="' + X(p[0]).toFixed(1) + '" cy="' + Y(p[1]).toFixed(1) + '" r="3" fill="' + l.color + '" data-eqtip="' + tip + '"/>';
      }).join("");
      return line + dots;
    }).join("");
    var zero = (minY < 0 && maxY > 0) ? '<line x1="' + pad.l + '" x2="' + (w - pad.r) + '" y1="' + Y(0).toFixed(1) + '" y2="' + Y(0).toFixed(1) + '" stroke="#e5e7eb"/>' : "";
    var yl = '<text x="4" y="' + (Y(maxY) + 3).toFixed(1) + '" font-size="9" fill="#94a3b8">' + yf(maxY) + "</text>" +
      '<text x="4" y="' + (Y(minY) + 3).toFixed(1) + '" font-size="9" fill="#94a3b8">' + yf(minY) + "</text>";
    var xs = opts.xs || [minX, Math.round((minX + maxX) / 2), maxX];
    var xl = xs.map(function (x) { return '<text x="' + X(x).toFixed(1) + '" y="' + (h - 8) + '" text-anchor="middle" font-size="9" fill="#94a3b8">' + ("'" + String(x).slice(2)) + "</text>"; }).join("");
    var legend = lines.map(function (l) {
      return '<span class="ml-leg"><span class="ml-sw" style="background:' + l.color + (l.dashed ? ";opacity:.55" : "") + '"></span>' + l.label + "</span>";
    }).join("");
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%">' + zero + polys + yl + xl + "</svg><div class=\"ml-legend\">" + legend + "</div>";
  }

  function segTrendComp(c) {
    var years = c.years, series = c.series;
    var totals = years.map(function (_, i) { return series.reduce(function (a, s) { return a + s.values[i]; }, 0); });
    var maxT = Math.max.apply(null, totals) * 1.1 || 1;
    var w = 540, h = 240, pad = { l: 40, r: 10, t: 14, b: 24 }, iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    var bw = iw / years.length;
    var bars = years.map(function (yr, i) {
      var x = pad.l + i * bw + bw * 0.18, bwid = bw * 0.64, yacc = pad.t + ih, cells = "";
      series.forEach(function (s) {
        var bh = s.values[i] / maxT * ih; yacc -= bh;
        var tip = "FY" + String(yr).slice(2) + " · " + s.label + ": $" + s.values[i].toFixed(1) + "B";
        cells += '<rect class="sb-seg" x="' + x.toFixed(1) + '" y="' + yacc.toFixed(1) + '" width="' + bwid.toFixed(1) + '" height="' + bh.toFixed(1) + '" fill="' + s.color + '" data-eqtip="' + tip + '"/>';
      });
      cells += '<text x="' + (x + bwid / 2).toFixed(1) + '" y="' + (h - 8) + '" text-anchor="middle" font-size="9" fill="#94a3b8">FY' + String(yr).slice(2) + "</text>";
      return cells;
    }).join("");
    var yl = '<text x="4" y="' + (pad.t + 6) + '" font-size="9" fill="#94a3b8">$' + Math.round(maxT) + "B</text>";
    var stacked = '<svg viewBox="0 0 ' + w + " " + h + '" width="100%">' + bars + yl + "</svg>";
    var legend = series.map(function (s) { return '<span class="ml-leg"><span class="ml-sw" style="background:' + s.color + '"></span>' + s.label + "</span>"; }).join("");
    var lines = series.map(function (s) {
      var data = [];
      for (var i = 1; i < years.length; i++) { if (s.values[i - 1] > 0) data.push([parseInt(years[i], 10), (s.values[i] / s.values[i - 1] - 1) * 100]); }
      return { label: s.label, color: s.color, data: data };
    });
    var xsY = years.slice(1).map(function (y) { return parseInt(y, 10); });
    var fyLab = function (x) { return "FY" + String(x).slice(2); };
    var yoy = multiLineSVG(lines, { yfmt: function (v) { return Math.round(v) + "%"; }, y0: true, xs: xsY, xlabel: fyLab });
    return '<div class="ic-card"><div class="ic-card-title">' + (c.title || "Revenue por segmento") + "</div>" + stacked +
      '<div class="ml-legend">' + legend + "</div>" + srcNote(c) + "</div>" +
      '<div class="ic-card"><div class="ic-card-title">YoY % por segmento</div>' + yoy + "</div>";
  }

  function icBarsComp(c) {
    var maxV = 0;
    c.rows.forEach(function (r) { r.values.forEach(function (v) { if (v > maxV) maxV = v; }); });
    var head = '<div class="icb-row icb-head"><div class="icb-label"></div>' +
      c.years.map(function (y) { return '<div class="icb-col">FY' + String(y).slice(2) + "</div>"; }).join("") + "</div>";
    var body = c.rows.map(function (r) {
      var cells = r.values.map(function (v, i) {
        var pct = maxV ? v / maxV * 100 : 0;
        var tip = r.label + " · FY" + String(c.years[i]).slice(2) + ": $" + v.toFixed(1) + "B";
        return '<div class="icb-col" data-eqtip="' + tip + '"><div class="icb-track"><div class="icb-bar" style="width:' + pct.toFixed(0) + "%;background:" + r.color + '"></div></div><span class="icb-val">$' + v.toFixed(1) + "B</span></div>";
      }).join("");
      return '<div class="icb-row"><div class="icb-label" style="border-left:3px solid ' + r.color + '">' + r.label + "</div>" + cells + "</div>";
    }).join("");
    var tot = '<div class="icb-row icb-total"><div class="icb-label">Total</div>' +
      c.totals.map(function (t) { return '<div class="icb-col"><b>$' + t.toFixed(1) + "B</b></div>"; }).join("") + "</div>";
    return '<div class="ic-card"><div class="ic-card-title">' + (c.title || "") + "</div>" + head + body + tot + srcNote(c) + "</div>";
  }

  function roicRoeComp(c) {
    var pf = function (v) { return Math.round(v) + "%"; };
    var fyLab = function (x) { return "FY" + String(x).slice(2); };
    var roic = multiLineSVG([
      { label: "ROIC reported", color: "#1b3454", data: c.roic },
      { label: "ROIC ex-goodwill", color: "#16a34a", dashed: true, data: c.roic_exgw }
    ], { yfmt: pf, y0: true, xlabel: fyLab });
    var roe = multiLineSVG([
      { label: "ROE reported", color: "#1b3454", data: c.roe },
      { label: "ROE ex-goodwill", color: "#16a34a", dashed: true, data: c.roe_exgw }
    ], { yfmt: pf, y0: true, xlabel: fyLab });
    return '<div class="ic-card"><div class="ic-card-title">ROIC % — reported vs ex-goodwill</div>' + roic + srcNote(c) + "</div>" +
      '<div class="ic-card"><div class="ic-card-title">ROE % — reported vs ex-goodwill</div>' + roe + "</div>";
  }
  function srcNote(c) { return c.source ? '<div class="ic-fin-note">Fonte: ' + c.source + "</div>" : ""; }

  var CAT_COLOR = { FOUNDING: "#1E3A5F", GOVERNANCE: "#f59e0b", PRODUCT: "#16a34a", "M&A": "#1b3454", REGULATORY: "#dc2626" };
  function timelineComp(c) {
    var rows = c.items.map(function (it) {
      var col = CAT_COLOR[it.cat] || "#1b3454";
      return '<div class="tl-item">' +
        '<div class="tl-dot" style="border-color:' + col + '"></div>' +
        '<div class="tl-body">' +
          '<div class="tl-head"><span class="tl-year">' + it.year + '</span>' +
            '<span class="tl-cat" style="color:' + col + '">' + it.cat + '</span>' +
            '<span class="tl-title">' + it.title + '</span></div>' +
          '<div class="tl-desc">' + it.desc + '</div>' +
          (it.impl ? '<div class="tl-impl">→ ' + it.impl + '</div>' : "") +
        '</div></div>';
    }).join("");
    return '<div class="tl-wrap">' + rows + "</div>" + srcNote(c);
  }

  function donutComp(c) {
    var segs = c.segments, total = segs.reduce(function (a, s) { return a + s.value; }, 0);
    var r = 70, cx = 90, cy = 90, C = 2 * Math.PI * r, off = 0;
    var arcs = segs.map(function (s) {
      var frac = s.value / total, len = frac * C;
      var tip = s.label + ": $" + s.value.toFixed(1) + "B (" + (frac * 100).toFixed(1) + "%)";
      var el = '<circle class="dn-arc" cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + s.color +
        '" stroke-width="34" stroke-dasharray="' + len.toFixed(2) + " " + (C - len).toFixed(2) +
        '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 ' + cx + " " + cy + ')" data-eqtip="' + tip + '"/>';
      off += len; return el;
    }).join("");
    var legend = segs.map(function (s) {
      return '<div class="dn-leg"><span class="dn-sw" style="background:' + s.color + '"></span>' +
        s.label + ' <b>' + (s.value / total * 100).toFixed(1) + "%</b> <i>$" + s.value.toFixed(1) + "B</i></div>";
    }).join("");
    return '<div class="ic-card"><div class="ic-card-title">' + (c.title || "") + "</div>" +
      '<div class="dn-wrap"><svg viewBox="0 0 180 180" width="200" height="200">' + arcs + "</svg>" +
      '<div class="dn-legend">' + legend + "</div></div>" + srcNote(c) + "</div>";
  }

  function segTableComp(c) {
    var total = c.rows.reduce(function (a, r) { return a + r.value; }, 0);
    var body = c.rows.map(function (r) {
      var ycls = r.yoy > 0 ? "pos" : (r.yoy < 0 ? "neg" : "");
      return '<tr><td class="seg-name" style="border-left:4px solid ' + r.color + '">' + r.label + "</td>" +
        '<td class="num">$' + r.value.toFixed(1) + "B</td>" +
        '<td class="num">' + (r.value / total * 100).toFixed(1) + "%</td>" +
        '<td class="num ' + ycls + '">' + (r.yoy > 0 ? "+" : "") + r.yoy + "%</td></tr>";
    }).join("");
    return '<div class="ic-card"><div class="ic-card-title">' + (c.title || "") + "</div>" +
      '<div class="table-wrap"><table class="seg-tbl"><thead><tr><th>Segment</th><th class="num">Revenue FY26</th><th class="num">% total</th><th class="num">YoY</th></tr></thead><tbody>' +
      body + "</tbody></table></div>" + srcNote(c) + "</div>";
  }
})();
