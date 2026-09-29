# Completa il generatore preventivi — consegna per Claude

> **COMPLETATO — 29 settembre (seconda sessione).** Vedi la sezione
> "Generatore commerciale completato — 29 settembre" in `docs/CLAUDE-HANDOFF.md`
> per cosa è stato fatto, cosa è stato verificato e cosa resta (associazione
> con richiesta CRM reale non collaudabile in locale, ispezione pixel del PDF
> scaricato). Questo file resta come riferimento storico della consegna
> originale.

## Obiettivo autorizzato
Integrare nel generatore reale il redesign approvato dall'utente e l'allegato Garden Planner. Non limitarsi a creare un altro mockup. Nessuna API AI. Preservare calcoli commerciali, dati cliente e modifiche locali fornitori.

## Riferimento grafico approvato
`output/pdf/anteprima-preventivo-elegante.pdf` (locale, 3 pagine). Builder di esempio `tmp/pdfs/preview.py`. Il PDF è dimostrativo: NON trasferire importi, dati cliente, quantità, condizioni o disegno di esempio nel codice di produzione. Stile bianco, verde profondo, oro discreto, molto spazio, totale grande, testi sintetici. L'utente chiede ancora più stile senza perdere chiarezza.

## Richieste finali dell'utente
- Da 1 a 3 prodotti. Uno: immagine e proposta affiancate, spazio ben sfruttato. Due: due schede affiancate. Tre: tre colonne leggibili. Il layout deve funzionare sia nella preview sia nel PDF A4.
- Foto in riquadri con proporzioni costanti, immagine intera: object-fit:contain, niente stretching né crop. Gestire foto mancanti e immagini personalizzate.
- Pagina 1: totale chiavi in mano dominante; prezzo equivalente al mq secondario. Per sola fornitura usare "Totale fornitura"; IVA coerente con le opzioni reali.
- Pagina 2: più dettagli su cosa si paga realmente: prodotto e caratteristiche verificate, materiali e quantità, preparazione/posa se previste, accessori, lavorazioni extra, trasporto, inclusioni/esclusioni. Non inventare servizi compresi né garanzie. La pagina pulita del mockup è troppo sintetica: arricchirla con i dati reali senza sovraccaricarla.
- Due scelte indipendenti: includi schede/dettagli tecnici e includi progetto Garden Planner. Progetto a pagina 2 se schede escluse, altrimenti dopo le schede. Numerazione dinamica, nessun foglio bianco.
- Tavola Garden Planner ampia, quotata, leggibile, legenda e superfici nette/escluse. Progetto realmente associato alla richiesta cliente, non ultimo disegno aperto in browser. Se manca associazione certa mostrare stato esplicito e non allegare automaticamente. Anteprima prima del download.

## Stato verificato al passaggio
Branch locale `codex/supplier-pdf-layouts`. Ultimo push eseguito in questa conversazione: `2c59ab4` su main (correzioni import PDF). Verificare git log/status aggiornati: potrebbero esserci interventi dell'utente.
Modifiche locali NON committate: normalizzazione unità fornitori, preservazione intestazione scelta, note di conversione, precisione dei prezzi; preventivo-v2.html con gerarchia totale/unitario invertita; documentazione. Non scartarle, non sovrascriverle.
Il generatore reale NON ha ancora il redesign completo né allegato Garden Planner. Ultimo check completo: 207 test passati. Anteprima HTML del cambio gerarchia verificata. PDF scaricato dal generatore non reperito per verifica: non dichiarare collaudo PDF completato.

## Mappa del codice
- `preventivo-v2.html`: template effettivo. `renderOptionsTable(data)` crea 1–3 card; `renderMaterialsBox`, `renderAccessories`, `renderExtraServices`, `renderTechCards`, `renderInstallationWork`, `renderConditions` ricevono già molti dati utili.
- CSS `.offer-v3` circa righe 619–665: attualmente la foto `.ph` è nascosta; la regola precedente usa cover. Riscrivere coerentemente, non aggiungere override contraddittori. Layout singolo ha grid-template-areas senza foto: va aggiornato.
- `app.js`: `buildNativePreventivoPayload()` circa 36505; `showPreventivoPreview()` circa 366xx. Payload contiene options.total, finalSqmPrice, materiali, accessori, extra servizi, IVA, modalità, dati cliente. Non duplicare il motore di calcolo.
- `lib/preventivo-pricing.js`: motore prezzi; test in `test/preventivo-pricing.test.js`. Mantenere invarianti i totali.
- `PSI_PREVENTIVO_V2_DISABLED = false`: v2 attivo; commento precedente obsoleto dice il contrario.
- `applyP2Visibility()` nel template usa query p2=0 per nascondere schede.
- `window.psiDownloadPdf()` esporta tutte le `.page` visibili, una alla volta con html2pdf. Al momento limita l'altezza delle pagine successive a H: prevenire overflow dei contenuti, non nasconderlo scalando/deformando il canvas.
- `garden-planner-page.js`: bridge localStorage `garden-planner-quote-bridge-v1`, scrittura circa 4320; richiesta `garden-planner-request-prefill-v1`.
- `app.js`: lettura bridge circa 1204, prefill richiesta circa 5683. Ispezionare schema, ID e salvataggio progetto PRIMA di definire l'allegato. Preferire snapshot geometrico persistito e relativo render rispetto a immagine arbitraria/ultimo canvas.
- `test/garden-planner-quote-prefill.test.js`: copertura esistente del bridge.

## Ordine di lavoro suggerito
1. Fotografare stato git, leggere istruzioni repo. Esaminare mockup PDF e payload reali.
2. Redesign template con 1/2/3 prodotti e foto proporzionate; mantenere totali e clausole reali.
3. Pagina dettagli strutturata dai dati esistenti, con overflow gestito e paginazione se necessario.
4. Collegamento progetto/richiesta e due opzioni di inclusione; rendering tavola e numerazione dinamica.
5. Verificare tutti i casi sotto, aggiornare docs/CLAUDE-HANDOFF.md e riportare ciò che resta. Commit/push solo secondo autorizzazione corrente, non presumere che il precedente push autorizzi qualunque nuova pubblicazione.

## Criteri di accettazione
- 1, 2, 3 prodotti; nomi lunghi, importi grandi, foto orizzontali/verticali/assenti; totali senza sovrapposizioni.
- Fornitura e posa / sola fornitura; IVA inclusa/esclusa/mista; sconti, extra e trasporto a pagamento. Calcoli identici prima/dopo.
- Tutte le combinazioni schede sì/no e progetto sì/no. Nessun progetto disponibile o associato ad altro cliente: nessun allegato errato.
- Progetto con area irregolare, esclusioni, quote e molti rotoli: legenda leggibile e nessun prezzo nel progetto Garden Planner, salvo funzioni trasferta già previste.
- PDF effettivi generati, renderizzati e ispezionati su tutte le pagine. Controllare footer, numerazione, immagini non deformate, nessun taglio o pagina vuota.
- npm run build && npm run check. Bump shell/cache coordinato prima della pubblicazione. Verificare anche stampa browser.

## Altri punti del piano dopo il generatore
Collaudo autenticato posa → conto/ricavi → PDF con aggiornamenti delle spese; persistenza dopo ricaricamento. Fornitori: eventuale archivio equivalenze per codice articolo/fornitore NON ancora implementato. Vedere docs/CLAUDE-HANDOFF.md per storia e limiti, dando precedenza alle sezioni aggiornate in fondo.
