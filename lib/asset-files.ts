export const assetCategories = {
  logos: "Logos",
  fonts: "Fonts",
  social: "Social media",
  templates: "Templates",
  imagery: "Imagery",
  other: "Other deliverables",
} as const;
export type AssetCategory = keyof typeof assetCategories;
export const MAX_ASSET_BYTES = 20 * 1024 * 1024;
export function safeFilename(name: string) {
  return (
    name
      .replace(/^.*[\\/]/, "")
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^\.+/, "")
      .slice(-160) || "download"
  );
}
export function fileKind(name: string, data: Uint8Array) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const hex = Buffer.from(data.subarray(0, 12)).toString("hex");
  const text = Buffer.from(data.subarray(0, 1024)).toString("utf8");
  const rules: Record<string, [string, boolean]> = {
    png: ["image/png", hex.startsWith("89504e470d0a1a0a")],
    jpg: ["image/jpeg", hex.startsWith("ffd8ff")],
    jpeg: ["image/jpeg", hex.startsWith("ffd8ff")],
    webp: [
      "image/webp",
      text.startsWith("RIFF") && text.slice(8, 12) === "WEBP",
    ],
    pdf: ["application/pdf", text.startsWith("%PDF-")],
    svg: ["image/svg+xml", /<svg[\s>]/i.test(text)],
    ttf: ["font/ttf", hex.startsWith("00010000")],
    otf: ["font/otf", text.startsWith("OTTO")],
    woff: ["font/woff", text.startsWith("wOFF")],
    woff2: ["font/woff2", text.startsWith("wOF2")],
    zip: ["application/zip", hex.startsWith("504b")],
    docx: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      hex.startsWith("504b"),
    ],
    pptx: [
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      hex.startsWith("504b"),
    ],
    xlsx: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      hex.startsWith("504b"),
    ],
    eps: [
      "application/postscript",
      text.startsWith("%!PS") || hex.startsWith("c5d0d3c6"),
    ],
    ai: [
      "application/octet-stream",
      text.startsWith("%PDF-") || text.startsWith("%!PS"),
    ],
    psd: ["image/vnd.adobe.photoshop", text.startsWith("8BPS")],
    txt: ["text/plain", !data.includes(0)],
    mp4: ["video/mp4", text.slice(4, 8) === "ftyp"],
    mov: [
      "video/quicktime",
      ["ftyp", "moov", "mdat", "wide"].includes(text.slice(4, 8)),
    ],
  };
  if (!rules[ext]?.[1])
    throw new Error(
      "Unsupported file or file contents do not match its extension.",
    );
  return {
    mime: rules[ext][0],
    preview: ["png", "jpg", "jpeg", "webp"].includes(ext),
  };
}
export function fileSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
