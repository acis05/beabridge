import AppShell from '@/components/AppShell';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import PeriodManager from '@/components/PeriodManager';

export default async function Page(){
  const u=await getCurrentUser(); if(!u)return null;
  const periods=await prisma.reportPeriod.findMany({where:{companyId:u.companyId},orderBy:[{year:'desc'},{month:'desc'}]});
  return <AppShell>
    <h1 className="section-title">Periode Laporan</h1>
    <div className="card"><PeriodManager periods={periods} role={u.role}/></div>
  </AppShell>
}
