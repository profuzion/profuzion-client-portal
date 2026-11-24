"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Users,
  LifeBuoy,
  Palette,
  Settings,
  Plus,
  BriefcaseBusiness,
} from "lucide-react";
export function WorkspaceNav({
  admin,
  slug,
}: {
  admin: boolean;
  slug?: string;
}) {
  const path = usePathname();
  const links = [
    {
      href: admin ? "/admin" : "/portal",
      label: admin ? "Clients" : "Workspaces",
      Icon: admin ? BriefcaseBusiness : LayoutGrid,
    },
    ...(slug
      ? [
          { href: `/c/${slug}`, label: "Project overview", Icon: LayoutGrid },
          {
            href: `/c/${slug}/brand`,
            label: "Brand guidelines",
            Icon: Palette,
          },
          { href: `/c/${slug}/support`, label: "Support", Icon: LifeBuoy },
        ]
      : []),
    ...(admin
      ? [
          { href: "/admin/users", label: "People & access", Icon: Users },
          { href: "/admin/support", label: "Client support", Icon: LifeBuoy },
          { href: "/admin/brand", label: "Profuzion brand", Icon: Palette },
          { href: "/admin/clients/new", label: "New workspace", Icon: Plus },
        ]
      : []),
    { href: "/account", label: "Your account", Icon: Settings },
  ];
  return (
    <nav className="workspace-nav" aria-label="Workspace">
      {links.map(({ href, label, Icon }) => {
        const active =
          path === href ||
          (["/admin/users", "/admin/support"].includes(href) &&
            path.startsWith(href + "/")) ||
          (href.endsWith("/support") && path.startsWith(href + "/"));
        return (
          <Link
            href={href}
            key={href}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
