/* Project Equity — aba Insider Trading (SEC Form 4): leading indicator + destaque de compras >10%. */
(function () {
  "use strict";
  var INS = window.EQ_INSIDER || {};

  function fM(v) {
    if (v == null) return "—";
    var a = Math.abs(v), s = v < 0 ? "-" : "";
    if (a >= 1e9) return s + "$" + (a / 1e9).toFixed(2) + "B";
    if (a >= 1e6) return s + "$" + (a / 1e6).toFixed(1) + "M";
    if (a >= 1e3) return s + "$" + (a / 1e3).toFixed(0) + "k";
    return s + "$" + a.toFixed(0);
  }
  function fNum(v) { return v == null ? "—" : v.toLocaleString("en-US"); }
  function px(v) { return v == null ? "—" : "$" + v.toFixed(2); }
  var MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function fmtDate(iso) { var p = String(iso).split("-"); return p.length === 3 ? MO[+p[1] - 1] + " " + p[2] + ", " + p[0] : iso; }
  function timingCell(t, isSeller) {
    if (t == null) return "<td class='num'>—</td>";
    var good = isSeller ? t < 0 : t > 0;
    return "<td class='num " + (good ? "tg-good" : "tg-bad") + "'>" + (good ? "good " : "poor ") + (t > 0 ? "+" : "") + t + "%</td>";
  }

  window.renderInsider = function (ticker) {
    var d = INS[ticker];
    if (!d) return null;
    var k = d.kpis;
    var banner = '<div class="ic-banner"><h2>' + ticker + " — Insider Trading</h2>" +
      '<div class="ic-thesis">SEC Form 4 · atividade vs preço · top insiders · breakdown por tipo · destaque de compras &gt;10%</div></div>';
    var howto = '<div class="ins-howto">📌 <b>Como ler:</b> em mega-caps, <b>venda</b> de insider é majoritariamente rotineira (vesting de RSU, retenção de imposto, planos 10b5-1) e pouco informativa. A <b>compra open-market</b> (insider gastando o próprio caixa) é o sinal relevante — e <b>compras &gt;10% das holdings</b> são destacadas. Fonte: <b>SEC Form 4</b> (Insider Transactions Data Sets) + preço Bloomberg. Janela: ' + d.quarters_fetched + ' trimestres (' + String(d.window_start).slice(0, 7) + ' → ' + String(d.window_end).slice(0, 7) + ').</div>';

    var netCls = k.ttm_net < 0 ? "neg" : "pos";
    var kpis = '<div class="er-kpi-row ins-kpi">' +
      kpi("NET OPEN-MARKET (TTM)", fM(k.ttm_net), "buys − sells (12m)", netCls) +
      kpi("SELLS VS BUYS (TTM)", k.ttm_sell_n + " / " + k.ttm_buy_n, "open-market", k.ttm_buy_n > 0 ? "" : "neg") +
      kpi("OPEN-MKT BUYS (janela)", String(k.allbuy_n), "compras genuínas (P)", k.allbuy_n > 0 ? "pos" : "") +
      kpi("INSIDERS TRACKED", String(k.insiders_n), k.filings_est + " transações", "") +
      kpi("ÚLTIMO CLUSTER BUY", k.last_cluster ? fmtDate(k.last_cluster) : "—", k.last_cluster ? "≥2 insiders" : "nenhum", k.last_cluster ? "pos" : "") +
      "</div>";

    // leading-indicator read + highlights
    var hl = "";
    if (d.highlights && d.highlights.length) {
      hl = '<div class="ins-hl-wrap"><div class="ins-hl-title">⭐ Compras open-market relevantes (&gt;10% das holdings)</div>' +
        d.highlights.map(function (h) {
          var tag = h.new_pos ? "NOVA POSIÇÃO" : "+" + h.pct + "% das holdings";
          return '<div class="ins-hl"><span class="ins-hl-date">' + fmtDate(h.date) + '</span><b>' + h.name + '</b> <span class="ins-hl-role">' + h.role + '</span>' +
            '<span class="ins-hl-tag">' + tag + '</span><span class="ins-hl-val">' + fNum(Math.round(h.shares)) + ' sh @ ' + px(h.price) + ' = ' + fM(h.value) + '</span></div>';
        }).join("") + "</div>";
    }
    var read = '<div class="ins-read"><div class="ins-read-t">📈 Leading-indicator read</div>' + d.read_html + "</div>" + hl;

    // chart
    var chart = '<div class="ov-sec-label" style="margin-top:20px">Atividade de insider vs preço</div>' +
      '<div class="chart-box" style="padding:16px">' + activityChart(d) + "</div>";

    // top insiders
    var topRows = d.top.map(function (t) {
      var seller = t.sells > t.buys || t.net_val < 0;
      var rt = t.routine ? ' <span class="ins-routine">mostly routine</span>' : "";
      return "<tr><td class='ins-name'>" + t.name + rt + "</td><td>" + t.role + "</td>" +
        "<td class='num'>" + t.buys + "</td><td class='num'>" + t.sells + "</td>" +
        "<td class='num " + (t.net_shares < 0 ? "neg" : "pos") + "'>" + fNum(t.net_shares) + "</td>" +
        "<td class='num " + (t.net_val < 0 ? "neg" : "pos") + "'>" + fM(t.net_val) + "</td>" +
        "<td class='num'>" + (t.avg_sell ? px(t.avg_sell) : (t.avg_buy ? px(t.avg_buy) : "—")) + "</td>" +
        timingCell(t.t6, seller) + timingCell(t.t12, seller) + "</tr>";
    }).join("");
    var topTbl = '<div class="ov-sec-label" style="margin-top:20px">Who\'s trading — top insiders</div>' +
      "<div class='ins-note'>Timing = como a ação se moveu após os trades. <b class='tg-good'>good</b> = bom timing (vendeu antes de cair / comprou antes de subir); <b class='tg-bad'>poor</b> = ruim. Ordenado por |net $|.</div>" +
      '<div class="table-wrap"><table class="ins-tbl"><thead><tr><th>Insider</th><th>Role</th><th class="num">Buys</th><th class="num">Sells</th><th class="num">Net shares</th><th class="num">Net $</th><th class="num">Avg px</th><th class="num">Timing 6m</th><th class="num">Timing 12m</th></tr></thead><tbody>' + topRows + "</tbody></table></div>";

    // largest open-market trades
    var lgRows = d.largest.map(function (t) {
      var good = t.type === "Sale" ? (t.t6 != null && t.t6 < 0) : (t.t6 != null && t.t6 > 0);
      var tcell = t.t6 == null ? "<td class='num'>—</td>" : "<td class='num " + (good ? "tg-good" : "tg-bad") + "'>" + (t.t6 > 0 ? "+" : "") + t.t6 + "%</td>";
      return "<tr><td>" + fmtDate(t.date) + "</td><td class='ins-name'>" + t.name + "</td><td>" + t.role + "</td>" +
        "<td class='" + (t.type === "Sale" ? "neg" : "pos") + "'>" + t.type + "</td><td class='num'>" + fNum(t.shares) + "</td><td class='num'>" + px(t.price) + "</td><td class='num'>" + fM(t.value) + "</td>" + tcell + "</tr>";
    }).join("");
    var lgTbl = '<div class="ov-sec-label" style="margin-top:20px">Largest open-market trades</div>' +
      '<div class="table-wrap"><table class="ins-tbl"><thead><tr><th>Date</th><th>Insider</th><th>Role</th><th>Type</th><th class="num">Shares</th><th class="num">Price</th><th class="num">Value</th><th class="num">Timing 6m</th></tr></thead><tbody>' + lgRows + "</tbody></table></div>";

    // transaction-type breakdown
    var types = d.types, maxN = Math.max.apply(null, types.map(function (x) { return x.all_n; }));
    var typeColors = { "S": "#dc2626", "P": "#16a34a", "A": "#3b82f6", "J": "#60a5fa" };
    var bars = types.map(function (t) {
      var col = typeColors[t.code] || "#94a3b8";
      return '<div class="tb-row" data-eqtip="' + t.label + ": " + t.all_n + " filings · " + fM(t.all_v) + '"><span class="tb-lab">' + t.label + '</span><div class="tb-track"><div class="tb-bar" style="width:' + (t.all_n / maxN * 100).toFixed(0) + "%;background:" + col + '"></div></div><span class="tb-n">' + t.all_n + "</span></div>";
    }).join("");
    var typeTblRows = types.map(function (t) {
      return "<tr><td>" + t.label + " <span class='ins-code'>(" + t.code + ")</span></td><td class='num'>" + fNum(t.all_n) + "</td><td class='num'>" + fM(t.all_v) + "</td><td class='num'>" + fNum(t.ttm_n) + "</td><td class='num'>" + fM(t.ttm_v) + "</td></tr>";
    }).join("");
    var typeSec = '<div class="ov-sec-label" style="margin-top:20px">Transaction-type breakdown — a maior parte da venda é rotineira</div>' +
      '<div class="ic-card"><div class="tb-wrap">' + bars + "</div></div>" +
      '<div class="table-wrap"><table class="ins-tbl"><thead><tr><th>Type</th><th class="num">Count (janela)</th><th class="num">$ (janela)</th><th class="num">TTM count</th><th class="num">TTM $</th></tr></thead><tbody>' + typeTblRows + "</tbody></table></div>";

    // backtest preditivo
    var bt = d.backtest || {};
    function btCard(label, b, cls) {
      if (!b) return "";
      return '<div class="bt-card bt-' + cls + '"><div class="bt-lab">' + label + " <span class='bt-n'>(" + b.n + " tri)</span></div>" +
        '<div class="bt-vals"><div><span>FWD 3M</span><b>' + (b.r3 == null ? "—" : (b.r3 > 0 ? "+" : "") + b.r3 + "%") + "</b></div>" +
        "<div><span>FWD 6M</span><b>" + (b.r6 == null ? "—" : (b.r6 > 0 ? "+" : "") + b.r6 + "%") + "</b></div>" +
        "<div><span>FWD 12M</span><b>" + (b.r12 == null ? "—" : (b.r12 > 0 ? "+" : "") + b.r12 + "%") + "</b></div></div></div>";
    }
    var sp = bt.spread || {};
    var spTxt = (sp.r12 != null)
      ? "Spread (acquire − dispose): 3m <b>" + sp.r3 + "pts</b> · 6m <b>" + sp.r6 + "pts</b> · 12m <b>" + sp.r12 + "pts</b>. Positivo = trimestres com viés de compra precederam retornos melhores."
      : "Sem trimestres <b>acquire-leaning</b> na janela (insiders só vendem) — os retornos pós trimestres dispose-leaning mostram que a <b>venda rotineira NÃO antecedeu quedas</b> (não é sinal de baixa).";
    var btSec = '<div class="ov-sec-label" style="margin-top:20px">Backtest preditivo</div>' +
      "<div class='ins-note'>Trimestres agrupados por viés (acquire-leaning = mais transações de aquisição; inclui awards/exercises) → retorno forward médio da ação. Count-based.</div>" +
      '<div class="bt-row">' + btCard("Acquire-leaning", bt.acquire, "good") + btCard("Dispose-leaning", bt.dispose, "bad") + "</div>" +
      "<div class='bt-spread'>" + spTxt + "</div>";

    // congressional
    var cgSec = "";
    var c = d.congress;
    if (c && c.n) {
      var cgK = '<div class="er-kpi-row ins-kpi" style="margin-top:8px">' +
        kpi("MEMBROS", String(c.members_n), "Senate + House", "") +
        kpi("BUYS / SELLS", c.buys + " / " + c.sells, "transações", "") +
        kpi("NET FLOW (est.)", fM(c.net_flow), "buy − sell (midpoints)", c.net_flow < 0 ? "neg" : "pos") +
        kpi("MAIS RECENTE", c.most_recent ? fmtDate(c.most_recent) : "—", "transação", "") +
        kpi("SENATE / HOUSE", c.senate_n + " / " + c.house_n, "trades", "") + "</div>";
      var cgRows = c.trades.map(function (t) {
        var lag = (t.tx_date && t.disc_date) ? Math.round((new Date(t.disc_date) - new Date(t.tx_date)) / 864e5) : null;
        return "<tr><td class='ins-name'>" + t.member + (t.owner && t.owner !== "Self" ? " <span class='ins-routine'>" + t.owner + "</span>" : "") + "</td><td>" + t.chamber + "</td><td>" + (t.district || "") + "</td>" +
          "<td class='" + (t.type === "Buy" ? "pos" : "neg") + "'>" + t.type + "</td><td>" + t.amount + "</td><td>" + fmtDate(t.tx_date) + "</td><td>" + fmtDate(t.disc_date) + (lag != null ? " <span class='ins-code'>(+" + lag + "d)</span>" : "") + "</td>" +
          "<td>" + (t.link ? "<a href='" + t.link + "' target='_blank'>view</a>" : "") + "</td></tr>";
      }).join("");
      cgSec = '<div class="ov-sec-label" style="margin-top:22px">Congressional Trading (Senate &amp; House)</div>' +
        "<div class='ins-howto'>💼 Trades pessoais de membros do Congresso no papel (STOCK Act): valores são <b>faixas</b> divulgadas até ~45 dias após a execução. Indicador acompanhado mas debatido — apresentado como dado. Fonte: <b>Senate eFD + House Clerk</b> (via FMP). <b>Limite do plano free:</b> só os disclosures mais recentes (histórico completo requer plano pago).</div>" +
        cgK +
        "<div class='table-wrap'><table class='ins-tbl'><thead><tr><th>Membro</th><th>Câmara</th><th>Distrito</th><th>Tipo</th><th>Faixa</th><th>Transação</th><th>Divulgado</th><th>Filing</th></tr></thead><tbody>" + cgRows + "</tbody></table></div>";
    }

    var src = '<div class="ic-src" style="margin-top:18px">FONTE OFICIAL — SEC Form 4 (Insider Transactions Data Sets, data.sec.gov) · Congressional via Senate eFD/House Clerk (FMP) · preço Bloomberg · dados de ' + fmtDate(d.as_of) + ".</div>";

    return "<div class='ins-tab'>" + banner + howto + kpis + read + chart + topTbl + lgTbl + typeSec + btSec + cgSec + src + "</div>";
  };

  function kpi(label, val, sub, cls) {
    return '<div class="kpi-card" style="border-left-color:#1b3454"><div class="kpi-label">' + label + '</div><div class="kpi-val ' + (cls || "") + '">' + val + '</div><div class="kpi-sub">' + sub + "</div></div>";
  }

  // gráfico: barras mensais net $ open-market (eixo dir) + preço (eixo esq)
  function activityChart(d) {
    var bars = d.monthly, prices = d.prices;
    if (!bars.length) return "";
    var start = bars[0][0];
    var pr = prices.filter(function (p) { return p[0].slice(0, 7) >= start; });
    var w = 1000, h = 340, pad = { l: 50, r: 60, t: 16, b: 30 }, iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    var months = bars.map(function (b) { return b[0]; });
    var maxAbs = Math.max.apply(null, bars.map(function (b) { return Math.abs(b[1]); })) || 1;
    var n = months.length;
    var BX = function (i) { return pad.l + (n < 2 ? iw / 2 : i / (n - 1) * iw); };
    var BY = function (v) { return pad.t + ih / 2 - (v / maxAbs) * (ih / 2); };
    var bw = Math.max(2, iw / n * 0.6);
    var barSvg = bars.map(function (b, i) {
      var x = BX(i) - bw / 2, y0 = BY(0), y1 = BY(b[1]);
      var col = b[1] >= 0 ? "#16a34a" : "#dc2626";
      return '<rect x="' + x.toFixed(1) + '" y="' + Math.min(y0, y1).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.abs(y1 - y0).toFixed(1) + '" fill="' + col + '" opacity="0.5" data-eqtip="' + b[0] + ": " + fM(b[1]) + ' net open-market"/>';
    }).join("");
    // price line (left axis)
    var pv = pr.map(function (p) { return p[1]; });
    var pmin = Math.min.apply(null, pv), pmax = Math.max.apply(null, pv), prange = (pmax - pmin) || 1;
    var PX = function (dt) {
      var f = (new Date(dt) - new Date(months[0] + "-01")) / (new Date(months[n - 1] + "-01") - new Date(months[0] + "-01"));
      return pad.l + Math.max(0, Math.min(1, f)) * iw;
    };
    var PY = function (v) { return pad.t + ih - (v - pmin) / prange * ih; };
    var pts = pr.map(function (p) { return PX(p[0]).toFixed(1) + "," + PY(p[1]).toFixed(1); }).join(" ");
    var pl = '<polyline fill="none" stroke="#1b3454" stroke-width="1.5" points="' + pts + '"/>';
    // axes labels
    var lax = "";
    for (var a = 0; a <= 3; a++) { var v = pmin + prange * a / 3; lax += '<text x="' + (pad.l - 6) + '" y="' + (PY(v) + 3).toFixed(1) + '" text-anchor="end" font-size="9" fill="#94a3b8">$' + Math.round(v) + "</text>"; }
    var rax = '<text x="' + (w - pad.r + 6) + '" y="' + (BY(maxAbs) + 3).toFixed(1) + '" font-size="9" fill="#16a34a">+' + fM(maxAbs) + "</text>" +
      '<text x="' + (w - pad.r + 6) + '" y="' + (BY(-maxAbs) + 3).toFixed(1) + '" font-size="9" fill="#dc2626">' + fM(-maxAbs) + "</text>" +
      '<line x1="' + pad.l + '" x2="' + (w - pad.r) + '" y1="' + BY(0).toFixed(1) + '" y2="' + BY(0).toFixed(1) + '" stroke="#e5e7eb"/>';
    var xl = "";
    for (var i = 0; i < n; i += Math.ceil(n / 8)) xl += '<text x="' + BX(i).toFixed(1) + '" y="' + (h - 10) + '" text-anchor="middle" font-size="8.5" fill="#94a3b8">' + months[i] + "</text>";
    var leg = '<div class="ml-legend"><span class="ml-leg"><span class="ml-sw" style="background:#dc2626;opacity:.6"></span>Net $ mensal (dir)</span><span class="ml-leg"><span class="ml-sw" style="background:#1b3454"></span>' + d.ticker + ' (esq)</span></div>';
    return '<svg viewBox="0 0 ' + w + " " + h + '" width="100%">' + rax + barSvg + pl + lax + xl + "</svg>" + leg;
  }
})();
