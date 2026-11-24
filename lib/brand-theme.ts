import type { CSSProperties } from "react";
import { guidelineSections, type GuidelineKey } from "@/lib/guideline-sections";

export const fontOptions = {
  manrope: "var(--font-manrope), ui-sans-serif, sans-serif",
  system: "ui-sans-serif, system-ui, sans-serif",
  serif: 'Georgia, "Times New Roman", serif',
} as const;
export type BrandKit = Record<GuidelineKey, string> & {
  name: string;
  tagline: string;
  logo: string;
  logoOnDark: string;
  primary: string;
  secondary: string;
  sidebar: string;
  headingFont: keyof typeof fontOptions;
  bodyFont: keyof typeof fontOptions;
  purpose: string;
  audience: string;
  voice: string;
  logoRules: string;
  imagery: string;
};
export function defaultBrand(name = "Profuzion"): BrandKit {
  return {
    ...(Object.fromEntries(guidelineSections.map((s) => [s.key, ""])) as Record<
      GuidelineKey,
      string
    >),
    name,
    tagline: "",
    logo: "",
    logoOnDark: "",
    primary: "#ff641d",
    secondary: "#191a1a",
    sidebar: "#171a1b",
    headingFont: "manrope",
    bodyFont: "system",
    purpose: "",
    audience: "",
    voice: "",
    logoRules: "",
    imagery: "",
  };
}
export const agencyBrand: BrandKit = {
  ...defaultBrand(),
  tagline: "STUDIO / WORKSPACE",
  logo: "/branding/PFS_logomark_dark.svg",
  logoOnDark: "/branding/PFS_logomark_light.svg",
};
export function luminance(hex: string) {
  const channels = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
export function foreground(hex: string) {
  const l = luminance(hex);
  return (l + 0.05) / 0.05 >= 1.05 / (l + 0.05) ? "#000000" : "#ffffff";
}
export function themeStyle(kit: BrandKit): CSSProperties {
  return {
    "--orange": kit.primary,
    "--brand-secondary": kit.secondary,
    "--brand-sidebar": kit.sidebar,
    "--brand-sidebar-ink": foreground(kit.sidebar),
    "--brand-button-ink": foreground(kit.primary),
    "--brand-heading": fontOptions[kit.headingFont],
    "--brand-body": fontOptions[kit.bodyFont],
  } as CSSProperties;
}
export function validateBrand(value: unknown): BrandKit {
  if (!value || typeof value !== "object")
    throw new Error("Brand settings are required.");
  const v = value as Record<string, unknown>;
  const result = defaultBrand();
  for (const key of Object.keys(result) as (keyof BrandKit)[]) {
    if (v[key] === undefined && guidelineSections.some((s) => s.key === key))
      continue;
    if (typeof v[key] !== "string")
      throw new Error(`Missing brand field: ${key}`);
    const text = (v[key] as string).trim();
    if (text.length > (key === "logo" || key === "logoOnDark" ? 1000 : 6000))
      throw new Error(`${key} is too long.`);
    Object.assign(result, { [key]: text });
  }
  if (!result.name || result.name.length > 120)
    throw new Error("Enter a brand name of up to 120 characters.");
  for (const key of ["primary", "secondary", "sidebar"] as const)
    if (!/^#[0-9a-f]{6}$/i.test(result[key]))
      throw new Error("Use six-digit HEX colours, such as #ff641d.");
  for (const key of ["headingFont", "bodyFont"] as const)
    if (!Object.hasOwn(fontOptions, result[key]))
      throw new Error("Choose an available font.");
  for (const key of ["logo", "logoOnDark"] as const) {
    const url = result[key];
    if (!url) continue;
    if (/^\/branding\/[a-zA-Z0-9_.-]+$/.test(url)) continue;
    try {
      const parsed = new URL(url);
      if (parsed.protocol === "https:" && !parsed.username && !parsed.password)
        continue;
    } catch {}
    throw new Error(
      "Logo URLs must use HTTPS or an existing /branding/ asset.",
    );
  }
  return result;
}
