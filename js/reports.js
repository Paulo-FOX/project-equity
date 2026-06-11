/* Reports (Morning / Closing) — botoes na Home + overlay full-screen. Le EQ_REPORTS (conteudo) + EQ_CAL (indices/key events). */
(function () {
  "use strict";
  function el(id) { return document.getElementById(id); }
  var MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function dt(iso) { var p = String(iso).split("-"); return p.length === 3 ? MO[+p[1] - 1] + " " + (+p[2]) : iso; }
  function pct(v) { return v == null ? "—" : (v > 0 ? "+" : "") + v.toFixed(2) + "%"; }
  function cls(v) { return v == null ? "" : (v > 0 ? "pos" : "neg"); }

  function indicesHtml() {
    var idx = (window.EQ_CAL || {}).indices || [];
    if (!idx.length) return "";
    return '<div class="rep-idx">' + idx.map(function (i) {
      return '<div class="rep-idx-i"><span class="rep-idx-n">' + i.name + '</span><span class="rep-idx-p">' +
        (i.price != null ? Number(i.price).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "—") +
        '</span><span class="rep-idx-c ' + cls(i.chg) + '">' + pct(i.chg) + " 1D</span><span class=\"rep-idx-c " + cls(i.ytd) + '">' + pct(i.ytd) + " YTD</span></div>";
    }).join("") + "</div>";
  }

  function keyEventsHtml() {
    var cal = window.EQ_CAL || {};
    function wk(title, w) {
      if (!w) return "";
      var evs = (w.events || []).map(function (e) {
        var deep = (window.EQ_DATA && window.EQ_DATA[e.ticker]) || (window.EQ_OV && window.EQ_OV[e.ticker]);
        var link = deep ? ' · <a class="rep-link" href="#" onclick="openCompany(\'' + e.ticker + '\');return false">Earnings Review →</a>' : "";
        return "<li><b>" + dt(e.date) + "</b> — " + e.name + " (" + e.ticker + ") earnings" + link + "</li>";
      }).join("") || '<li class="rep-muted">No covered name.</li>';
      return '<div class="rep-ke-h">' + title + ' <span>(' + dt(w.start) + " – " + dt(w.end) + ")</span></div><ul class=\"rep-ul\">" + evs + "</ul>";
    }
    return wk("This week", cal.this_week) + wk("Next week", cal.next_week);
  }

  function sectionHtml(s) {
    var h = '<div class="rep-sec"><h3 class="rep-h3">' + s.title + "</h3>";
    if (s.type === "context") {
      h += indicesHtml() + '<ul class="rep-ul">' + (s.bullets || []).map(function (b) { return "<li>" + b + "</li>"; }).join("") + "</ul>";
    } else if (s.type === "movers") {
      h += '<div class="rep-note">' + s.html + "</div>";
    } else if (s.type === "news") {
      h += (s.items || []).map(function (n) {
        var tag = n.tag ? ' <span class="rep-tag rep-tag-' + (n.tag === "EARNINGS" ? "ern" : "x") + '">' + n.tag + "</span>" : "";
        return '<div class="rep-news"><div class="rep-news-h">' + n.head + tag + '</div><ul class="rep-ul">' +
          (n.bullets || []).map(function (b) { return "<li>" + b + "</li>"; }).join("") + "</ul></div>";
      }).join("");
    } else if (s.type === "events") {
      h += keyEventsHtml();
    }
    return h + "</div>";
  }

  window.openReport = function (which) {
    var r = (window.EQ_REPORTS || {})[which]; if (!r) return;
    var ov = el("report-overlay"); if (!ov) return;
    ov.innerHTML = '<div class="rep-scroll"><div class="rep-box"><button class="rep-close" onclick="closeReport()" title="Fechar">✕</button>' +
      '<div class="rep-banner"><h2>' + r.kind + " <span>" + r.date + "</span></h2><div class=\"rep-date\">" + r.date_long + " — " + r.subtitle + "</div></div>" +
      (r.sections || []).map(sectionHtml).join("") +
      '<div class="rep-footer">' + r.footer + "</div></div></div>";
    ov.style.display = "block";
    document.body.style.overflow = "hidden";
    var sc = ov.querySelector(".rep-scroll"); if (sc) sc.scrollTop = 0;
  };
  window.closeReport = function () {
    var ov = el("report-overlay"); if (ov) { ov.style.display = "none"; ov.innerHTML = ""; }
    document.body.style.overflow = "";
  };

  window.renderReportButtons = function () {
    var c = el("home-reports"); if (!c) return;
    var R = window.EQ_REPORTS || {};
    function btn(which, label) {
      var r = R[which]; if (!r) return "";
      return '<button class="rep-btn" onclick="openReport(\'' + which + '\')"><span class="rep-btn-t">' + label + "</span><span class=\"rep-btn-d\">" + r.date + "</span></button>";
    }
    c.innerHTML = btn("morning", "Morning Report") + btn("closing", "Closing Report");
  };
})();
