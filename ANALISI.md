# PSI Ops — Analisi funzionale & piano di miglioramento

**Data analisi**: 25 maggio 2026
**Lente**: operativa quotidiana
**Focus**: UX mobile, UX/efficienza desktop, robustezza, riduzione lavoro manuale

> Documento generato da analisi capitolo per capitolo con validazione utente.
> Non committato nel repo (lasciato in working tree come riferimento).

---

## Capitolo 1 — Mappa funzionale & ruoli

### 15 moduli (view registrate in `index.html`)

**Area Vendita (pre-ordine)**
- `sales-requests` — Pipeline lead, 17 stati, sync Google Sheets (office)
- `sales-generator` — Generatore preventivi PDF, React in iframe (office + crew)
- `sales-content` — Catalogo prodotti / contenuti (office)
- `marketing` — Pubblicazione contenuti via `/api/marketing/publish` (office, **attiva**)

**Area Operativa (post-ordine)**
- `orders` — Inbox ordini Shopify + manuali (office, warehouse)
- `warehouse` — Pezzi fisici, allocazione, suggerimento taglio (warehouse, office)
- `installations` — Scheduling squadre Alpha/Beta/Delta, Coverage Planner (office, crew)
- `shipping` — Tracking corrieri (warehouse, office)
- `communications` — Thread WhatsApp per cliente (tutti)

**Area Amministrativa**
- `accounting` — Tracking fatturazione (office)
- `profit-split` — Costi/margine per squadra (office, **bulk-assignment attivo**)
- `reseller-report` — Dashboard partner rivenditori (office)

**Strumenti & Config**
- `dashboard` — Panoramica real-time SSE (tutti)
- `garden-planner` — Tool calcolo giardino (office, crew)
- `settings` — Shopify, Sheets, tariffe, catalogo, branding (office)

### Use case operativi per ruolo (validati)

**office (Gabriele / Ivan)** — desktop principale, mobile occasionale
1. Dashboard mattutina, controllo nuovi ordini
2. Risposta richieste CRM, preventivi
3. Scheduling pose della settimana
4. Comunicazioni WhatsApp
5. Allocazione magazzino su ordini
6. Fatturazione fine giornata

**warehouse** — fisso ma mobile in piedi tra rotoli
1. Vedere ordini da preparare
2. Allocare pezzi fisici
3. Marcare pezzi pronti/spediti
4. Aggiornare tracking
5. Foto/note pezzi

**crew (Alpha/Beta/Delta)** — **100% mobile da cantiere**
1. Vedere pose assegnate
2. Navigazione verso cantiere
3. Foto cantiere
4. Stato installazione
5. Preventivo on-the-fly per upsell
6. WhatsApp con cliente

### Architettura dati esterna (flusso reale, aggiornato 26/05)

```
Cliente compila form su pratosinteticoitalia.com
    │
    ▼
Backend PHP del sito:
    ├─► calcola preventivo automatico (3 modelli a listino con prezzi/totali/IVA/spedizione)
    ├─► email al CLIENTE con preventivo
    └─► email a contatti@pratosinteticoitalia.it
        │
        ▼
    Make.com legge email da contatti@
        │
        ▼
    Google Sheets popolato
        │
        ▼
    Portale legge da Sheets (sync manuale al click)
```

**Sistemi paralleli che fanno preventivi**:
- PHP del sito → automatico, immediato, base (3 modelli a listino)
- Generatore portale → manuale, personalizzato, post-vendita follow-up

