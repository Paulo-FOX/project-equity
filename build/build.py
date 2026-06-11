# -*- coding: utf-8 -*-
"""
Project Equity — build script.

Lê uma nota-hub da wiki (wiki/TICKER.md) e gera site/data/ticker.js
com window.EQ_DATA.TICKER = { meta, views{ov,ic,val,pa,er,insider}, ... }.

O conteúdo vem 100% da wiki. Rode após editar a nota:
    python build.py MSFT          # uma empresa
    python build.py               # todas as wiki/*.md (que tiverem ticker no frontmatter)

Sem dependências externas além de pyyaml (conversor markdown->HTML é próprio).
"""
import sys, os, re, json, html, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
VAULT = os.path.abspath(os.path.join(HERE, "..", ".."))   # .../equity-research-vault
WIKI_DIR = os.path.join(VAULT, "wiki")
DATA_DIR = os.path.join(HERE, "..", "data")

try:
    import yaml
except ImportError:
    yaml = None

# ---------------------------------------------------------------------------
# Mapeamento seção (H2 da nota) -> view do dashboard.
# Regra: primeiro termo (substring, lowercase) que casar define a view.
# Seções não mapeadas caem em 'ov' (overview) por padrão; as de 'notes'
# viram um apêndice colapsável no Overview.
# ---------------------------------------------------------------------------
VIEW_RULES = [
    ("val",   ["valuation"]),
    ("er",    ["evolução histórica", "evolucao historica", "narrativa",
               "trajetória", "trajetoria", "earnings"]),
    ("ic",    ["tese de investimento", "tese", "vantagem competitiva",
               "harness", "riscos", "risco", "moat"]),
    ("ov",    ["o negócio", "o negocio", "management", "financeiro",
               "financeiros", "o que", "visão", "visao"]),
    ("notes", ["pontos em aberto", "histórico de atualizações",
               "historico de atualizacoes", "fontes no vault", "backlog",
               "histórico de atualiza", "fontes"]),
]
VIEW_ORDER = ["ov", "ic", "val", "pa", "er", "insider"]
VIEW_LABELS = {
    "ov": "Company Overview", "ic": "Investment Case", "val": "Valuation",
    "pa": "Historical Price Action", "er": "Earnings Review",
    "insider": "Insider Trading",
}

def classify(h2_title):
    t = h2_title.lower()
    for view, terms in VIEW_RULES:
        for term in terms:
            if term in t:
                return view
    return "ov"

# ---------------------------------------------------------------------------
# Markdown -> HTML (subset suficiente p/ as notas do vault).
# ---------------------------------------------------------------------------
WIKILINK_RE = re.compile(r"\[\[([^\]]+)\]\]")
LINK_RE     = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
BOLD_RE     = re.compile(r"\*\*([^*]+)\*\*")
ITALIC_RE   = re.compile(r"(?<!\*)\*([^*\n]+)\*(?!\*)")
CODE_RE     = re.compile(r"`([^`]+)`")

def render_wikilink(m):
    inner = m.group(1)
    target, _, label = inner.partition("|")
    target = target.strip()
    label = (label.strip() or target.split("/")[-1])
    # Deep-link p/ Obsidian; resolvido por nome de nota (Obsidian acha pelo basename).
    note = target.split("/")[-1]
    href = "obsidian://open?vault=equity-research-vault&file=" + note
    return ('<a class="wikilink" href="%s" title="%s">%s</a>'
            % (html.escape(href, quote=True), html.escape(target), html.escape(label)))

def inline(text):
    text = html.escape(text)
    text = CODE_RE.sub(lambda m: "<code>%s</code>" % m.group(1), text)
    text = WIKILINK_RE.sub(render_wikilink, text)
    text = LINK_RE.sub(
        lambda m: '<a href="%s" target="_blank" rel="noopener">%s</a>'
                  % (html.escape(m.group(2), quote=True), m.group(1)), text)
    text = BOLD_RE.sub(lambda m: "<strong>%s</strong>" % m.group(1), text)
    text = ITALIC_RE.sub(lambda m: "<em>%s</em>" % m.group(1), text)
    return text

