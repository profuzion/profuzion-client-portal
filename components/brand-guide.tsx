import { guidelineSections } from "@/lib/guideline-sections";
import { fontOptions, type BrandKit } from "@/lib/brand-theme";
import { ColourChip } from "@/components/colour-chip";
import { AssetLibrary } from "@/components/asset-library";
import type { BrandAsset } from "@/lib/brand-assets";
export function BrandGuide({
  kit,
  assets,
  scope,
  publishedAt,
}: {
  kit: BrandKit | null;
  assets: BrandAsset[];
  scope: string;
  publishedAt?: Date | null;
}) {
  if (!kit)
    return (
      <>
        <section className="panel guide-awaiting">
          <p className="overline">A BRAND WITH PURPOSE</p>
          <h2>Your guide is taking shape.</h2>
          <p className="muted">
            The approved guidelines will appear here once they are published.
          </p>
        </section>
        <AssetLibrary assets={assets} scope={scope} />
      </>
    );
  const sections = guidelineSections.filter((s) => kit[s.key]?.trim());
  return (
    <div className="guide">
      <header className="guide-cover">
        <p className="overline">THE BRAND / EXPRESSION & APPLICATION</p>
        <h2>{kit.name}</h2>
        <p>{kit.tagline || "A shared reference for everything we create."}</p>
        <div className="guide-cover-bottom">
          <span>Brand guidelines</span>
          {publishedAt && (
            <span>
              Published{" "}
              {new Date(publishedAt).toLocaleDateString("en-CA", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
        </div>
      </header>
      <nav className="guide-index" aria-label="Brand guide sections">
        <a href="#identity">Identity</a>
        <a href="#palette">Colour</a>
        <a href="#typography">Typography</a>
        {sections.map((s) => (
          <a href={`#guide-${s.key}`} key={s.key}>
            {s.title}
          </a>
        ))}
        <a href="#downloads">Downloads</a>
      </nav>
      <section className="guide-section" id="identity">
        <div className="guide-heading">
          <span className="overline">01 / IDENTITY</span>
          <h2>A recognizable signature.</h2>
          <p className="muted">
            Use approved artwork and follow the logo usage guidance below.
          </p>
        </div>
        <div className="guide-logo-grid">
          {(
            [
              ["On light", kit.logo, "#f0eee9"],
              ["On dark", kit.logoOnDark, "#101112"],
            ] as const
          )
            .filter(([, url]) => url)
            .map(([label, url, bg]) => (
              <figure key={label}>
                <div className="guide-logo-stage" style={{ background: bg }}>
                  <img
                    src={url}
                    alt={`${kit.name} logo ${label.toLowerCase()}`}
                  />
                </div>
                <figcaption>{label}</figcaption>
              </figure>
            ))}
        </div>
        <a className="text-link" href="#downloads">
          Find your downloadable logo files ↓
        </a>
      </section>
      <section className="guide-section" id="palette">
        <div className="guide-heading">
          <span className="overline">02 / COLOUR</span>
          <h2>A consistent palette.</h2>
          <p className="muted">
            Click a swatch to copy its HEX value. Use approved print
            specifications from the colour guidance when producing printed
            materials.
          </p>
        </div>
        <div className="guide-colours">
          <ColourChip label="Primary" colour={kit.primary} />
          <ColourChip label="Secondary" colour={kit.secondary} />
          <ColourChip label="Supporting dark" colour={kit.sidebar} />
        </div>
      </section>
      <section className="guide-section" id="typography">
        <div className="guide-heading">
          <span className="overline">03 / TYPOGRAPHY</span>
          <h2>Words with character.</h2>
        </div>
        <div className="guide-type-grid">
          <div className="panel">
            <p className="overline">HEADINGS / {kit.headingFont}</p>
            <p
              className="guide-type-sample"
              style={{ fontFamily: fontOptions[kit.headingFont] }}
            >
              Make it
              <br />
              meaningful.
            </p>
            <p className="muted">
              ABCDEFGHIJKLMNOPQRSTUVWXYZ
              <br />
              abcdefghijklmnopqrstuvwxyz
              <br />
              0123456789 &!?@
            </p>
          </div>
          <div className="panel">
            <p className="overline">BODY / {kit.bodyFont}</p>
            <p
              className="guide-body-sample"
              style={{ fontFamily: fontOptions[kit.bodyFont] }}
            >
              Good design makes every detail feel intentional. Clear language
              and a consistent rhythm help people understand, connect and take
              the next step.
            </p>
            <p className="muted">
              Font downloads and installation notes are available below when
              supplied and licensed for distribution.
            </p>
          </div>
        </div>
      </section>
      {sections.map((s, i) => (
        <section
          className="guide-section guide-copy-section"
          id={`guide-${s.key}`}
          key={s.key}
        >
          <div className="guide-heading">
            <span className="overline">
              {String(i + 4).padStart(2, "0")} / {s.group.toUpperCase()}
            </span>
            <h2>{s.title}</h2>
          </div>
          <div className="guide-prose">
            {kit[s.key].split(/\n\s*\n/).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </section>
      ))}
      <AssetLibrary assets={assets} scope={scope} />
    </div>
  );
}
