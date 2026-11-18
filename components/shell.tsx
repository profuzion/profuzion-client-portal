import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CircleHelp, Globe2, LayoutGrid, LogOut, Plus, Shield, Sparkles } from "lucide-react";
import { logoutAction } from "@/app/actions";
import type { User } from "@/lib/models";


export function Brand({
  compact = false,
  variant = "light",
}: {
  compact?: boolean;
  variant?: "light" | "dark";
}) {
  const logo =
    variant === "dark"
      ? "/branding/PFS_logomark_dark.svg"
      : "/branding/PFS_logomark_light.svg";

  return (
    <Link
      href="/"
      className={`brand ${compact ? "brand-compact" : ""}`}
      aria-label="Profuzion client portal"
    >
      <img
        src={logo}
        alt=""
        className="brand-logo"
        width={44}
        height={44}
      />
      <span className="brand-label">
        <strong>PROFUZION</strong>
        <small>STUDIO / WORKSPACE</small>
      </span>
    </Link>
  );
}

export function Shell({ user, children, title, overline, actions }: {
  user: User; children: React.ReactNode; title: string; overline?: string; actions?: React.ReactNode;
}) {
  const isAdmin = user.role === "admin";
  return <div className="shell">
    <aside className="sidebar">
      <div>
  <Brand variant={isAdmin ? "dark" : "light"} />
  <div className="nav-label">WORKSPACE</div>
        <nav className="side-nav">
          <Link href={isAdmin ? "/admin" : "/portal"}><LayoutGrid size={18}/>Overview</Link>
          {isAdmin && <><Link href="/admin"><BriefcaseBusiness size={18}/>Clients</Link><Link href="/admin/clients/new"><Plus size={18}/>New workspace</Link></>}
        </nav>
        <div className="nav-label nav-label-second">RESOURCES</div>
        <div className="side-nav">
          <span className="nav-inactive"><Globe2 size={18}/>Profuzion.com <em>Soon</em></span>
        </div>
      </div>
      <div className="sidebar-bottom">
        <div className="side-hint"><Sparkles size={18}/><strong>Make the meaningful work visible.</strong><span>One place for every client journey.</span></div>
        <div className="sidebar-person"><span className="avatar">{user.name.charAt(0).toUpperCase()}</span><span><strong>{user.name}</strong><small>{isAdmin ? "Agency administrator" : "Client access"}</small></span></div>
        <form action={logoutAction}><button type="submit" className="logout"><LogOut size={16}/> Sign out</button></form>
      </div>
    </aside>
    <div className="main-column">
      <header className="topbar"><span><Shield size={15}/> Private & secure workspace</span><span className="topbar-right">{isAdmin ? "ADMIN VIEW" : "CLIENT VIEW"} <span className="topbar-separator"/> <span className="avatar avatar-small">{user.name.charAt(0).toUpperCase()}</span></span></header>
      <main className="content"><div className="page-head"><div><p className="overline">{overline ?? "PROFUZION / WORKSPACE"}</p><h1>{title}</h1></div>{actions && <div className="page-actions">{actions}</div>}</div>{children}</main>
      <footer className="footer"><span>© {new Date().getFullYear()} Profuzion Studio</span><span><CircleHelp size={14}/> Built for better collaboration <ArrowRight size={14}/></span></footer>
    </div>
  </div>;
}
