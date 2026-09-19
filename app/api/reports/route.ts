import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(){
  const u=await getCurrentUser();
  if(!u)return new Response('Unauthorized',{status:401});
  const txs=await prisma.transaction.findMany({where:{companyId:u.companyId},include:{item:true,warehouse:true},orderBy:{transactionAt:'asc'}});
  const lines=['Tanggal,Jenis,Kode Barang,Nama Barang,HS Code,Satuan,Gudang,Qty,Referensi,Invoice,Partner,Jenis Dokumen Bea,No Dokumen Bea,Tanggal Dokumen Bea,Lot/Batch,Sumber,Catatan'];
  const esc=(x:any)=>`"${String(x??'').replaceAll('"','""')}"`;
  for(const t of txs){
    lines.push([
      t.transactionAt.toISOString().slice(0,10),t.type,t.item.code,t.item.name,t.item.hsCode,t.item.unit,t.warehouse.code,String(t.qty),t.referenceNo,t.invoiceNo,t.partnerName,t.customsDocType,t.customsDocNo,t.customsDocDate?.toISOString().slice(0,10),t.lotNo,t.source,t.notes
    ].map(esc).join(','));
  }
  await prisma.auditLog.create({data:{companyId:u.companyId,userId:u.id,action:'EXPORT',entity:'REPORT',metadata:{format:'CSV',rows:txs.length}}});
  return new Response('\ufeff'+lines.join('\n'),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="beabridge-report.csv"'}});
}
