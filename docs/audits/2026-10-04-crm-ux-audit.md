# Audit CRM — 4 ottobre 2026

## Perimetro e limiti
Ispezione in lettura della sessione autenticata del portale: Inbox Ordini, Richieste, Conti posa, Fornitori, Confronto per materiale, Inventario, Spedizioni e Dashboard. Confronto con il codice locale. Nessun ordine, contatto, importo o stato modificato. Non eseguiti invii, importazioni o salvataggi in produzione.
I numeri sono una fotografia della sessione; non costituiscono statistiche storiche o misure di latenza. I target sotto sono proposte di accettazione, non prestazioni già misurate.

## Priorità 1 — Affidabilità delle decisioni

### A. Confronto fornitori: unità e significato del confronto
Evidenza nel codice: app.js, computeSupplierPriceComparison (circa riga 15852) raggruppa per nome materiale e fornitore, calcola la media dei prezzi e prende l'unità dall'ultima riga. L'unità non fa parte della chiave e non viene convertita. Con lo stesso nome acquistato a kg e a confezione, il confronto può quindi mescolare basi diverse. Rischio dimostrato dalla logica; non accertato che i dati attuali contengano già questo caso.
Evidenza UI: badge “più conveniente” anche per materiali con un solo fornitore e una sola voce. renderSupplierPriceCompareHtml lo attribuisce sempre a idx===0.
Fix: confrontare soltanto unità equivalenti; conversione solo con fattore esplicito. Distinguere ultimo prezzo da media storica; badge solo con almeno due offerte confrontabili, gestione pari merito e data di aggiornamento.
Accettazione: zero confronti fra unità incompatibili; zero badge vincitore con un solo fornitore; test kg/confezione, mq/rotolo, pari merito, prezzo mancante.

### B. Richieste: contatori di ambito non coerente
Evidenza UI: KPI Totale 7.950; paginazione 8.559 richieste (172 pagine). Differenza 609. Il filtro era Tutte/Tutti gli stati. I filtri rapidi mostravano 27 “Questa settimana” e 28 “Fornitura + posa”, mentre la toolbar usa baseItems=pageItems (app.js circa 14660). KPI e pagina hanno fonti distinte: salesRequestsStats e crmServerPage.total.
Fix: allineare filtri, definizione di record e istante dei conteggi; esplicitare eventuale esclusione di archivi/duplicati. I filtri rapidi devono contare l'intero insieme filtrabile, non soltanto la pagina.
Accettazione: differenza zero fra lista e KPI a parità di ambito; conteggi invariati cambiando pagina; timestamp comune. Indagare le query prima di correggere o eliminare dati.

### C. Ordini e spedizioni: falsi prossimi passi
Evidenza UI: più ordini CHIUSI riportano “Indirizzo da completare”; ordini ritirati/spediti mostrano ancora “Preparare entro” con allarme di ritardo.
Codice: getNextOrderAction (app.js circa 10130) controlla indirizzo prima di isOrderClosed.
Fix: precedenza dello stato terminale, requisiti indirizzo coerenti con ritiro/consegna; scadenze concluse nello storico, non negli allarmi operativi.
Accettazione: zero richieste di preparazione su ordini chiusi; i ritiri non producono blocchi di consegna non pertinenti. Test chiuso/ritiro/corriere/posa.

## Priorità 2 — Chiarezza dei flussi

### D. Conti posa: bozza vuota presentata come perdita reale
Evidenza UI: ricavo vuoto, fisso 100 euro, 1 giornata; utile -100, quota titolare -50 e saldo collaboratore 50. La quadratura è corretta matematicamente, ma il risultato appare utilizzabile prima dell'inserimento dei dati.
Codice: getDefaultProfitSplitDraft (app.js circa 1039).
Fix: stato iniziale “Completa ricavo e collaboratore”; distinguere campo vuoto da zero esplicito; riepilogo simulazione finché incompleto. Associare il conto tramite ricerca commessa, non soltanto all'ordine precedentemente selezionato nell'Inbox: nella prova era proposta una campionatura.
Accettazione: zero saldi definitivi da input incompleti; selezione commessa direttamente dal conto; test passaggio bozza/commessa e assenza duplicazione spese.
Da collaudare separatamente: persistenza e sincronizzazione spese posa ↔ conto; qui non sono state eseguite scritture.

### E. Stati commerciali e prossima azione
Evidenza UI: nella stessa scheda compaiono “Nuova” nella lista e “new” nella select. La select contiene circa 19 voci, mescolando stadi (preventivo inviato), azioni (Chiamare), canali (Email), esiti (NESSUNA RISPOSTA).
Fix: separare fase commerciale, ultima attività/esito e prossimo richiamo con data/responsabile; mappatura retrocompatibile dei valori storici.
Accettazione: zero codici tecnici visibili; ogni richiesta attiva ha fase e prossima azione distinguibili. KPI proposti: percentuale assegnata, tempo al primo contatto, richiami scaduti, conversione per coorte.
Baseline UI: 560 da assegnare; 1.553 ferme da oltre 5 giorni; 2.689 preventivi inviati. Non usare queste cifre come conversione finché non si riconciliano i conteggi.

