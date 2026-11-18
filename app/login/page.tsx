import { redirect } from "next/navigation";
import { ArrowRight, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { Brand } from "@/components/shell";
import { loginAction } from "@/app/actions";
import { getUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!process.env.DATABASE_URL) redirect("/setup");
  const user = await getUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/portal");
  const { error } = await searchParams;
  return <div className="auth-layout"><div className="auth-aside"><Brand/><div className="auth-aside-copy"><span className="auth-kicker"><Sparkles size={15}/> BETTER BY DESIGN</span><h1>Every great brand<br/>starts with a <em>purpose.</em></h1><p>Your project, your vision, and the work that brings it to life — all in one thoughtfully designed space.</p></div><div className="auth-aside-bottom">PROFUZION STUDIO · CLIENT EXPERIENCE</div></div>
    <div className="auth-main"><div className="auth-card"><span className="auth-lock"><LockKeyhole size={21}/></span><p className="overline">WELCOME BACK</p><h2>Sign in to your workspace.</h2><p className="auth-desc">Access your proposals, creative direction, brand identity, and website progress.</p>
    {error && <div className="notice notice-error" role="alert">{error}</div>}
    <form action={loginAction} className="form-stack"><label>Email address<input name="email" type="email" placeholder="you@company.com" autoComplete="email" required/></label><label>Password<input name="password" type="password" placeholder="Your password" autoComplete="current-password" required/></label><button type="submit" className="btn btn-primary btn-large">Continue to workspace <ArrowRight size={17}/></button></form><p className="login-small"><ShieldCheck size={15}/> Private client access. Invitations are issued by Profuzion Studio.</p></div></div>
  </div>;
}
