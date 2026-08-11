# Percorso Anti Bug

Registro operativo per tracciare bug tecnici, problemi visuali, sovrapposizioni, bottoni non funzionanti, reload ambigui e comportamenti che fanno perdere fiducia nel software.

## Regole

- Un bug e chiuso solo quando e riprodotto, fixato, verificato e, dove possibile, coperto da test.
- Le priorita sono:
  - P0: blocca il lavoro o rischia dati.
  - P1: funzione, filtro, bottone o collegamento non funziona.
  - P2: visualizzazione errata, sovrapposizione, mobile rotto, reload ambiguo.
  - P3: rifinitura, microcopy, coerenza visuale.
- Ogni sweep deve includere almeno: desktop, mobile, refresh, filtri, ricerca, apertura dettaglio, collegamenti tra pagine, stati vuoti.

## Stato

| ID | Priorita | Area | Tipo | Problema | Riproduzione | Stato | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AB-001 | P2 | Dashboard | Layout | In alcune viste larghe resta molto spazio vuoto tra coda/dettaglio e moduli. | Dashboard, cambiare tab Vendite/Materiali/Soldi e scorrere la pagina. | Verificato desktop/mobile | Il dettaglio operativo e sticky nel codice attuale e resta visibile durante lo scroll. Sweep mobile finale senza overflow globale o elementi fuori viewport non scrollabili. |
| AB-002 | P2 | Richieste | Logica dati | La priorita puo sembrare casuale quando compaiono richieste molto vecchie, es. 62g o 217g. | Dashboard > Vendite/Richieste, ordinamento "urgenza". | Fixato, da verificare con DB reale | `sort=urgent` lato server ora ordina per azioni commerciali utili: follow-up 7-45g, nuove ferme, non assegnate, poi resto. |
| AB-003 | P1 | Richieste | Filtro | Filtro assegnazione Ivan/Gabriele non deve svuotare richieste assegnate. | Richieste > filtro assegnazione > Ivan/Gabriele. | Fixato e verificato in locale, da confermare con DB reale | 2026-08-11: normalizzazione condivisa client/server, filtro server tollerante su varianti tipo "Gabriele Todaro"; test unitari + browser select Ivan/Gabriele ok. In preview locale senza DATABASE_URL la lista CRM non mostra righe reali. |
| AB-004 | P1 | Richieste/Generatore | Collegamento | Aprire una richiesta nel generatore non deve perdere il contesto richiesta. | Richieste > apri richiesta > apri generatore. | Fixato e verificato a codice, da confermare con DB reale | 2026-08-11: richiesta collegata persistita per il generatore e ritorno diretto via `/api/sales/requests?id=...`; verifica browser completa limitata per assenza `localStorage` nel wrapper QA e assenza DATABASE_URL. |
| AB-005 | P2 | Global | Errori | Toast "Si e verificato un problema imprevisto" non deve ripetersi all'infinito per lo stesso errore. | Generare errore runtime ripetuto o navigare in vista che lancia stesso errore. | Fixato | Commit 5737737. |
| AB-006 | P2 | Materiali | Navigazione | La vista materiali deve collegarsi chiaramente alla pagina fornitori quando serve rifornimento/prezzo. | Dashboard > Materiali oppure Inventario > materiali a rischio. | Fixato e verificato | In Dashboard > Materiali ora appare il CTA Fornitori nella toolbar alta e apre `#supplier-prices` senza toast/errori. |
| AB-007 | P1 | Global | Reload/cache | Primo avvio dopo bump shell poteva restare nello splash con auth/app nascosti se l'URL aveva gia la shell nuova ma `localStorage` quella vecchia. | Aprire una nuova versione con query `?shell=...` gia aggiornata e storage shell precedente. | Fixato e verificato | `ensureFreshShellVersion()` ora forza `location.reload()` quando il target e identico all'URL corrente. |
| AB-008 | P2 | Mobile/Global | Layout invisibile | Splash iniziale e drawer Spedizioni chiuso erano invisibili a occhio ma ancora misurabili dal DOM/hit-test. | Sweep mobile su viste multiple dopo apertura Spedizioni. | Fixato e verificato | `.shell-launch` e drawer Spedizioni/Campioni usano `visibility:hidden` quando inattivi; spariti dallo sweep finale. |
| AB-009 | P2 | Navigazione | Hash ambiguo | Un hash non permesso dal ruolo poteva lasciare URL e vista non allineati. | Office: da `#garden-planner` navigare a `#timesheet-me`. | Fixato e verificato | L'hash non permesso viene sostituito con la vista corrente/permessa. |
| AB-010 | P3 | Mobile | Bottom nav | La bottom-nav fissa poteva coprire il centro di controlli che cadevano esattamente sul bordo basso del primo viewport. | Mobile 390/430: Richieste, Generatore, Conti posa, Impostazioni; controlli comunque raggiungibili con scroll. | Fixato e verificato | Bottom-nav trasformata in riga reale del layout mobile (`topbar / main scrollabile / bottom-nav`), vecchio pill-shell disattivato anche dagli inline style, Presenze spostato a sinistra su mobile. |
| AB-011 | P2 | Garden Planner | Layout mobile | Iframe Garden Planner usciva di 12px a sinistra su mobile. | Aprire `#garden-planner` a 390/430px. | Fixato e verificato | Margine mobile dedicato: rect finale sinistra 0, destra pari al viewport, overflow 0. |
| AB-012 | P2 | Generatore | Layout mobile | Campo "Nr. Preventivo" troppo stretto con bottone "Nuovo", placeholder/contenuto tagliabile. | Aprire `#sales-generator` a 390/430px. | Fixato e verificato | Su <=640px il campo numero preventivo prende riga piena; sweep finale senza clipped text. |
| AB-013 | P2 | Dashboard/Pose | Navigazione | I collegamenti dashboard verso sottoviste Pose potevano aprire una pagina corretta ma senza contesto ordine o con filtri squadra vecchi. | Dashboard > Pose/Programmate, aprire "Calendario" o una riga Programmate. | Fixato e verificato | Shell `20260811-dashboard-pose-deep-links`: famiglia Pose unica, targetId portato nelle azioni Calendario, riga selezionata nelle sottoviste e reset filtro squadra quando si rientra alla board Pose. |
| AB-014 | P1 | Global | Navigazione | Link, azioni dashboard o `setView()` non devono puntare a viste/hash inesistenti. | Audit statico su `href="#..."`, `data-action` navigabili, factory dashboard, registro navigazione e ruoli. | Coperto da audit | `scripts/audit-ui-contracts.mjs` ora fallisce se un target navigabile non ha una `.view`/id DOM corrispondente. |

