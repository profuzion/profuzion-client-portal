import Link from "next/link";
import { WorkspaceNav } from "@/components/workspace-nav";
import { ArrowRight, BriefcaseBusiness, CircleHelp, Globe2, LayoutGrid, LogOut, Plus, Shield, Sparkles, Palette } from "lucide-react";
import { publishedBrand } from "@/lib/brands";
import { requireClientAccess } from "@/lib/auth";
import { getClient } from "@/lib/data";
import { themeStyle, luminance, type BrandKit } from "@/lib/brand-theme";
import { logoutAction } from "@/app/actions";
import type { User } from "@/lib/models";


export function Brand({
  compact = false,
  variant = "light",
  kit,
}: {
  compact?: boolean;
  variant?: "light" | "dark";
  kit?: BrandKit;
}) {
  const logo = kit ? (luminance(kit.sidebar) > 0.179 ? kit.logo || kit.logoOnDark : kit.logoOnDark || kit.logo) :
    variant === "dark"
      ? "/branding/PFS_logomark_dark.svg"
      : "/branding/PFS_logomark_light.svg";

  return (
    <Link
      href="/"
      className={`brand ${compact ? "brand-compact" : ""}`}
      aria-label={`${kit?.name || "Profuzion"} workspace`}
    >
      {logo ? <img
        src={logo}
        alt=""
        className="brand-logo"
        width={44}
        height={44}
      /> : <span className="brand-symbol">{kit?.name.charAt(0)}</span>}
      <span className="brand-label">
        <strong>{kit?.name || "PROFUZION"}</strong>
        <small>{kit?.tagline || "STUDIO / WORKSPACE"}</small>
      </span>
    </Link>
  );
}

export async function Shell({ user, children, title, overline, actions, clientSlug }: {
  user: User; children: React.ReactNode; title: string; overline?: string; actions?: React.ReactNode; clientSlug?: string;
}) {
  const isAdmin = user.role === "admin";
  let kit;
  if (clientSlug) {
    const {clientId} = await requireClientAccess(clientSlug);
    const client = await getClient(clientSlug);
    kit = await publishedBrand(clientId,client.name);
  } else kit = await publishedBrand();
  return <div className="shell branded-shell portal-dark" style={themeStyle(kit)}>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <aside className="sidebar">
      <div>
  <Brand kit={{...kit, sidebar: "#0b0c0d"}} />
  <div className="nav-label">WORKSPACE</div>
        <WorkspaceNav admin={isAdmin} slug={clientSlug}/>
      </div>
      <div className="sidebar-bottom">
        <div className="side-hint"><Sparkles size={18}/><strong>Make the meaningful work visible.</strong><span>One place for every client journey.</span></div>
        <div className="sidebar-person"><span className="avatar">{user.name.charAt(0).toUpperCase()}</span><span><strong>{user.name}</strong><small>{isAdmin ? "Agency administrator" : "Client access"}</small></span></div>
        <form action={logoutAction}><button type="submit" className="logout"><LogOut size={16}/> Sign out</button></form>
      </div>
    </aside>
    <div className="main-column">
      <header className="topbar"><span><Shield size={15}/> Private & secure workspace</span><span className="topbar-right">{isAdmin ? "ADMIN VIEW" : "CLIENT VIEW"} <span className="topbar-separator"/> <span className="avatar avatar-small">{user.name.charAt(0).toUpperCase()}</span></span></header>
      <details className="mobile-menu"><summary>Workspace menu</summary><WorkspaceNav admin={isAdmin} slug={clientSlug}/><form action={logoutAction}><button className="btn btn-outline" type="submit">Sign out</button></form></details>
      <main className="content" id="main-content"><div className="page-head"><div><p className="overline">{overline ?? "PROFUZION / WORKSPACE"}</p><h1>{title}</h1></div>{actions && <div className="page-actions">{actions}</div>}</div>{children}</main>
      <footer className="footer"><span>© {new Date().getFullYear()} Profuzion Studio</span><span><CircleHelp size={14}/> Built for better collaboration <ArrowRight size={14}/></span></footer>
    </div>
  </div>;
}