def md_to_html(md):
    lines = md.split("\n")
    out = []
    i, n = 0, len(lines)

    def flush_para(buf):
        if buf:
            out.append("<p>%s</p>" % inline(" ".join(buf)))
            buf.clear()

    para = []
    while i < n:
        line = lines[i]
        stripped = line.strip()

        # linha em branco
        if not stripped:
            flush_para(para)
            i += 1
            continue

        # hr
        if re.match(r"^(-{3,}|\*{3,}|_{3,})$", stripped):
            flush_para(para)
            out.append("<hr>")
            i += 1
            continue

        # header
        hm = re.match(r"^(#{1,6})\s+(.*)$", stripped)
        if hm:
            flush_para(para)
            lvl = len(hm.group(1))
            out.append("<h%d>%s</h%d>" % (lvl, inline(hm.group(2)), lvl))
            i += 1
            continue

        # blockquote (uma ou mais linhas)
        if stripped.startswith(">"):
            flush_para(para)
            buf = []
            while i < n and lines[i].strip().startswith(">"):
                buf.append(re.sub(r"^\s*>\s?", "", lines[i]))
                i += 1
            out.append("<blockquote>%s</blockquote>" % inline(" ".join(b.strip() for b in buf)))
            continue

        # tabela GFM
        if stripped.startswith("|") and i + 1 < n and re.match(r"^\s*\|?[\s:|-]+\|?\s*$", lines[i+1]):
            flush_para(para)
            tbl = []
            while i < n and lines[i].strip().startswith("|"):
                tbl.append(lines[i].strip())
                i += 1
            out.append(render_table(tbl))
            continue

        # lista (com nesting por indentação de 2 espaços)
        if re.match(r"^\s*([-*+]|\d+\.)\s+", line):
            flush_para(para)
            block, i = collect_list_block(lines, i)
            out.append(render_list(block))
            continue

        # parágrafo
        para.append(stripped)
        i += 1

    flush_para(para)
    return "\n".join(out)

def render_table(rows):
    def cells(r):
        r = r.strip()
        if r.startswith("|"): r = r[1:]
        if r.endswith("|"): r = r[:-1]
        return [c.strip() for c in r.split("|")]
    header = cells(rows[0])
    aligns = []
    for c in cells(rows[1]):
        c = c.strip()
        if c.startswith(":") and c.endswith(":"): aligns.append("center")
        elif c.endswith(":"): aligns.append("right")
        elif c.startswith(":"): aligns.append("left")
        else: aligns.append("")
    def td(tag, c, al):
        style = (' style="text-align:%s"' % al) if al else ""
        return "<%s%s>%s</%s>" % (tag, style, inline(c), tag)
    html_rows = ["<thead><tr>" +
                 "".join(td("th", h, aligns[j] if j < len(aligns) else "")
                         for j, h in enumerate(header)) + "</tr></thead>"]
    body = []
    for r in rows[2:]:
        cs = cells(r)
        body.append("<tr>" + "".join(td("td", c, aligns[j] if j < len(aligns) else "")
                                     for j, c in enumerate(cs)) + "</tr>")
    html_rows.append("<tbody>" + "".join(body) + "</tbody>")
    return '<div class="table-wrap"><table>' + "".join(html_rows) + "</table></div>"

def collect_list_block(lines, i):
    block = []
    n = len(lines)
    while i < n:
        line = lines[i]
        if re.match(r"^\s*([-*+]|\d+\.)\s+", line):
            block.append(line.rstrip("\n"))
            i += 1
        elif line.strip() == "":
            # peek: continua lista se a próxima também for item
            if i + 1 < n and re.match(r"^\s*([-*+]|\d+\.)\s+", lines[i+1]):
                i += 1
                continue
            break
        else:
            break
    return block, i

def render_list(block):
    # nesting simples por indentação (2 espaços = 1 nível)
    def indent(l): return len(l) - len(l.lstrip(" "))
    items = []
    for l in block:
        ind = indent(l)
        m = re.match(r"^\s*([-*+]|\d+\.)\s+(.*)$", l)
        ordered = bool(re.match(r"^\s*\d+\.", l))
        items.append((ind, ordered, m.group(2)))
    # build recursivamente
    def build(idx, base_ind):
        html_out = []
        ordered = items[idx][1]
        tag = "ol" if ordered else "ul"
        html_out.append("<%s>" % tag)
        i = idx
        while i < len(items):
            ind, od, txt = items[i]
            if ind < base_ind:
                break
            if ind > base_ind:
                # filhos: anexa ao último li (já aberto) — simplificação
                child_html, i = build(i, ind)
                if html_out and html_out[-1].endswith("</li>"):
                    html_out[-1] = html_out[-1][:-5] + child_html + "</li>"
                else:
                    html_out.append(child_html)
                continue
            html_out.append("<li>%s</li>" % inline(txt))
            i += 1
        html_out.append("</%s>" % tag)
        return "".join(html_out), i
    base = items[0][0]
    html_out, _ = build(0, base)
    return html_out

