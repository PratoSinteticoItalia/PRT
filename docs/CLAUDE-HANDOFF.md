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
