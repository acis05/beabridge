import {prisma} from './prisma';
export const REPORTS=[
 {key:'inbound-doc',title:'1. Pemasukan Barang per Dokumen Pabean',desc:'Pemasukan barang beserta jenis, nomor, tanggal dokumen pabean dan bukti penerimaan.'},
 {key:'outbound-doc',title:'2. Pengeluaran Barang per Dokumen Pabean',desc:'Pengeluaran barang beserta dokumen pabean dan bukti pengeluaran perusahaan.'},
 {key:'raw-material',title:'3. Mutasi Bahan Baku & Bahan Penolong',desc:'Saldo awal, pemasukan, pengeluaran, adjustment, saldo akhir dan stock opname.'},
 {key:'wip',title:'4. Posisi Barang Dalam Proses (WIP)',desc:'Posisi bahan/barang yang masih berada dalam proses produksi.'},
 {key:'finished-goods',title:'5. Mutasi Hasil Produksi / Barang Jadi',desc:'Pertanggungjawaban mutasi hasil produksi atau barang jadi.'},
 {key:'capital-goods',title:'6. Mutasi Barang Modal',desc:'Pertanggungjawaban mutasi mesin, peralatan dan barang modal.'},
 {key:'scrap',title:'7. Mutasi Sisa / Scrap Produksi',desc:'Pertanggungjawaban sisa proses produksi dan scrap.'},
] as const;
export type ReportKey=typeof REPORTS[number]['key'];
const cats:Record<string,string[]>={
 'raw-material':['BAHAN_BAKU','BAHAN_PENOLONG'],
 'wip':['WIP'],
 'finished-goods':['HASIL_PRODUKSI','BARANG_JADI'],
 'capital-goods':['BARANG_MODAL','MESIN','PERALATAN'],
 'scrap':['SCRAP','SISA_PRODUKSI'],
};
export async function buildReport(companyId:string,key:string,start:Date,end:Date){
 if(key==='inbound-doc'||key==='outbound-doc'){
   const type=key==='inbound-doc'?'INBOUND':'OUTBOUND';
   const txs=await prisma.transaction.findMany({where:{companyId,type,transactionAt:{gte:start,lte:end}},include:{item:true,warehouse:true},orderBy:[{transactionAt:'asc'},{customsDocNo:'asc'}]});
   return {kind:'document',rows:txs.map(t=>({date:t.transactionAt.toISOString().slice(0,10),docType:t.customsDocType||'',docNo:t.customsDocNo||'',docDate:t.customsDocDate?.toISOString().slice(0,10)||'',reference:t.referenceNo||'',invoice:t.invoiceNo||'',partner:t.partnerName||'',code:t.item.code,name:t.item.name,hsCode:t.item.hsCode||'',unit:t.item.unit,warehouse:t.warehouse.code,qty:Number(t.qty),source:t.source}))};
 }
 const categories=cats[key]||[];
 const items=await prisma.item.findMany({where:{companyId,category:{in:categories}},orderBy:{code:'asc'}});
 const ids=items.map(i=>i.id);if(!ids.length)return {kind:'movement',rows:[]};
 const [before,period,opnames]=await Promise.all([
  prisma.transaction.findMany({where:{companyId,itemId:{in:ids},transactionAt:{lt:start}}}),
  prisma.transaction.findMany({where:{companyId,itemId:{in:ids},transactionAt:{gte:start,lte:end}}}),
  prisma.stockOpname.findMany({where:{companyId,itemId:{in:ids},opnameAt:{gte:start,lte:end}},orderBy:{opnameAt:'desc'}})
 ]);
 const sign=(t:any)=>t.type==='INBOUND'?Number(t.qty):t.type==='OUTBOUND'?-Number(t.qty):t.type==='ADJUSTMENT'?Number(t.qty):0;
 const opening=new Map<string,number>();before.forEach(t=>opening.set(t.itemId,(opening.get(t.itemId)||0)+sign(t)));
 const moves=new Map<string,{inb:number,out:number,adj:number}>();period.forEach(t=>{const x=moves.get(t.itemId)||{inb:0,out:0,adj:0};const q=Number(t.qty);if(t.type==='INBOUND')x.inb+=q;else if(t.type==='OUTBOUND')x.out+=q;else if(t.type==='ADJUSTMENT')x.adj+=q;moves.set(t.itemId,x)});
 const latest=new Map<string,any>();opnames.forEach(o=>{if(!latest.has(o.itemId))latest.set(o.itemId,o)});
 return {kind:'movement',rows:items.map(i=>{const o=opening.get(i.id)||0,m=moves.get(i.id)||{inb:0,out:0,adj:0},closing=o+m.inb-m.out+m.adj,so=latest.get(i.id);const physical=so?Number(so.physicalQty):null;return {code:i.code,name:i.name,hsCode:i.hsCode||'',unit:i.unit,category:i.category||'',opening:o,inbound:m.inb,outbound:m.out,adjustment:m.adj,closing,stockOpname:physical,difference:physical===null?null:physical-closing,notes:so?.notes||''}})};
}
