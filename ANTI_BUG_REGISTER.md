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
| AB-003 | P1 | Richieste | Filtro | Filtro assegnazione Ivan/Gabriele non deve svuotare richieste assegnate. | Richieste > filtro assegnazione > Ivan/Gabriele. | Fixato, da verificare con DB reale | In preview locale senza DATABASE_URL la lista CRM non mostra righe reali. |
| AB-004 | P1 | Richieste/Generatore | Collegamento | Aprire una richiesta nel generatore non deve perdere il contesto richiesta. | Richieste > apri richiesta > apri generatore. | Fixato, da verificare con DB reale | Verifica locale limitata da assenza DATABASE_URL. |
| AB-005 | P2 | Global | Errori | Toast "Si e verificato un problema imprevisto" non deve ripetersi all'infinito per lo stesso errore. | Generare errore runtime ripetuto o navigare in vista che lancia stesso errore. | Fixato | Commit 5737737. |
| AB-006 | P2 | Materiali | Navigazione | La vista materiali deve collegarsi chiaramente alla pagina fornitori quando serve rifornimento/prezzo. | Dashboard > Materiali oppure Inventario > materiali a rischio. | Fixato e verificato | In Dashboard > Materiali ora appare il CTA Fornitori nella toolbar alta e apre `#supplier-prices` senza toast/errori. |
| AB-007 | P1 | Global | Reload/cache | Primo avvio dopo bump shell poteva restare nello splash con auth/app nascosti se l'URL aveva gia la shell nuova ma `localStorage` quella vecchia. | Aprire una nuova versione con query `?shell=...` gia aggiornata e storage shell precedente. | Fixato e verificato | `ensureFreshShellVersion()` ora forza `location.reload()` quando il target e identico all'URL corrente. |
| AB-008 | P2 | Mobile/Global | Layout invisibile | Splash iniziale e drawer Spedizioni chiuso erano invisibili a occhio ma ancora misurabili dal DOM/hit-test. | Sweep mobile su viste multiple dopo apertura Spedizioni. | Fixato e verificato | `.shell-launch` e drawer Spedizioni/Campioni usano `visibility:hidden` quando inattivi; spariti dallo sweep finale. |
| AB-009 | P2 | Navigazione | Hash ambiguo | Un hash non permesso dal ruolo poteva lasciare URL e vista non allineati. | Office: da `#garden-planner` navigare a `#timesheet-me`. | Fixato e verificato | L'hash non permesso viene sostituito con la vista corrente/permessa. |
| AB-010 | P3 | Mobile | Bottom nav | La bottom-nav fissa puo coprire il centro di controlli che cadono esattamente sul bordo basso del primo viewport. | Mobile 390/430: Richieste, Generatore, Conti posa, Impostazioni; controlli comunque raggiungibili con scroll. | Aperto | Da trattare con redesign controllato del modello di scroll mobile, evitando di reintrodurre lo spazio vuoto in fondo gia corretto. |
| AB-011 | P2 | Garden Planner | Layout mobile | Iframe Garden Planner usciva di 12px a sinistra su mobile. | Aprire `#garden-planner` a 390/430px. | Fixato e verificato | Margine mobile dedicato: rect finale sinistra 0, destra pari al viewport, overflow 0. |
| AB-012 | P2 | Generatore | Layout mobile | Campo "Nr. Preventivo" troppo stretto con bottone "Nuovo", placeholder/contenuto tagliabile. | Aprire `#sales-generator` a 390/430px. | Fixato e verificato | Su <=640px il campo numero preventivo prende riga piena; sweep finale senza clipped text. |

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
- Residuo registrato in AB-010: bottom-nav fissa intercetta alcuni controlli nel bordo basso del primo viewport, ma restano raggiungibili con scroll.
