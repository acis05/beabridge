'use client';export default function LogoutButton(){return <button className="btn secondary" onClick={async()=>{await fetch('/api/auth/logout',{method:'POST'});location.href='/'}}>Logout</button>}
