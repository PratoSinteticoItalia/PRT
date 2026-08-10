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
| AB-001 | P2 | Dashboard | Layout | In alcune viste larghe resta molto spazio vuoto tra coda/dettaglio e moduli. | Dashboard, cambiare tab Vendite/Materiali/Soldi e scorrere la pagina. | Verificato su desktop | Il dettaglio operativo e sticky nel codice attuale e resta visibile durante lo scroll. Da ricontrollare su mobile. |
| AB-002 | P2 | Richieste | Logica dati | La priorita puo sembrare casuale quando compaiono richieste molto vecchie, es. 62g o 217g. | Dashboard > Vendite/Richieste, ordinamento "urgenza". | Fixato, da verificare con DB reale | `sort=urgent` lato server ora ordina per azioni commerciali utili: follow-up 7-45g, nuove ferme, non assegnate, poi resto. |
| AB-003 | P1 | Richieste | Filtro | Filtro assegnazione Ivan/Gabriele non deve svuotare richieste assegnate. | Richieste > filtro assegnazione > Ivan/Gabriele. | Fixato, da verificare con DB reale | In preview locale senza DATABASE_URL la lista CRM non mostra righe reali. |
| AB-004 | P1 | Richieste/Generatore | Collegamento | Aprire una richiesta nel generatore non deve perdere il contesto richiesta. | Richieste > apri richiesta > apri generatore. | Fixato, da verificare con DB reale | Verifica locale limitata da assenza DATABASE_URL. |
| AB-005 | P2 | Global | Errori | Toast "Si e verificato un problema imprevisto" non deve ripetersi all'infinito per lo stesso errore. | Generare errore runtime ripetuto o navigare in vista che lancia stesso errore. | Fixato | Commit 5737737. |
| AB-006 | P2 | Materiali | Navigazione | La vista materiali deve collegarsi chiaramente alla pagina fornitori quando serve rifornimento/prezzo. | Dashboard > Materiali oppure Inventario > materiali a rischio. | Aperto | La pagina Fornitori esiste e i link sono presenti, ma nella dashboard materiali alcuni CTA possono finire sotto fold/scroll interno. Da rendere piu evidente. |

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
