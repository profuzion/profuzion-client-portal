"use client";
import { useState, useTransition } from "react";
import { guidelineSections } from "@/lib/guideline-sections";
import { saveBrand } from "@/app/admin/brand/actions";
import {
  agencyBrand,
  defaultBrand,
  fontOptions,
  themeStyle,
  type BrandKit,
} from "@/lib/brand-theme";

export function BrandEditor({
  initial,
  revision: initialRevision,
  slug = null,
  name,
  published,
}: {
  initial: BrandKit;
  revision: number;
  slug?: string | null;
  name: string;
  published: boolean;
}) {
  const [kit, setKit] = useState(initial);
  const [revision, setRevision] = useState(initialRevision);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [isPublished, setPublished] = useState(published);
  const [pending, startTransition] = useTransition();
  function field(key: keyof BrandKit, value: string) {
    setKit((k) => ({ ...k, [key]: value }));
    setMessage("");
  }
  function save(mode: "draft" | "publish" | "reset") {
    if (
      mode === "reset" &&
      !window.confirm(
        "Reset this brand and its published theme to defaults? This replaces the saved draft too.",
      )
    )
      return;
    const value =
      mode === "reset" ? (slug ? defaultBrand(name) : agencyBrand) : kit;
    startTransition(async () => {
      try {
        const result = await saveBrand(slug, value, revision, mode);
        if (result.error) {
          setError(true);
          setMessage(result.error);
          return;
        }
        setRevision(result.revision!);
        setKit(value);
        setError(false);
        if (mode !== "draft") setPublished(mode === "publish");
        setMessage(
          mode === "publish"
            ? "Guidelines and theme published. Open another page to see the applied theme."
            : mode === "reset"
              ? "Default theme restored."
              : "Draft saved. The published theme is unchanged.",
        );
      } catch {
        setError(true);
        setMessage("Unable to save. Please try again.");
      }
    });
  }
  return (
    <div className="brand-workspace">
      <p>
        {isPublished
          ? "A published brand is active."
          : "Default appearance is active."}{" "}
        Edit your draft, review the preview, then publish to apply the
        guidelines and theme together.
      </p>
      <div className="brand-editor-grid">
        <form
          className="panel form-stack brand-fields"
          onSubmit={(e) => {
            e.preventDefault();
            save("draft");
          }}
        >
          <fieldset disabled={pending}>
            <legend>Brand identity</legend>
            <label>
              Brand name
              <input
                required
                maxLength={120}
                value={kit.name}
                onChange={(e) => field("name", e.target.value)}
              />
            </label>
            <label>
              Tagline
              <input
                value={kit.tagline}
                onChange={(e) => field("tagline", e.target.value)}
              />
            </label>
            <label>
              Logo for light backgrounds
              <input
                value={kit.logo}
                onChange={(e) => field("logo", e.target.value)}
                placeholder="https://…/logo.svg"
              />
              <small>
                Use an HTTPS asset URL or an existing /branding/ file.
              </small>
            </label>
            <label>
              Logo for dark backgrounds
              <input
                value={kit.logoOnDark}
                onChange={(e) => field("logoOnDark", e.target.value)}
                placeholder="https://…/logo-light.svg"
              />
            </label>
          </fieldset>
          <fieldset disabled={pending}>
            <legend>Palette and typography</legend>
            {(
              [
                ["primary", "Primary / buttons"],
                ["secondary", "Secondary"],
                ["sidebar", "Sidebar background"],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                {label}
                <div className="brand-colour-input">
                  <input
                    aria-label={`${label} picker`}
                    type="color"
                    value={
                      /^#[0-9a-f]{6}$/i.test(kit[key]) ? kit[key] : "#000000"
                    }
                    onChange={(e) => field(key, e.target.value)}
                  />
                  <input
                    aria-label={`${label} HEX`}
                    pattern="#[0-9a-fA-F]{6}"
                    required
                    value={kit[key]}
                    onChange={(e) => field(key, e.target.value)}
                  />
                </div>
              </label>
            ))}
            {(
              [
                ["headingFont", "Headings"],
                ["bodyFont", "Body text"],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                {label}
                <select
                  value={kit[key]}
                  onChange={(e) => field(key, e.target.value)}
                >
                  {Object.keys(fontOptions).map((font) => (
                    <option key={font} value={font}>
                      {font === "manrope"
                        ? "Manrope"
                        : font === "serif"
                          ? "Georgia / serif"
                          : "System sans serif"}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <p>
              Text on buttons and the sidebar automatically uses black or white
              for readable contrast.
            </p>
          </fieldset>
          {["Foundation", "Expression", "Identity", "Application"].map(
            (group) => (
              <fieldset disabled={pending} key={group}>
                <legend>{group}</legend>
                {guidelineSections
                  .filter((section) => section.group === group)
                  .map((section) => (
                    <label key={section.key}>
                      {section.title}
                      <textarea
                        maxLength={6000}
                        value={kit[section.key] || ""}
                        onChange={(e) => field(section.key, e.target.value)}
                        placeholder={section.prompt}
                      />
                      <small>
                        Leave blank to hide this section from the published
                        guide.
                      </small>
                    </label>
                  ))}
              </fieldset>
            ),
          )}
          <div className="page-actions">
            <button className="btn btn-outline" disabled={pending}>
              Save draft
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={pending}
              onClick={() => save("publish")}
            >
              Publish guidelines & theme
            </button>
            <button
              type="button"
              className="btn btn-outline"
              disabled={pending}
              onClick={() => save("reset")}
            >
              Reset to defaults
            </button>
          </div>
          {message && (
            <p
              role={error ? "alert" : "status"}
              className={`notice ${error ? "notice-error" : "notice-success"}`}
            >
              {message}
            </p>
          )}
        </form>
        <aside className="brand-preview" style={themeStyle(kit)}>
          <h2>Live draft preview</h2>
          <div className="brand-preview-sidebar">
            {(kit.logoOnDark || kit.logo) && (
              <img
                src={kit.logoOnDark || kit.logo}
                alt={`${kit.name} logo`}
                onError={(e) => {
                  e.currentTarget.style.opacity = "0";
                }}
                onLoad={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
              />
            )}
            <strong>{kit.name}</strong>
            <span>{kit.tagline}</span>
          </div>
          <div className="panel">
            <h2>Your workspace</h2>
            <p>Projects, approvals, and brand assets in one place.</p>
            <span className="btn btn-primary">Review project</span>
            <div className="brand-swatches">
              {[kit.primary, kit.secondary, kit.sidebar].map((colour, i) => (
                <span key={i} style={{ background: colour }} title={colour} />
              ))}
            </div>
          </div>
          <p>Preview only. Saving a draft does not alter the live portal.</p>
        </aside>
      </div>
    </div>
  );
}
