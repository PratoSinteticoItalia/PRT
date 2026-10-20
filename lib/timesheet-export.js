// Excel-friendly register: one row per shift, with a separate row for each absence.
// Certificates and absence notes are deliberately excluded from payroll exports.
export function buildTimesheetCsv(shifts = [], absences = [], users = []) {
  const byId = new Map(users.map(u => [u.id,u]));
  const cell = value => {
    let s = String(value ?? '');
    if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g,'""') + '"';
  };
  const labels = {vacation:'Ferie',permit:'Permesso',sick:'Malattia'};
  const time = iso => iso ? new Date(iso).toLocaleTimeString('it-IT',{timeZone:'Europe/Rome',hour:'2-digit',minute:'2-digit'}) : '';
  const rows = shifts.map(s => ({date:s.shiftDate,userId:s.userId,values:['Presenza',time(s.clockInAt),time(s.clockOutAt),s.workedMinutes ?? '', '', (s.anomalyFlags || []).join(' | '),s.clockOutAt ? 'Chiuso' : 'Turno aperto']}));
  absences.forEach(a => rows.push({date:a.date,userId:a.userId,values:[labels[a.type] || a.type,a.startTime || '',a.endTime || '', '',a.type === 'permit' && a.startTime && a.endTime ? ((+a.endTime.slice(0,2)*60 + +a.endTime.slice(3))-(+a.startTime.slice(0,2)*60 + +a.startTime.slice(3))) : '', '', 'Registrata']}));
  const header = ['Data','Dipendente','Email','Tipo','Dalle','Alle','Minuti lavorati','Minuti permesso','Anomalie','Stato'];
  return '\ufeff' + [header,...rows.sort((a,b)=>a.date.localeCompare(b.date)||String(a.userId).localeCompare(String(b.userId))).map(r=>[r.date,byId.get(r.userId)?.name || r.userId,byId.get(r.userId)?.email || '',...r.values])].map(row=>row.map(cell).join(';')).join('\r\n');
}
