# Verifica affidabilità — 16 settembre 2026

Ambito: revisione del codice server e dei flussi di aggiornamento client, simulazione di guasti e concorrenza, controlli automatici del repository. Non è un collaudo completo del prodotto in produzione. Nessun dato operativo modificato durante questa verifica.

## Difetti corretti in questa revisione

| Priorità | Difetto verificato nel codice | Correzione e verifica |
| --- | --- | --- |
| P0 | Sync Shopify manuale e pianificato riscrivono il documento letto prima delle chiamate esterne: modifiche concorrenti possono sparire. | Rilettura dentro il lock, fusione dei soli metadati di sync, separazione delle impostazioni dalla cache durante la rete. Test del sync pianificato con modifica concorrente e test di conservazione delle impostazioni. |
| P1 | Un salvataggio fallito lascia in cache l'oggetto modificato. | Invalidazione su errore e pubblicazione cache/notifica dopo persistenza; test sia PostgreSQL simulato sia filesystem simulato. Non risolve ancora ogni lettura di oggetti condivisi durante una scrittura. |
| P1 | Il lock tra istanze non garantisce la freschezza della cache: la notifica può arrivare dopo il lock. | Invalidazione quando il lock è acquisito; test dedicato. Serve misurare il costo della riconciliazione dopo invalidazione. |
| P1 | Un errore di sblocco restituisce al pool una connessione potenzialmente ancora proprietaria del lock. | Connessione scartata se unlock fallisce; test con errore simulato. |
| P1 | Chiamate concorrenti all'inizializzazione possono creare più pool. | Promise condivisa durante l'inizializzazione; test con tre chiamate concorrenti. |
| P1 | Il percorso rapido di inserimento inventario restituisce false in caso di errore DB ma il chiamante termina senza inviare risposta. | Risposta HTTP 503 esplicita, invalidazione cache. Nessun fallback dopo aver consumato il body e nessun reinserimento automatico di un'operazione dal risultato incerto. Test con query che fallisce. |

Già pubblicato prima di questa verifica: ec9ff6c elimina riconnessioni duplicate del listener PostgreSQL. Il cambio password è stato confermato funzionante dall'utente.

## Problemi aperti: non considerarli risolti dai test attuali

1. **P0 — Doppia persistenza non atomica.** `upsertOrderToDb` e `upsertInventoryItemToDb` possono registrare un errore senza propagarlo. Diverse route scrivono prima app_documents e poi le tabelle relazionali, talvolta senza attesa. Le letture utilizzano anche queste tabelle: un successo parziale può riapparire come un annullamento. Occorre scegliere una fonte autorevole e usare transazioni o un outbox persistente ordinato per entità; ritentare interi vecchi documenti può sovrascrivere aggiornamenti nuovi.
2. **P0 — Scritture asincrone di notifiche/push.** `sendPushToUser` e la persistenza `storeNotifications` riscrivono il documento completo senza passare sempre dal lock. Possono conservare riferimenti vecchi durante attese esterne. Occorre separare la persistenza delle notifiche e aggiornare solo la sezione necessaria, evitando lock annidati.
3. **P1 — Attesa lock e pool piccolo.** Il pool ha massimo quattro connessioni; i chiamanti con `queue:false` possono occuparle aspettando un lock, mentre il titolare necessita di altre connessioni per completare. Da verificare con PostgreSQL e richieste concorrenti, poi rilasciare le connessioni tra i tentativi o dedicare un canale limitato ai lock.
4. **P1 — Cache SQL e scritture in corso.** L'invalidazione prima della scrittura e letture concorrenti possono ripopolare la cache con risultati precedenti. Le notifiche aiutano ma non costituiscono una garanzia di ordinamento. Servono generazioni/versioni delle letture e test di concorrenza.
5. **P1 — Logout su errore transitorio.** `keepSessionAlive` trasforma in null il fallimento della sessione di conferma e può mostrare il login senza che sia stata confermata una sessione scaduta.
6. **P1 — Errore di aggiornamento dopo salvataggio riuscito.** `updateManagedAccount` include il successivo `reloadAll` nello stesso catch del salvataggio: un errore di refresh può apparire come mancato salvataggio. Separare esito persistito e refresh.
7. **P1 — Risposte client fuori ordine.** Più percorsi applicano interi snapshot della sessione senza un controllo comune della sequenza delle richieste. Da riprodurre con rete ritardata e modifica utente tra richiesta e risposta.
8. **P1 — Operazioni dal risultato incerto.** Un timeout dopo commit può indurre a reinserire inventario o altre entità. Servono chiavi di idempotenza e messaggi che distinguano errore certo da conferma non ricevuta.

## Verifiche e limiti

Nove nuovi test con dipendenze simulate coprono persistenza, lock, inizializzazione pool, sync e risposta inventario. Suite complessiva: 129 test. Controlli sintattici, asset generati, versioni shell e contratti UI passati.

Non sono disponibili in questa sessione un server PostgreSQL locale, Docker o un ambiente di collaudo identificato. Non sono stati effettuati test di carico, arresti del database, verifiche multi-istanza reali o un nuovo sweep desktop/mobile. Le correzioni necessitano di questo collaudo prima di una pubblicazione generale.

## Collaudo necessario su ambiente separato

- Due utenti modificano campi diversi durante un sync Shopify: entrambi persistono dopo refresh e riavvio.
- Quattro o più scritture concorrenti, incluse inventario e comunicazioni: nessuna attesa circolare del pool.
- Errore DB prima e dopo commit: nessun falso successo, nessun duplicato al retry.
- Caduta del listener e ripristino: una connessione listener per istanza, cache coerenti.
- Fallimento della seconda scrittura: rilevamento della divergenza tra documento e tabelle, recupero senza sovrascrivere dati recenti.
- Rete lenta e risposte riordinate: nessun ritorno a stati precedenti, nessun logout per indisponibilità temporanea.
- Desktop e mobile: login, ordini, inventario, pose, CRM, account, filtri, dettagli, refresh e stati vuoti.
