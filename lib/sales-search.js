// Ricerca della lista Richieste (ottobre 2026): vedi SALES_REQUEST_SEARCH_TEXT_SQL
// in server.js, il testo su cui si applicano questi pattern.

// Parole cercate → pattern LIKE (tutte devono esserci). Un numero perde spazi,
// punti e prefisso internazionale, così si trova comunque com'è salvato.
export function buildSalesRequestSearchPatterns(query = "") {
  return String(query || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/(\d)[\s./-]+(?=\d)/g, "$1")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .slice(0, 6)
    .map((token) => {
      let term = token.slice(0, 60);
      if (/^(\+|00)39\d/.test(term)) {
        // Prefisso scritto esplicitamente: si cerca il numero senza.
        term = term.replace(/^(\+|00)39/, "");
      } else if (/^\+?\d{3,}$/.test(term)) {
        term = term.replace(/^\+/, "");
        if (term.length >= 11 && term.startsWith("39")) term = term.slice(2);
      }
      return `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
    });
}
