# Passaggio di consegne CRM — 28 settembre 2026

## Direzione concordata
Portare il CRM a uno strumento operativo semplice, affidabile e integrato. Ridurre doppie imputazioni, rendere chiari i quantitativi e verificare persistenza e usabilità. TurfEstimator è stato citato come riferimento da studiare, non come specifica già analizzata.

## Garden Planner: lavoro già avanzato
Sono stati sviluppati area tecnica più ampia, griglia e quote, esclusioni (piscine/casette), selezione e spostamento, rettangoli a trascinamento, bordure A–B, recupero degli sfridi rettangolari e export cliente con pianta tecnica quotata. Preservare questi progressi.
Richiesta finale: quantitativi senza stime economiche nel planner, mantenendo utile il calcolo trasferta. Migliorare progressivamente leggibilità delle etichette, facilità di taglio/riutilizzo e precisione. Non dichiarare supportati ritagli irregolari senza implementarli e testarli.

## Spese posa → ricavi/conto posa
Implementata sincronizzazione tramite sourceOrderId/sourceExpenseId. Spese aggiunte/modificate/eliminate nella posa si riflettono nel conto collegato. Importo e descrizione si gestiscono nella posa, pagatore modificabile e conservato nel conto. Righe manuali indipendenti; non deduplicare arbitrariamente righe con importi uguali.
Da collaudare in staging: collegamento richiesta, aggiornamenti, pagatore, salvataggio, ricaricamento e PDF. La presenza di spese non deve creare automaticamente un conto.

## Fornitori: PDF → bozza → verifica → salvataggio
Implementazione locale PDF.js, senza invio a servizi esterni. Compila campi vuoti e righe, non sovrascrive dati manuali. Conferma di verifica, gestione duplicati e permessi office. PDF scansionati richiedono ancora OCR, non implementato.
File principali: lib/supplier-invoice.js, lib/supplier-invoice-extract.js, lib/supplier-invoice-worker.js, app.js, server.js. Test: test/supplier-invoice*.test.js.
Proforma prato a blocchi verificata su documento reale (9 prodotti). Correzione successiva Tover: intestazioni Val.Unit./Q.ta'/%Sc., colonne centrate, data e numero su riga successiva; prezzi unitari a quattro decimali accettati dal modulo. Documento reale non incluso nel repository.
Tover contiene due materiali e trasporto: preservare kg/pezzi originali, non convertire automaticamente peso confezione in quantità. Importi estratti sono unitari, non totali IVA inclusa. Verificare altri layout, sconti, righe su più pagine e precisione dei prezzi mostrati; non promettere riconoscimento universale.
L'utente ha precisato che “1 mq” sulle righe prato è una sua modifica manuale, non un errore di estrazione.

## Prossime priorità
1. Collaudo end-to-end autenticato dei due flussi e persistenza dopo riavvio/ricaricamento.
2. Estendere importazione su fatture rappresentative, mantenendo fallback manuale chiaro; decidere OCR solo dopo necessità concreta.
3. PDF del generatore commerciale: richiesta di mettere in primo piano totale chiavi in mano, non prezzo al mq. Distinto dall'export quantitativo Garden Planner. Verificare implementazione attuale prima di modificarlo: completamento non confermato in questa fase.
4. Collaudo trasversale CRM: navigazione desktop/mobile, stati vuoti/errori, sovrapposizioni e passaggi ridondanti.

## Verifica e pubblicazione
Eseguire npm run build e npm run check. Coordinare le versioni shell/cache quando cambia il frontend. Consultare git status/log prima di intervenire: l'utente ha pubblicato personalmente i commit precedenti. Non caricare documenti reali di prova nel CRM senza istruzione; usare fixture sintetiche nei test. Non includere credenziali o fatture nel repository.

## Ulteriore esempio Wueffe
PDF di ordine cliente, non fattura: riconosce 150 confezioni a 6,38 euro/confezione e conserva nota “Totale pz = 15.000” nella descrizione. Avviso con riferimento ordine, senza riempire numero/data fattura con quelli dell'ordine. Non convertire prezzo per confezione in prezzo per pezzo implicitamente. Test sintetico dedicato aggiunto. Le correzioni Tover/Wueffe richiedono pubblicazione separata rispetto ai commit già eseguiti dall'utente.

## Conferma ordine Tekcnoplast
Aggiunto riconoscimento tabella “Descrizione dei beni” su tre pagine, continuazioni descrittive anche fra pagine, sconti successivi ed extra sconto. Prezzo netto = importo riga / quantità, dopo verifica matematica degli sconti rispetto al prezzo lordo. Documento reale: 32 righe a pagamento, somma 4.153,67 euro coerente con il netto documento. Omaggi/righe a zero esclusi dal listino con avviso; documento ordine distinto dalla fattura. Test sintetico copre anche importi incoerenti. Non è un riconoscitore universale: altri layout e scansioni restano da verificare.

