# Project Equity — FOX

Dashboard de equity research (stock overview + deep dive) que **puxa o conteúdo da
wiki** do equity-research-vault. Inspirado na estrutura do Equity Project.

## Como funciona

```
wiki/MSFT.md  ──(build.py)──►  site/data/msft.js  ──(index.html)──►  dashboard
```

A nota-hub `wiki/TICKER.md` é a **fonte de verdade**. O `build.py` parseia as seções
`##` da nota, converte markdown→HTML e gera um `data/ticker.js`. O `index.html`
(estático, abre direto do Drive) renderiza as 6 views.

### Mapa seção da wiki → view do dashboard
| View | Seções da nota |
|---|---|
| Company Overview | one-liner/intro · "O negócio" · Management · Financeiros |
| Investment Case | Tese · Vantagem competitiva · Harness · Riscos |
| Valuation | Valuation |
| Earnings Review | Evolução histórica · Narrativa (arco/Azure/calls) |
| Historical Price Action | *(placeholder — sem dado de preço ainda)* |
| Insider Trading | *(placeholder)* |

## Atualizar

Depois de editar uma nota da wiki:

```
cd site\build
build.bat MSFT      ou      python build.py MSFT
```

Sem argumento, regenera **todas** as `wiki/TICKER.md`. Recarregue o `index.html`.

> Os `[[wikilinks]]` viram deep-links `obsidian://` — clicar abre a nota no Obsidian.

## Estrutura
```
site/
  index.html        casca (top-bar, sidebar, 6 views)
  css/styles.css
  js/app.js         navegação
  data/*.js         gerados pelo build (1 por empresa)
  build/build.py    wiki -> data/*.js
  build/build.bat
```
