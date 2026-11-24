"use client";
import { useState } from "react";
import { foreground } from "@/lib/brand-theme";
export function ColourChip({
  label,
  colour,
}: {
  label: string;
  colour: string;
}) {
  const [message, setMessage] = useState("");
  const rgb = [1, 3, 5].map((i) => parseInt(colour.slice(i, i + 2), 16));
  async function copy() {
    try {
      await navigator.clipboard.writeText(colour);
      setMessage("Copied");
    } catch {
      setMessage("Select and copy the HEX code below.");
    }
  }
  return (
    <div className="guide-colour">
      <button
        type="button"
        className="guide-colour-swatch"
        style={{ background: colour, color: foreground(colour) }}
        onClick={copy}
        aria-label={`Copy ${label} HEX ${colour}`}
      >
        Copy HEX ↗
      </button>
      <strong>{label}</strong>
      <code>{colour.toUpperCase()}</code>
      <small>RGB {rgb.join(" / ")}</small>
      <span role="status" className="copy-status">
        {message}
      </span>
    </div>
  );
}
