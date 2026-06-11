/* Project Equity — tooltip global. Qualquer elemento (SVG ou HTML) com atributo
   data-eqtip="texto" mostra um tooltip seguindo o cursor. Um só handler p/ todos os gráficos. */
(function () {
  "use strict";
  var tip = null;
  function ensure() {
    if (!tip) {
      tip = document.createElement("div");
      tip.className = "eq-tip";
      tip.style.display = "none";
      document.body.appendChild(tip);
    }
    return tip;
  }
  function target(e) {
    var n = e.target;
    while (n && n !== document) {
      if (n.getAttribute && n.getAttribute("data-eqtip") != null) return n;
      n = n.parentNode;
    }
    return null;
  }
  document.addEventListener("mouseover", function (e) {
    var t = target(e);
    if (!t) return;
    ensure();
    tip.innerHTML = t.getAttribute("data-eqtip");
    tip.style.display = "block";
    place(e);
  });
  document.addEventListener("mousemove", function (e) {
    if (!tip || tip.style.display === "none") return;
    if (!target(e)) { tip.style.display = "none"; return; }
    place(e);
  });
  document.addEventListener("mouseout", function (e) {
    if (tip && target(e)) tip.style.display = "none";
  });
  function place(e) {
    var x = e.clientX + 14, y = e.clientY - 12;
    if (x + 220 > window.innerWidth) x = e.clientX - 14 - tip.offsetWidth;
    tip.style.left = x + "px";
    tip.style.top = Math.max(6, y) + "px";
  }
})();