## Sweep Corrente

Data: 2026-08-10

Scope iniziale:
- Dashboard
- Richieste
- Generatore
- Inbox Ordini
- Pose
- Inventario/Materiali
- Contabilita/DDT

Esito: in corso.

Risultati desktop iniziali:
- Nessun crash console sulle viste principali.
- Nessun toast "problema imprevisto" persistente.
- Nessun overflow orizzontale globale rilevato.
- Preview locale senza `DATABASE_URL`: CRM richieste mostra messaggio dedicato invece di "zero risultati" fuorviante.

Risultati sweep mirato successivo:
- Dashboard, Fornitori, Richieste, Generatore, Inventario e Pose si aprono con shell montata.
- Nessun toast imprevisto, nessun `DEBUG-dbUnavailable`, nessun console error rilevante.
- Dashboard > Materiali > Fornitori verificato con click reale.

Risultati sweep mobile completo:
- 44 combinazioni vista/viewport verificate: 22 viste su 390x844 e 430x932.
- Nessun toast/alert imprevisto.
- Nessun overflow orizzontale globale.
- Nessun elemento visibile fuori viewport non scrollabile dopo i fix AB-008 e AB-011.
- Nessun testo tagliato negli elementi interattivi dopo il fix AB-012.
- Nessun mismatch di rotta valido; `#timesheet-me` su utente office e negato dal ruolo e ora riallinea l'hash alla vista corrente.

Risultati sweep mobile finale AB-010:
- 24 combinazioni vista/viewport verificate: 12 viste su 390x844 e 430x932.
- Nessuna copertura reale di controlli visibili da bottom-nav o pallino Presenze.
- Bottom-nav flush al fondo viewport, `mobile-pill-shell` non visibile, `main-content` scrollabile.
- Nessun toast/alert imprevisto e nessun overflow orizzontale globale.

Sprint efficienza CRM/generatore 2026-08-11:
- Shell aggiornata a `20260811-crm-flow-hardening`.
- Filtro assegnazione Richieste verificato in browser su Ivan/Gabriele: il select mantiene il valore scelto e non torna a "Tutte".
- Preview locale senza `DATABASE_URL`: messaggio CRM dedicato confermato, nessun toast imprevisto.
- Nuova utility `lib/sales-assignment.js` coperta da test unitari: varianti, alias, filtri e dedup opzioni.
- `npm run check`: 107 test passati.
- `npm run build`: completata senza errori.

Sprint dashboard deep-link Pose 2026-08-11:
- Shell aggiornata a `20260811-dashboard-pose-deep-links`.
- Dashboard > Materiali > Fornitori: click reale verificato, apre `#supplier-prices` senza toast/errori console.
- Dashboard > metrica Pose prossime: click reale verificato, apre `#installations-scheduled` con lista renderizzata.
- Programmate > riga ordine: click reale verificato, torna a `#installations` con dettaglio ordine corretto.
- Dashboard > dettaglio operativo > Calendario: click reale verificato, porta il `targetId` alla vista Pose corretta.
- `npm run check`: 107 test passati.
- `npm run build`: completata senza errori.

Sprint contratti UI 2026-08-12:
- Esteso `scripts/audit-ui-contracts.mjs` per bloccare azioni `data-action` non gestite.
- Esteso `scripts/audit-ui-contracts.mjs` per bloccare target navigabili inesistenti: hash DOM, `setView()`, `open-dashboard-view`, `select-order`, registro sidebar/mobile e viste per ruolo.
- `npm run check:ui-contracts`: completato senza errori.
