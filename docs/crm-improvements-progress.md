# Evoluzione CRM — stato del lavoro

## 1. Spese posa → conti/ricavi posa

Implementato nel branch `codex/crm-linked-installation-expenses`:

- Quando si collega una commessa, le spese presenti nella scheda posa compaiono nel conto.
- Gli identificativi della commessa e della spesa evitano importazioni ripetute.
- Importi e descrizioni restano gestiti dalla scheda posa; aggiunte, modifiche e rimozioni si riflettono nel conto.
- Il pagatore resta selezionabile nel conto e viene conservato. Le spese di trasferta squadra vengono inizialmente attribuite al collaboratore, con avviso di verifica.
- Le righe manuali rimangono indipendenti. Per i vecchi conti l'utente verifica eventuali doppioni manuali: non si deduplicano importi uguali arbitrariamente.
- Storico, saldi e PDF utilizzano le spese collegate; il server rilegge le spese della commessa prima dell'export.
- La sola presenza di spese non crea un nuovo conto: il primo salvataggio resta esplicito.

Validazione: test su idempotenza, aggiornamenti/rimozioni, pagatore, isolamento fra commesse, normalizzazione server e aggiunta righe manuali; controllo visivo delle righe in un'anteprima con dati sintetici. Collaudo autenticato del flusso completo ancora da eseguire.

## 2. Fornitori: carica fattura → controlla → salva

Implementata una prima lettura dei PDF digitali con PDF.js 6.3.289 (Node >=22.13), senza servizi esterni.

- Pulsante di caricamento in apertura del modulo nuova fattura.
- Estrazione in worker separato: massimo 8 MB, 20 pagine, 20 secondi, due letture contemporanee per processo.
- Riconoscimento conservativo di fornitore, numero, data e colonne descrizione/quantità/unità/prezzo unitario.
- Compilazione dei campi vuoti; nessuna sovrascrittura delle righe già compilate. Un fornitore discordante blocca la compilazione automatica.
- Documento apribile per confronto, testo estratto consultabile e conferma di revisione prima del salvataggio.
- Unità sconosciute restano da scegliere, sconti e campi non riconosciuti sono segnalati. Righe incomplete non vengono salvate parzialmente.
- Controllo duplicati per fornitore/numero/data, inclusi invii contemporanei nello stesso processo.
- Le scansioni senza testo vengono segnalate: OCR non implementato. Layout con intestazioni non riconosciute richiedono compilazione manuale; serve collaudo su fatture reali dei fornitori.

Validazione: PDF sintetici reali, file corrotti/protetti/lunghi, separatori numerici, date, righe e colonne; permessi office-only; conservazione campi manuali; duplicati; controllo visivo della bozza. Non ancora pubblicato né collaudato con fatture reali.

## 3. Collaudo trasversale

Dopo i due flussi: verificare scheda cliente → posa → conto, navigazione mobile, errori e stati vuoti, persistenza dopo ricaricamento. Il Garden Planner resta il punto già avanzato; non viene ridisegnato in questa fase.

### Collaudo proforma internazionale (28 settembre)
- Verificato localmente un PDF reale su due pagine, senza registrazione in CRM: nove prodotti riconosciuti, quantità complessiva 8.540 mq e somma righe 33.643,20 euro coerenti con il documento.
- Supportati blocchi prodotto con descrizioni tecniche su più righe, etichetta SELLER, numero PI, data inglese e importi con separatori internazionali. Esclusi acconto e saldo dalle righe materiali; controllo quantità × prezzo rispetto al totale riga.
- Avvisi espliciti per proforma e valuta contraddittoria nelle condizioni. Fixture di regressione sintetiche, senza includere il documento del cliente nel repository.
- Modifiche locali, non pubblicate.