## Direzione aggiornata: nessuna API AI, unità di confronto per prodotto
Il fornitore selezionato è autorevole: il PDF non compila più fornitore, numero e data. Estrazione delle righe con conversione proposta e conferma prima del salvataggio. Banda di giunzione 25 cm × 25 m: €/rotolo, NON €/mq. Telo isolante: €/metro lineare (interpretazione esplicitata all'utente). Prato €/mq, picchetti €/pezzo, colla €/kg, vasi €/pezzo.
Conversioni locali basate su descrizioni e quantità esplicite: confezioni picchetti con totale pezzi; confezioni colla con peso; telo in rotoli con lunghezza. Quantità e prezzo si trasformano insieme preservando il valore acquistato. Equivalenze mancanti: valori originali conservati e avviso. Le proposte vengono riportate nella nota modificabile e i prezzi nel confronto mostrano fino a sei decimali.
Non esiste ancora un archivio configurabile di equivalenze per codice articolo/fornitore: le regole correnti sono automatiche, basate sui prodotti. Non attribuire al sistema apprendimento automatico dalle correzioni manuali. Lettura scansioni/OCR e problema di errore generico sul server restano da diagnosticare separatamente.

## Generatore commerciale — 29 settembre
Aggiornata la proposta in preventivo-v2.html: totale chiavi in mano in primo piano per fornitura+posa, totale fornitura per sola fornitura. Superficie e IVA accanto al totale; equivalente al mq secondario. Nessuna modifica ai calcoli. Anteprima browser verificata e comando export eseguito; file PDF scaricato non reperito per ispezione autonoma, quindi verifica del PDF finale ancora da completare. Restano collaudo autenticato spese posa/conto/export e persistenza CRM. Modifiche locali non pubblicate.

## Generatore commerciale completato — 29 settembre (seconda sessione)
Completato il redesign approvato (rif. `docs/CLAUDE-PREVENTIVO-NEXT.md`, riferimento grafico `output/pdf/anteprima-preventivo-elegante.pdf`) e integrato l'allegato Garden Planner nel generatore reale, non in un mockup.

**Foto prodotto (1-3, pagina 1)**: riquadro a proporzioni costanti (`aspect-ratio`), `object-fit:contain` — mai stirate/ritagliate. Placeholder esplicito (icona) se l'immagine manca o l'URL non carica, mai un riquadro vuoto. Un prodotto: foto e proposta affiancate su tutta la larghezza pagina (griglia 2 colonne). Due/tre prodotti: foto in banner 16:10 in cima a ogni scheda. Verificato con foto reali dal catalogo, immagine mancante e nome prodotto molto lungo.

**Pagina 1 alleggerita**: card con solo totale dominante (chiavi in mano / fornitura secondo modalità) + equivalente al m² secondario. Materiali/accessori/lavori extra spostati in pagina 2; al loro posto una sintesi condivisa "Cosa comprende / Da sapere" costruita SOLO da dati reali già nel payload (mai servizi/garanzie inventate).

**Pagina 2 arricchita**: prodotto+caratteristiche, certificazioni, materiali con quantità reali (+ riga Trasporto), preparazione/posa (se prevista), accessori, lavori extra, condizioni generali — estese con due voci reali "Incluso"/"Escluso" (l'esclusione, se presente, è la stessa frase sullo smaltimento terreno già usata nei passi di posa, mai una nuova affermazione). Toggle "Schede tecniche" invariato nel comportamento, ora aggiorna l'anteprima già aperta senza dover rigenerare.

**Allegato Garden Planner (nuovo)**: seconda spunta indipendente "🌱 Progetto Garden Planner" in toolbar, disabilitata se non esiste alcun progetto nel bridge locale. Quando un disegno esiste ma non è verificabilmente aperto dalla richiesta CRM selezionata (`sourceRequestId` — nuovo campo, propagato da `garden-planner-page.js` → bridge → `app.js`), la pagina 3 mostra uno stato esplicito e NON allega automaticamente l'ultimo disegno aperto nel browser (collaudato dal vivo in modalità libera: stato "non associato" corretto). Quando associato, inietta il report client REALE già prodotto dal planner (stesso motore/CSS testato, non ricostruito qui) — tavola quotata, legenda, superfici nette/escluse, nessun prezzo. Numerazione pagine dinamica (1, 1+2, 1+3 o 1+2+3), nessun foglio bianco.

**Fix overflow PDF**: il vecchio export tagliava in silenzio (`Math.min(H, …)`) il contenuto oltre un foglio A4. Ora, prima della cattura, ogni `.page` (e la tavola Garden Planner) viene ridotta con `zoom` uniforme se il contenuto naturale supera un A4 — stessa tecnica già in produzione per il report Garden Planner. Verificato che scatta davvero su un caso realistico (pagina 2 con 3 prodotti densi → zoom automatico ~0.84, prima sarebbe stata tagliata senza avviso).

**Bug scoperto e corretto en passant**: l'evento di telemetria `quote_template_generate` (già esistente, non introdotto in questa sessione) non era nella whitelist server (`USAGE_EVENT_TYPES` in server.js) → 400 silenzioso a ogni apertura anteprima. Aggiunto alla whitelist.

**Verificato**: preview browser diretto (1/2/3 prodotti, con/senza schede tecniche, con/senza Garden Planner, associato/non associato/non disponibile) via payload realistici; flusso REALE end-to-end attraverso la form nativa (sola fornitura 1 prodotto, fornitura+posa 2 prodotti, Garden Planner in modalità libera → "non associato" confermato dal vivo); `npm run check` verde (208 test, incluso un nuovo test per `sourceRequestId`); nessun errore console nuovo. **Non verificato**: associazione con una richiesta CRM reale (questo ambiente locale non ha Postgres collegato: "Database CRM non collegato", nessuna richiesta reale disponibile per il collaudo — il meccanismo è verificato nei due estremi, libero/non-associato e associato-sintetico, ma non con due ID richiesta reali che combaciano) e ispezione pixel del PDF scaricato (nessun tool di rasterizzazione PDF disponibile in locale; verificato invece via DOM/calcolo — gli stessi valori che html2canvas catturerebbe — e via screenshot del rendering).

**Non toccato in questo giro**: codice morto preesistente in preventivo-v2.html (`table.mt`, `renderHeader`, `renderPriceCards`, `productThumb`, classi `.mat`/`.mat-hdr` da un'iterazione precedente del redesign) — lasciato per non allargare la superficie di rischio, da ripulire in un passaggio dedicato.

Modifiche locali, non pubblicate: richiede autorizzazione esplicita per commit/push.
