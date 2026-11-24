import { Shell } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { PasswordField } from "@/components/password-field";
import { SubmitButton } from "@/components/submit-button";
import { changePassword } from "./actions";
export const dynamic = "force-dynamic";
export default async function Account({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const q = await searchParams;
  return (
    <Shell user={user} title="Your account" overline="PERSONAL SETTINGS">
      <p className="page-intro">Signed in as {user.email}</p>
      {q.error && (
        <div className="notice notice-error" role="alert">
          {q.error}
        </div>
      )}
      <form action={changePassword} className="form-stack panel account-form">
        <h2>Change your password</h2>
        <label>
          Current password
          <input
            name="current_password"
            type="password"
            required
            autoComplete="current-password"
            maxLength={512}
          />
        </label>
        <PasswordField />
        <p className="muted">
          You will be signed out on all devices after changing your password.
        </p>
        <SubmitButton>Change password</SubmitButton>
      </form>
    </Shell>
  );
}
