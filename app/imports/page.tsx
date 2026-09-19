import AppShell from '@/components/AppShell';
import ImportForm from '@/components/ImportForm';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { IMPORT_TYPES, type ImportTypeKey } from '@/lib/import-config';

export default async function Page(){
  const u=await getCurrentUser();if(!u)return null;
  const jobs=await prisma.importJob.findMany({where:{companyId:u.companyId},orderBy:{createdAt:'desc'},take:30});
  return <AppShell>
    <h1 className="section-title">Import Data Accurate Desktop</h1>
    <p className="muted" style={{marginTop:-6}}>Export laporan dari Accurate ke Excel/CSV, pilih jenis data, lalu import ke BeaBridge.</p>
    <div className="grid2">
      <div className="card"><ImportForm/></div>
      <div className="card">
        <h3 style={{marginTop:0}}>Data yang didukung</h3>
        <div className="feature-list">
          {Object.entries(IMPORT_TYPES).map(([k,v])=><div className="feature-item" key={k}><strong>{v.label}</strong><span>{v.description}</span></div>)}
        </div>
      </div>
    </div>
    <div className="card" style={{marginTop:16}}>
      <h3>Riwayat Import</h3>
      <div className="table-wrap"><table className="table"><thead><tr><th>Waktu</th><th>Jenis</th><th>File</th><th>Rows</th><th>Imported</th><th>Skipped</th><th>Error</th></tr></thead><tbody>
        {jobs.map(j=><tr key={j.id}><td>{j.createdAt.toISOString().slice(0,16).replace('T',' ')}</td><td><span className="badge blue">{IMPORT_TYPES[j.importType as ImportTypeKey]?.label || j.importType}</span></td><td>{j.fileName}</td><td>{j.rowCount}</td><td>{j.importedCount}</td><td>{j.skippedCount}</td><td>{j.errorCount}</td></tr>)}
      </tbody></table></div>
    </div>
  </AppShell>
}
