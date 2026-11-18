import { notFound, redirect } from "next/navigation";
import { ArrowRight, CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/shell";
import { acceptInvitationAction } from "@/app/actions";
import { getUser, digest } from "@/lib/auth";
import { sql } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function Invitation({ params, searchParams }: {
  params: Promise<{token:string}>; searchParams: Promise<{error?:string}>;
}) {
  const user=await getUser();
  if(user)redirect(user.role==="admin"?"/admin":"/portal");
  const {token}=await params;
  const rows=await sql<{email:string;name:string}>(`SELECT i.email,c.name FROM invitations i JOIN clients c ON c.id=i.client_id WHERE i.token_hash=$1 AND i.used_at IS NULL AND i.expires_at > now() LIMIT 1`,[digest(token)]);
  if(!rows[0]) notFound();
  const {error}=await searchParams;
  return <div className="invite-layout"><div className="invite-card"><Brand/><span className="auth-lock"><CheckCircle2 size={22}/></span><p className="overline">A PERSONAL INVITATION</p><h1>Welcome to the project.</h1><p className="auth-desc">You've been invited to collaborate on <strong>{rows[0].name}</strong>. Set up your private Profuzion account to begin.</p>
    {error && <div className="notice notice-error">{error}</div>}
    <form action={acceptInvitationAction} className="form-stack"><input type="hidden" name="token" value={token}/><label>Your email<input type="email" value={rows[0].email} readOnly/></label><label>Your name<input name="name" placeholder="Full name" required/></label><label>Create a password<input name="password" type="password" minLength={12} autoComplete="new-password" required/><small>Use at least 12 characters.</small></label><button className="btn btn-primary btn-large" type="submit">Activate my workspace <ArrowRight size={17}/></button></form><p className="login-small"><ShieldCheck size={16}/> Private, invite-only access.</p>
  </div></div>;
}
