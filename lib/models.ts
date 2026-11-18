export type User = { id: string; email: string; name: string; role: "admin" | "client" };
export type Client = {
  id: string; name: string; slug: string; industry: string; description: string;
  accent: string; website_preview_url: string | null; created_at: Date;
};
export type SectionKind = "proposal" | "strategy" | "identity" | "website";
export type SectionStatus = "planned" | "in_progress" | "review" | "approved";
export type Section = {
  id: string; client_id: string; kind: SectionKind; title: string;
  summary: string; body: string; status: SectionStatus; updated_at: Date;
};
export type Activity = { id: string; label: string; created_at: Date };
export const sectionTemplates: Record<SectionKind, { title: string; summary: string; prompt: string; icon: string }> = {
  proposal: {
    title: "Project Proposal", summary: "Project scope, deliverables, and investment.", icon: "FileText",
    prompt: "Your personalized proposal will appear here once it is ready for review."
  },
  strategy: {
    title: "Brand Strategy", summary: "Positioning, higher purpose, audience, and messaging.", icon: "Compass",
    prompt: "Your brand strategy presentation will appear here as the discovery phase progresses."
  },
  identity: {
    title: "Brand Identity", summary: "Visual identity, logo direction, and brand guidelines.", icon: "Palette",
    prompt: "Your identity concepts and final visual guidelines will be presented here."
  },
  website: {
    title: "Website", summary: "Design previews, development, and launch.", icon: "Monitor",
    prompt: "Website design previews and launch details will appear here."
  },
};
export const sectionOrder: SectionKind[] = ["proposal", "strategy", "identity", "website"];
export const statuses: SectionStatus[] = ["planned", "in_progress", "review", "approved"];
export const statusNames: Record<SectionStatus, string> = {
  planned: "Planned", in_progress: "In progress", review: "For review", approved: "Approved"
};
