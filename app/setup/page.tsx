import { Brand } from "@/components/shell";
import { LockKeyhole } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export default function Setup() {
  if (process.env.DATABASE_URL) redirect("/login");
  return <div className="invite-layout"><div className="invite-card">
    <Brand/><span className="auth-lock"><LockKeyhole size={22}/></span>
    <p className="overline">PROFUZION / PRIVATE WORKSPACE</p>
    <h1>We're preparing your workspace.</h1>
    <p className="auth-desc">This client portal has not been activated yet. Profuzion Studio will provide access when setup is complete.</p>
  </div></div>;
}
