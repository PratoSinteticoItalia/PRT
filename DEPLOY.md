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
