import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LogoutButton from './LogoutButton';
export default async function AppShell({children}:{children:React.ReactNode}){
  const user=await getCurrentUser();if(!user)redirect('/');
  return <div className="shell"><aside className="sidebar"><div className="brand"><img src="/beabridge-logo.png" alt="BeaBridge"/></div><nav className="nav">
    <a href="/dashboard">Dashboard</a><a href="/transactions">Daftar Transaksi</a><a href="/master">Master Data</a><a href="/imports">Import Accurate</a><a href="/reports">7 Laporan Bea Cukai</a><a href="/periods">Periode Laporan</a><a href="/users">Pengguna</a><a href="/audit">Audit Trail</a>
  </nav></aside><main className="main"><div className="topbar"><div><strong>{user.company.name}</strong><div className="muted">{user.role}</div></div><LogoutButton/></div><div className="content">{children}</div></main></div>
}
