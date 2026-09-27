# Garden Planner — primo incremento

Branch: codex/garden-workspace-20260926. Versione locale, non pubblicata.

## Implementato
- Tavola più larga e adattiva, pannello richiudibile e modalità disegno.
- Barra istruzioni stabile: il primo vertice non sposta più la tavola.
- Aree escluse disegnabili e modificabili: casa, casetta, patio esistente, piscina, aiuola.
- Superficie netta calcolata su unione geometrica, con sottrazione delle intersezioni delle esclusioni e delle nuove pavimentazioni. Esclusioni sovrapposte conteggiate una volta.
- Fondo da preparare: unione prato e nuova pavimentazione meno ostacoli esistenti.
- Copertura rotoli intersecata con prato netto. Distinzione materiale, coperto, scoperto, ritagli e sovrapposizioni, percentuale sul materiale tracciato.
- Stessa copertura usata per attivare il calcolo posa da layout, nel report tecnico e nel passaggio al generatore.
- Ostacoli visibili in tavola e report.

## Verifica
Test geometrici: ostacoli interni/esterni/parziali, duplicati, sovrapposti, poligoni concavi e diagonali, rotoli ruotati e sovrapposti, esclusione totale e layout vuoto.
Prova browser: prato 70 m², ostacolo 4 m², netto 66 m²; rotolo 20 m² attraverso ostacolo: coperto 16 m², scoperto 50 m², ritaglio 4 m² (20%). Report tecnico concordante.

## Da completare prima del rilascio complessivo
- Riutilizzo interattivo dei ritagli con provenienza, sagoma e verso del filo; al momento il dato è solo quantitativo, non una promessa di recuperabilità.
- Perimetri interni e segmenti di bordo risultanti dalle intersezioni: il perimetro attuale resta quello esterno lordo; non è un computo dei bordi dei fori.
- Giunzioni tagliate dagli ostacoli: le giunzioni da layout restano una stima sulle geometrie intere dei rotoli.
- Etichette e quote senza collisioni, pan e adattamento del disegno, libreria elementi architettonici.
- Salvataggio completo del progetto e storico modifiche.
- PDF commerciale del generatore con totale chiavi in mano prioritario (non modificato in questo incremento).
- Collaudo integrato e pubblicazione in staging; cache version da aggiornare al rilascio.

## Technical workspace iteration

- New slate workspace chrome, dedicated drawing board and numeric construction inspector.
- Adaptive visible grid (minimum 18px cells) independent from snapping; pan tool, fit all, zoom up to 400% in menu, dimension toggle.
- External dimension lines; canvas label placement reserves occupied rectangles and renders text after geometry. Crowded labels without an available slot are omitted rather than overlapped.
- Rectangles defined by origin, width, depth and rotation; precise vertex coordinate editing.
- Architectural exclusions (including Abitazione) and numeric roll insertion with center and direction.
- Terminal rectangular offcut reuse: verifies the source piece lies outside every lawn polygon, trims the source roll, moves the cut piece without rotating grain. Material area is conserved. Conservative validation does not yet recover pieces inside exclusion holes or arbitrary polygonal waste.
- Roll footprints remain visible when another area is active.

Validation: full `npm run check`, 163 tests passed. UI checked at narrow default viewport and 1440×900. Numeric 8×6 lawn = 48m²; 2×2 excluded building reduces net to 44m². A 10×2 roll covering 16m² yielded a reusable 2×2 end: after reuse material remains 20m² and coverage becomes 20m², waste zero. Tests also cover rotated cuts and rejection when the cut intersects another lawn.

Still pending: arbitrary cut polygon nesting, drag-and-drop offcut inventory, full drawing undo/history and project persistence, printable customer quotation redesign. This iteration is a local preview, not a production deployment.

## Guided recovery and readable metrics

Replaced the manual cut-length/X/Y workflow with automatically detected rectangular end and side strips (5cm increments). Suggestions are alternatives, recalculated after each cut. Selection highlights the original strip; the pointer carries a green/red placement preview. Commit is allowed only fully on net lawn with no material overlap. Original roll is trimmed only on commit; immediate undo restores the exact previous areas. Escape and cancel buttons discard the pending operation. Grain direction is retained. Irregular/triangular waste is explicitly unsupported rather than presented as recoverable.

The inspector now starts with net lawn area, coverage progress, area remaining, inserted material and unused material. Waste breakdown is expandable; quantities are not presented as a completed purchase order. Pointer coordinates now account for CSS canvas scaling and borders.

Validation: 166 tests passed, including automatic end/side detection, reversed grain, holes, overlap/outside rejection, stale source and triangular waste. UI: 20m² roll, 16m² coverage, automatic 4m² proposal, click-to-place →20m² coverage/0 waste; undo restores16m²/4m². Separate preview tab used to preserve the user's existing drawing.
