"use client";

import Link from "next/link";

export default function ClientSettingsError({ reset }: { reset: () => void }) {
  return <div className="notice notice-error" role="alert">
    <h2>Client settings are unavailable</h2>
    <p>We couldn&apos;t load this workspace. Please try again.</p>
    <button type="button" className="btn btn-primary" onClick={reset}>Try again</button>{" "}
    <Link href="/admin" className="btn">Back to Clients</Link>
  </div>;
}