# ---------------------------------------------------------------------------
# Parsing da nota: frontmatter + intro + seções H2.
# ---------------------------------------------------------------------------
def parse_note(text):
    meta = {}
    body = text
    if text.startswith("---"):
        m = re.match(r"^---\n(.*?)\n---\n?(.*)$", text, re.DOTALL)
        if m:
            fm, body = m.group(1), m.group(2)
            if yaml:
                try: meta = yaml.safe_load(fm) or {}
                except Exception: meta = {}
    # split por H2 (linha "## ...")
    parts = re.split(r"^##\s+(.*)$", body, flags=re.MULTILINE)
    intro = parts[0].strip()
    sections = []
    for j in range(1, len(parts), 2):
        title = parts[j].strip()
        content = parts[j+1].strip() if j+1 < len(parts) else ""
        sections.append((title, content))
    return meta, intro, sections

def build_company(ticker):
    path = os.path.join(WIKI_DIR, ticker.upper() + ".md")
    if not os.path.exists(path):
        print("  ! nota não encontrada: %s" % path)
        return False
    with open(path, encoding="utf-8") as f:
        text = f.read()
    meta, intro, sections = parse_note(text)

    views = {v: [] for v in VIEW_ORDER}
    notes_html = []
    # intro (one-liner + qualquer coisa antes do 1º H2) abre o Overview
    if intro:
        views["ov"].append('<section class="wiki-sec">%s</section>' % md_to_html(intro))

    for title, content in sections:
        v = classify(title)
        block = ('<section class="wiki-sec"><h2>%s</h2>%s</section>'
                 % (html.escape(title), md_to_html(content)))
        if v == "notes":
            notes_html.append(block)
        else:
            views[v].append(block)

    if notes_html:
        views["ov"].append(
            '<details class="notes-appendix"><summary>Notas, pendências e changelog</summary>'
            + "".join(notes_html) + "</details>")

    views_html = {}
    for v in VIEW_ORDER:
        if views[v]:
            views_html[v] = "\n".join(views[v])
        else:
            views_html[v] = ('<div class="empty-view"><p>Sem dados de <strong>%s</strong> '
                             'na wiki ainda.</p><p class="hint">Esta view será populada quando a seção '
                             'correspondente existir em <code>wiki/%s.md</code>.</p></div>'
                             % (VIEW_LABELS[v], ticker.upper()))

    record = {
        "ticker": ticker.upper(),
        "meta": meta,
        "views": views_html,
        "source": "wiki/%s.md" % ticker.upper(),
        "built_at": datetime.date.today().isoformat(),
    }
    os.makedirs(os.path.abspath(DATA_DIR), exist_ok=True)
    out_path = os.path.join(os.path.abspath(DATA_DIR), ticker.lower() + ".js")
    payload = json.dumps(record, ensure_ascii=False, indent=None, default=str)
    js = ("window.EQ_DATA = window.EQ_DATA || {};\n"
          "window.EQ_DATA[%s] = %s;\n" % (json.dumps(ticker.upper()), payload))
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(js)
    print("  [ok] %s -> data/%s.js  (%d secoes, meta:%s)"
          % (ticker.upper(), ticker.lower(), len(sections), "sim" if meta else "nao"))
    return True

def main():
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    if args:
        tickers = [a.upper() for a in args]
    else:
        tickers = []
        for fn in sorted(os.listdir(WIKI_DIR)):
            if fn.endswith(".md") and fn[0].isalpha() and fn.isupper() is False:
                pass
        # pega arquivos TICKER.md (uppercase basename), exclui INDEX
        for fn in sorted(os.listdir(WIKI_DIR)):
            if fn.endswith(".md"):
                base = fn[:-3]
                if base.isupper() and base != "INDEX":
                    tickers.append(base)
    print("Project Equity - build (%d empresa(s))" % len(tickers))
    ok = 0
    for t in tickers:
        if build_company(t):
            ok += 1
    print("Concluido: %d/%d." % (ok, len(tickers)))

if __name__ == "__main__":
    main()
