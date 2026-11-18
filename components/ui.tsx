import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, Compass, FileText, Monitor, Palette, Plus } from "lucide-react";
import { statusNames, type Section, type SectionKind, type SectionStatus } from "@/lib/models";

export const sectionIcons = { proposal: FileText, strategy: Compass, identity: Palette, website: Monitor };
export function SectionIcon({ kind, size = 20 }: { kind: SectionKind; size?: number }) {
  const Icon = sectionIcons[kind]; return <Icon size={size} strokeWidth={1.8}/>;
}
export function Status({ status }: { status: SectionStatus }) {
  return <span className={`status status-${status}`}><span className="status-dot"/>{statusNames[status]}</span>;
}
export function SectionCard({ section, href }: { section: Section; href: string }) {
  return <Link href={href} className={`section-card accent-${section.kind}`}>
    <span className="section-card-top"><span className="section-icon"><SectionIcon kind={section.kind}/></span><ArrowUpRight size={18}/></span>
    <span className="section-card-body"><strong>{section.title}</strong><span>{section.summary}</span></span>
    <span className="section-card-bottom"><Status status={section.status}/></span>
  </Link>;
}
export function EmptyClients() {
  return <div className="empty"><span className="empty-icon"><BriefcaseBusiness size={28}/></span>
    <h3>Every great project starts somewhere.</h3><p>Create your first client workspace and the four presentation sections will be set up automatically.</p>
    <Link className="btn btn-primary" href="/admin/clients/new"><Plus size={17}/>Add your first client</Link>
  </div>;
}
