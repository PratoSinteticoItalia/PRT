// Preserve purchase totals when converting a package to its comparison unit.
export function normalizeSupplierProduct(line) {
  const original={...line};
  const text=String(line.material||'').toLowerCase();
  const number=s=>Number(String(s).replace(',','.'));
  const length=text.match(/(?:rotoli? da|lunghezza)\s*([\d.,]+)\s*(?:mtl|metri|m)\b/);
  const width=text.match(/(?:altezza|larghezza)\s*cm\s*([\d.,]+)/);
  const weight=text.match(/kg\.?\s*([\d.,]+)/);
  const totalPieces=text.match(/totale\s*pz\s*=\s*([\d.]+)/);
  let target='',factor=1;
  if(/banda|giunzione/.test(text) || (width && number(width[1])===25 && length && number(length[1])===25)) {
    target='rotolo';
    if(!['pz','rotolo',''].includes(line.unit))factor=null;
  } else if(/picchett/.test(text)) {
    target='pz';
    if(line.unit!=='pz')factor=totalPieces && line.quantity>0 ? Number(totalPieces[1].replace(/\./g,''))/line.quantity : null;
  } else if(/colla|tovcol/.test(text)) {
    target='kg';
    if(line.unit!=='kg')factor=weight && ['pz','confezione',''].includes(line.unit)?number(weight[1]):null;
  } else if(/telo|tessuto non tessuto/.test(text)) {
    target='metro';
    if(line.unit!=='metro')factor=length && ['pz','rotolo','confezione'].includes(line.unit)?number(length[1]):null;
  } else if(/prato/.test(text)) {
    target='mq';
    if(line.unit!=='mq')factor=null;
  }
  if(!target || target===line.unit)return {line:original,message:''};
  if(!(factor>0))return {line:original,message:`${line.material}: conversione in ${target} da verificare; manca una equivalenza certa. Prezzo e unità originali mantenuti.`};
  const unitPrice=line.unitPrice/factor;
  const quantity=line.quantity>0?line.quantity*factor:line.quantity;
  return {line:{...line,unit:target,unitPrice,quantity},message:`${line.material}: ${line.unitPrice} €/${line.unit} → ${unitPrice} €/${target} (1 ${line.unit} = ${factor} ${target}). Quantità convertita: ${quantity || 'non indicata'}. Verificare prima di salvare.`};
}
