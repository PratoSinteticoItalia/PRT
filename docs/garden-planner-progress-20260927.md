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