**Caselle email**:
- `contatti@pratosinteticoitalia.it` (richieste dal sito)
- `info@pratosinteticoitalia.it` (visto nel client mail dell'utente)

**Direzione strategica**: portale diventa source of truth, Sheets resta come view/verifica.

**Decisioni utente (26/05)**:
1. **PHP del sito INTATTO** — nessuna modifica, nessuna omologazione stile. Il preventivo PHP automatico al cliente resta com'è, prima identità commerciale.
2. **Architettura B — IMAP diretto al portale**. Migrazione safe-first in 5 fasi (vedi sotto), Make/Sheets restano in parallelo per settimane di shadow run.
3. Provider casella `contatti@`: Aruba/italiano (IMAP base con password, polling classico).
4. Shadow run direttamente su `contatti@` in sola lettura.

**Vincolo CRITICO dichiarato dall'utente**: "queste richieste sono l'anima dell'azienda, è importante che non ci sia rischio di perdere nulla". Niente big-bang, IMAP gira IN PARALLELO al sistema attuale per 30+ giorni prima di considerare di tagliare Make.

---

## Capitolo 2 — Audit mobile

### Problemi identificati

**Bug madre — Scroll teleport** (`app.js:7625-7645`)
Funzione che resetta `scrollTop` su 7 target diversi. Pensata per il cambio view, viene chiamata anche dopo refresh dati/SSE/update stato.

**Pattern lista→dettaglio rotto su mobile**
Architettura master-detail co-resident: lista E dettaglio entrambi visibili (grid 2-col desktop). Su mobile collassa in stack verticale → per vedere il dettaglio devi scorrere TUTTA la lista.

Moduli affetti: Richieste, Inventario, Ordini, Pose.

**Density / "ingombrante e poco dinamico"**
Card desktop con padding 16px usato anche su mobile, font desktop, toolbar/filter bar che rubano spazio, nessuna bottom action bar sticky.

**Generatore preventivi (React iframe)** — non responsive, bloccante per crew in cantiere.

### Cosa esiste già di mobile
- `applyMobileSafeMode()` sotto 980px
- 9 breakpoint CSS (360-980)
- Sidebar mobile con backdrop
- 30+ regole CSS dedicate

Ma applicato in modo incoerente, mancano i pattern mobile-first.

---

## Capitolo 3 — Pain points operativi

### Top pain: reportistica fine giornata crew (priorità #1)

**Oggi**: mix di WhatsApp / verbale / portale faticoso. Squadre mandano foto+audio, office trascrive a mano. ~30 min/giorno persi + dati persi (extra concordati dimenticati, foto sparse, profit-split stimato).

**Proposta**: modulo "Consuntivo Posa" mobile-first dentro il job stesso.
- Ore lavorate (inizio/fine auto-calc)
- Operatori presenti
- Materiali consumati (pre-popolati da ordine)
- Extra concordati in cantiere
- Foto cantiere
- "Conferma chiusura" → job=completed, R2 sync, alert fatturazione extra, profit-split pre-popolato, WhatsApp auto al cliente

### Altri pain confermati
- **Stato CRM aggiornato a mano** (5-10 min/giorno)
- **Sync Sheets non affidabile** (vedi capitolo 4 sezione dedicata)
- **Allocazione magazzino faticosa** (suggest c'è, commit macchinoso)

### Pain NON confermati
- Comunicazioni cliente con template (probabilmente gestito esternamente)

---

## Capitolo 4 — Robustezza & sync Sheets

### Sync Google Sheets — situazione reale (corretta dopo lettura codice)

**Non è bidirezionale**: è solo Sheets → Portale. Il portale è "authoritative status owner".

**Regole merge attuali**:
| Campo | Owner | Comportamento |
|---|---|---|
| Nome/tel/mail/città/mq/prodotto | Sheets | Sovrascrive sempre |
| status/assignment/firstContactState | Portale | Sheets ignorato |
| note/whatsappTemplate | Portale (fallback Sheets) | |

**5 scenari di "discrepanza"**:
1. Stato modificato nel portale → su Sheets resta vecchio (by design)
2. Richiesta manuale nel portale → su Sheets non c'è (by design)
3. Telefono modificato nel portale → sovrascritto al sync (**bug subdolo**)
4. Nuova riga su Sheets → invisibile finché non premi Sync
5. `upsertSalesRequestToDb(r).catch(() => {})` — fallimenti SQL silenziosi

### Proposta architetturale

**Decisioni**:
1. PostgreSQL = single source of truth (dopo import)
2. Sync rimane **manuale ma con notifica nuovi lead** (banner)
3. Dati cliente: portale vince dopo import iniziale
4. Mirror opzionale Portal → Sheets per consultazione
5. Persistent queue per scritture SQL (no più silent fail)
6. Endpoint diagnostic per monitorare discrepanze

### Altri problemi robustezza
- **Offline / cantieri**: solo 2 `navigator.onLine` in tutto app.js; serve coda offline IndexedDB
- **SW cache invalidation**: `npm run check` non agganciato a hook pre-push (rischio deploy disallineato)
- **State management dispersivo**: `state.*` globale + DOM + localStorage + server; re-render perde scroll/focus

---

## Capitolo 5 — Sintesi prioritizzata

### Ondata 1 — Fix mirati (1-2 settimane)
| # | Cosa | Impatto | Effort |
|---|---|---|---|
| 1.1 | **Fix scroll teleport** ⭐ PRIMO | 🔥🔥🔥 | XS (1g) |
| 1.2 | Skip re-render input attivi | 🔥🔥 | S (1g) |
| 1.3 | Pre-push hook `npm run check` | 🔥 | XS (30min) |
| 1.4 | Diagnostic sync Sheets | 🔥🔥 | S (1g) |
| 1.5 | Banner "N nuovi lead su Sheets" | 🔥🔥🔥 | S (1-2g) |

### Ondata 2 — Mobile-first refactor (3-4 settimane)
| # | Cosa | Impatto | Effort |
|---|---|---|---|
| 2.1 | Pattern drill-down (Richieste, Inventario, Ordini, Pose) | 🔥🔥🔥 | M (1 sett) |
| 2.2 | Bottom action bar sticky | 🔥🔥 | S (2g) |
| 2.3 | Bottom sheet filtri | 🔥🔥 | S (2-3g) |
| 2.4 | Density audit sotto 768px | 🔥🔥 | M (3-4g) |
| 2.5 | Sync Sheets ridisegnato | 🔥🔥🔥 | M (5-7g) |

### Ondata 3 — Nuove capacità (1-2 mesi)
| # | Cosa | Impatto | Effort |
|---|---|---|---|
| 3.1 | Consuntivo Posa mobile | 🔥🔥🔥 | M-L (1-2 sett) |
| 3.2 | Generatore preventivi mobile lightweight (vanilla JS) | 🔥🔥 | L (2-3 sett) |
| 3.3 | Coda offline IndexedDB | 🔥🔥 | M (1 sett) |
| 3.4 | Template messaggi WhatsApp | 🔥 | S (3g) |
| 3.5 | Automazioni stato CRM | 🔥🔥 | M (1 sett) |
| 3.6 | Allocazione magazzino mobile | 🔥🔥 | M (3-4g) |

---

## Decisioni utente registrate

| Domanda | Risposta |
|---|---|
| Focus principale | UX mobile (priorità), UX/efficienza, robustezza, riduzione lavoro manuale |
| Prospettiva | Operativa quotidiana |
| Generatore preventivi mobile | Riscrittura lightweight vanilla JS (no React) |
| Sync Sheets | Manuale con notifica nuovi lead |
| Ownership dati post-import | Portale vince (Sheets diventa view/verifica) |
| Primo intervento concreto | **1.1 Fix scroll teleport** |

---

## Roadmap IMAP (Architettura B) — safety-first

| Fase | Cosa | Durata lavoro | Calendario |
|---|---|---|---|
| 0 | Pre-flight (diagnostic endpoint, backup, audit Sheets attuale) | 1g | 1g |
| 1 | IMAP worker in shadow su `incoming_leads_shadow` (no impatto) | 3-4g | 1 settimana |
| 2 | Shadow run validazione (confronto IMAP vs Sheets giornaliero) | 0.5g | 1-2 settimane passive |
| 3 | Doppio binario: lista "lead in arrivo" con import manuale 1-click | 2g | 1 settimana |
| 4 | Auto-import IMAP→sales_request, Sheets in parallelo come fallback | 1g | 1 settimana monitor |
| 5 | Cleanup (decisione finale su Make: spegnere/dormant) | 0.5g | dopo 30+ giorni stabili |

Kill switch sempre attivo via env var. Tabella `incoming_leads_shadow` storica per audit. Endpoint `/api/sales/diagnostic` per stato live.

## Storia revisioni

- v1.0 (2026-05-25) — Prima stesura, 5 capitoli, validazione completa utente
- v1.1 (2026-05-26) — Aggiunto flusso PHP+Make+Sheets reale; decisioni utente su IMAP (Architettura B) safety-first; roadmap IMAP in 5 fasi.
