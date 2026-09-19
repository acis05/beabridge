import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LoginForm from '@/components/LoginForm';
export default async function Home(){ const user=await getCurrentUser(); if(user) redirect('/dashboard'); return <div className="login"><div className="loginbox"><img src="/beabridge-logo.png" alt="BeaBridge"/><LoginForm/></div></div> }