### F. Inventario: classificazione fisica e segnali scorta
Evidenza UI: Abete 45 mostra 19 pezzi da 2×25 m sotto “Residui”; potrebbe essere classificazione storica intenzionale, da verificare sui movimenti. Totali arrotondati: per esempio 27,8 mq rappresentati come 28 mq nel riepilogo.
Dashboard segnala 13 rischi materiali, Inventario 0 sotto scorta: non è necessariamente errore, perché domanda scoperta e soglia scorta sono concetti diversi, ma occorre dichiararlo.
Fix: tipo pezzo esplicito con provenienza; precisione coerente a 1–2 decimali; distinguere fisico, impegnato, disponibile e fabbisogno scoperto. Link dal rischio al dettaglio che spiega il calcolo.
Accettazione: disponibilità riconciliabile ai pezzi; zero cambiamenti automatici di classificazione senza provenienza; ogni rischio espone quantità mancante e ordine.

### G. Filtri accessibili
Evidenza codice: i due campi data del confronto fornitori non hanno label/aria-label (renderSupplierPriceFiltersHtml circa 15920); nella lettura accessibile risultano due textbox senza nome.
Fix: etichette visibili “Dal”/“Al”, associazione label-input e stato filtri azzerabile.
Accettazione: tutti i campi del flusso identificabili da tastiera e nome accessibile.

## Prestazioni: baseline da raccogliere prima delle ottimizzazioni
Dimensioni codice locale: app.js 37.689 righe, server.js 20.630, styles.css 28.532. Bundle JS minificato circa 1,05 MB e CSS circa 514 KB dai build precedenti: dimensioni file, NON byte trasferiti compressi e NON tempi utente.
Questo suggerisce una verifica del caricamento per sezione, non prova da solo un rallentamento.
Raccogliere almeno 30 campioni su desktop e mobile: navigazione→contenuto pronto, ricerca→risultati, salva→conferma persistita, errori/retry e peso trasferito.
Target iniziali proposti: p95 ricerca <500 ms; p95 apertura vista calda <1 s; p95 conferma salvataggio <2 s sulla rete di riferimento. Separare attesa rete, rendering e server. Nessun dato personale nei log di misura.
Provare su staging: doppio click, rete interrotta, retry, refresh dopo salvataggio, due sessioni concorrenti. Zero perdite e zero duplicazioni nei casi di test.

## Ordine di lavoro consigliato
1. Confronti fornitori corretti, contatori riconciliati, allarmi ordini chiusi.
2. Stato incompleto Conti posa, selettore commessa, verifica trasferimento spese.
3. Fasi commerciali e richiami, indicatori inventario comprensibili.
4. Misure prestazioni e interventi guidati dai risultati.
Non modificare o migrare record storici senza prima verificare mappatura e reversibilità.

## Implementazione locale — 5 ottobre 2026
Primo blocco completato, non pubblicato:
- Confronti separati per unità. Badge «Migliore media storica» soltanto con almeno due fornitori con prezzi validi; pari merito gestiti. Nessuna conversione implicita fra confezioni e kg.
- Richieste: statistiche DB richieste a ogni caricamento lista; la sessione non sovrascrive quelle già caricate. Cache statistiche aggiornata se diverge dal conteggio della lista non filtrata. I filtri senza conteggio globale restano disponibili senza badge, anziché esporre il conteggio della sola pagina.
- Ordini chiusi: precedenza allo stato terminale rispetto all'indirizzo mancante. Spedizioni concluse: nessun allarme di preparazione scaduta.
- Versione cache 20261005-crm-audit-priorities; build e controlli completi superati, 252 test (5 nuovi casi di regressione).
Da verificare su staging: riconciliazione con dati reali dopo import e aggiornamento sessione. Le query concorrenti non costituiscono uno snapshot transazionale: durante scritture contemporanee una differenza temporanea è ancora possibile. Non sono state modificate le regole indirizzo dei ritiri aperti, né affrontati i punti D–G.

## Secondo lotto locale — 5 ottobre 2026
- Conti posa: ricavo assente distinto da zero esplicito; niente saldi definitivi né esportazione/salvataggio prima del ricavo. Spese e fisso rimangono nella bozza.
- Inventario: schede con quantità fino a due decimali, evitando arrotondamenti all'intero sui metri quadri disponibili, impegnati e richiesti.
- Richieste: etichette leggibili per i codici standard nel selettore, conservando valori e stati personalizzati.
- Fornitori: etichette associate e sempre visibili per ricerca fornitore/materiale e intervallo date.
- Verifica: build e check completi, 255 test superati. Nessuna modifica ai dati di produzione.

### Restano da implementare
- Selezione diretta della commessa nei Conti posa con protezione della bozza non salvata.
- Separazione strutturale tra fase commerciale, attività e prossimo contatto: le sole etichette non risolvono questo punto.
- Provenienza dei residui storici e distinzione esplicativa tra fabbisogno e sottoscorta.
- Misure prestazionali reali: nessun miglioramento di latenza viene dichiarato in questo lotto.

### Protocollo di misurazione
Usare staging con dati rappresentativi e stesso dispositivo/browser/rete. Registrare 30 campioni per navigazione a caldo, ricerca e salvataggio; distinguere richieste fallite da lente. Riportare mediana e p95 (campione ordinato in posizione ceil(0,95*n)), numero di errori e dimensione del dataset. Obiettivi iniziali: navigazione a caldo <1 s, ricerca <500 ms, salvataggio <2 s al p95. I salvataggi vanno misurati solo su record di prova, verificando anche persistenza dopo ricaricamento. Non registrare credenziali, contenuti dei clienti o URL con query personali.
