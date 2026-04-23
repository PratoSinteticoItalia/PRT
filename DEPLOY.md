# Deploy Vertex Ops su Render

## 1. Prepara il repository

Pubblica questa cartella in un repository Git.

Cartella progetto:

`/Users/todarogabriele/Documents/Playground/pose-system`

## 2. Crea il servizio su Render

1. Vai su Render.
2. Crea un nuovo `Web Service`.
3. Collega il repository.
4. Render può leggere già `render.yaml`, quindi importerà:
   - build command: `npm install`
   - start command: `npm start`
   - persistent disk su `/var/data`

## 3. Variabili ambiente

Il servizio usa:

- `HOST=0.0.0.0`
- `DATA_DIR=/var/data/vertex-ops`

Le credenziali Shopify non vanno salvate nel frontend. Restano nel backend e, una volta dentro l'app, puoi continuare a gestirle dalla schermata `Impostazioni`.

Per automazione primo contatto richieste:

- `SALES_REQUEST_AUTOMATION_MODE=none|email|whatsapp`
- consigliato per il tuo caso: `SALES_REQUEST_AUTOMATION_MODE=email` (lasciando WhatsApp manuale)

Se usi automazione email (Resend):

- `SALES_REQUEST_EMAIL_PROVIDER=resend`
- `SALES_REQUEST_EMAIL_FROM=...`
- `SALES_REQUEST_EMAIL_REPLY_TO=...` (opzionale)
- `SALES_REQUEST_EMAIL_SUBJECT_PREFIX=Prato Sintetico Italia` (opzionale)
- `RESEND_API_KEY=...`

Se vuoi tenere disponibile anche automazione WhatsApp (opzionale):

- `WHATSAPP_AUTOMATION_ENABLED=true`
- `WHATSAPP_ACCESS_TOKEN` e `WHATSAPP_PHONE_NUMBER_ID` (fallback)
- `WHATSAPP_IVAN_ACCESS_TOKEN` + `WHATSAPP_IVAN_PHONE_NUMBER_ID`
- `WHATSAPP_GABRIELE_ACCESS_TOKEN` + `WHATSAPP_GABRIELE_PHONE_NUMBER_ID`

## 4. Primo avvio

Al primo deploy il server:

- crea automaticamente `store.json`
- crea automaticamente `session.json`
- inizializza gli utenti demo

## 5. Dominio pubblico

Quando Render ti assegna un URL, per esempio:

`https://vertex-ops-pose-system.onrender.com`

mettilo in `Impostazioni > URL pubblico webhook`

poi clicca `Registra webhook`.

Il webhook finale sarà:

`https://TUO-DOMINIO/api/webhooks/shopify/orders`

## 6. Controlli finali

Dopo il deploy verifica:

1. Login funzionante
2. Sincronizzazione Shopify funzionante
3. Registrazione webhook riuscita
4. Nuovo ordine Shopify -> bozza commessa automatica

## 7. Note produzione

- Il persistent disk evita di perdere dati tra restart ed e obbligatorio se vuoi mantenere ordini, impostazioni e sessioni nel tempo.
- Gli ordini non vanno piu rimossi dal gestionale: la cancellazione e la pulizia massiva sono disattivate.
- Ad ogni salvataggio di `store.json` il server crea anche backup automatici rotanti in `DATA_DIR/backups`.
- Per un uso aziendale serio, più avanti conviene comunque passare da file JSON a database.
- Se vuoi usare un dominio tuo tipo `ops.pratosinteticoitalia.com`, puoi collegarlo dopo direttamente su Render.
