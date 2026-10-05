# Contabilità gestionale — prima versione

Pannello integrato in Contabilità, riservato al ruolo office. Registro separato dagli ordini, persistito nel documento applicativo con il normale meccanismo di backup. Nessuna migrazione o riclassificazione automatica dei dati esistenti.

Funzioni: movimenti con riferimento documento, date e aliquota esplicite; elenco anomalie; prospetto corrispettivi per giorno/aliquota con rimborsi; ordini reali e registrazione collegata; riconciliazione manuale di accrediti cumulativi con controllo lordo-rimborsi-commissioni=netto; CSV prima nota/corrispettivi/accrediti; chiusura con fotografia; riapertura motivata; audit e controllo revisione contro sovrascritture concorrenti.

Limiti: non è un invio fiscale né un software di contabilità in partita doppia. Nessuna connessione bancaria o acquisizione automatica dei payout. Pagamenti Shopify parziali/rimborsi dipendono dalla completezza dei dati ordine già importati: verificare il rendiconto. Registrazione esplicita, nessuna deduzione della data incasso dalla data ordine. Prima versione con un'aliquota per movimento (suddividere operazioni multi-aliquota); data finanziaria e registrazione nello stesso mese. Chiusura del solo registro, non degli ordini. Non prova la completezza rispetto alle vendite effettive. XLSX, PDF dedicato e allegati ZIP non ancora presenti; gli export storici degli ordini restano accessibili.

Validazione: test di logica per IVA, esclusione fatture, rimborsi, chiusura/riapertura, concorrenti, date invalide, quadratura accrediti e protezione CSV; test API su server isolato con autenticazione, salvataggio, chiusura, rifiuto modifica e rilettura persistita; verifica grafica browser del pannello integrato. Nessuna scrittura in produzione durante QA.
