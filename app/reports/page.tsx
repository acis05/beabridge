import AppShell from '@/components/AppShell';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function Page(){
  const u=await getCurrentUser();if(!u)return null;
  const [txs,opnames]=await Promise.all([
    prisma.transaction.findMany({where:{companyId:u.companyId},include:{item:true,warehouse:true},orderBy:{transactionAt:'asc'}}),
    prisma.stockOpname.findMany({where:{companyId:u.companyId},include:{item:true,warehouse:true},orderBy:{opnameAt:'desc'},take:50})
  ]);
  const map=new Map<string,{code:string,name:string,unit:string,inb:number,out:number,adj:number,balance:number}>();
  for(const t of txs){
    const k=t.itemId;const v=map.get(k)||{code:t.item.code,name:t.item.name,unit:t.item.unit,inb:0,out:0,adj:0,balance:0};
    const q=Number(t.qty);
    if(t.type==='INBOUND')v.inb+=q;
    else if(t.type==='OUTBOUND')v.out+=q;
    else if(t.type==='ADJUSTMENT')v.adj+=q;
    v.balance=v.inb-v.out+v.adj;
    map.set(k,v);
  }
  return <AppShell>
    <div className="row" style={{justifyContent:'space-between'}}><div><h1 className="section-title">Laporan Mutasi / Posisi Stok</h1><div className="muted">Ringkasan transaksi yang telah masuk ke BeaBridge.</div></div><a className="btn" href="/api/reports?format=csv">Export CSV</a></div>
    <div className="card" style={{marginTop:16}}><div className="table-wrap"><table className="table"><thead><tr><th>Kode</th><th>Nama Barang</th><th>Satuan</th><th>Masuk</th><th>Keluar</th><th>Adjustment</th><th>Saldo</th></tr></thead><tbody>{Array.from(map.values()).map(v=><tr key={v.code}><td>{v.code}</td><td>{v.name}</td><td>{v.unit}</td><td>{v.inb}</td><td>{v.out}</td><td>{v.adj}</td><td><strong>{v.balance}</strong></td></tr>)}</tbody></table></div></div>
    <div className="card" style={{marginTop:16}}><h3 style={{marginTop:0}}>Stock Opname Terakhir</h3><div className="table-wrap"><table className="table"><thead><tr><th>Tanggal</th><th>Barang</th><th>Gudang</th><th>Stok Sistem</th><th>Stok Fisik</th><th>Selisih</th><th>Referensi</th></tr></thead><tbody>{opnames.map(o=><tr key={o.id}><td>{o.opnameAt.toISOString().slice(0,10)}</td><td>{o.item.code} — {o.item.name}</td><td>{o.warehouse.code}</td><td>{String(o.systemQty)}</td><td>{String(o.physicalQty)}</td><td><strong>{String(o.differenceQty)}</strong></td><td>{o.referenceNo||'-'}</td></tr>)}</tbody></table></div></div>
  </AppShell>
}
