import type { Metadata } from "next";
import "./globals.css";
import { Manrope } from "next/font/google";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
export const metadata: Metadata = {
  title: { default: "Profuzion | Client Workspace", template: "%s | Profuzion" },
  description: "Private client workspaces by Profuzion Studio.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className={manrope.variable}>{children}</body></html>;
}
