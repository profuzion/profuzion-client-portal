import { saveUser } from "@/app/admin/users/actions";
import { PasswordField } from "@/components/password-field";
import { SubmitButton } from "@/components/submit-button";
export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  notify_welcome: boolean;
  notify_password_change: boolean;
  notify_password_reset: boolean;
};
export function UserForm({
  user,
  clients,
  clientId,
  membership,
}: {
  user?: ManagedUser;
  clients: { id: string; name: string }[];
  clientId?: string;
  membership?: string;
}) {
  return (
    <form action={saveUser} className="form-stack panel account-form">
      {user && <input type="hidden" name="id" value={user.id} />}
      <fieldset>
        <legend>Account details</legend>
        <div className="form-grid">
          <label>
            Full name
            <input
              name="name"
              required
              maxLength={150}
              defaultValue={user?.name}
              autoComplete="name"
            />
          </label>
          <label>
            Email address
            <input
              name="email"
              type="email"
              required
              maxLength={254}
              defaultValue={user?.email}
              autoComplete="email"
            />
          </label>
        </div>
        <label>
          Account role
          <select name="role" defaultValue={user?.role || "client"}>
            <option value="client">Client — assigned workspaces only</option>
            <option value="admin">Administrator — all workspaces</option>
          </select>
        </label>
      </fieldset>
      <fieldset>
        <legend>Workspace access</legend>
        <p className="muted">
          Choose a workspace for client accounts. Saving adds or updates this
          membership; other memberships remain in place.
        </p>
        <div className="form-grid">
          <label>
            Client workspace
            <select name="client_id" defaultValue={clientId || ""}>
              <option value="">Select a workspace</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Access level
            <select name="membership" defaultValue={membership || "viewer"}>
              <option value="viewer">Viewer — view work and use support</option>
              <option value="owner">
                Owner — also approve project sections
              </option>
            </select>
          </label>
        </div>
      </fieldset>
      <fieldset>
        <legend>{user ? "Reset password" : "Login credentials"}</legend>
        <PasswordField required={!user} />
        {user && (
          <p className="muted">
            Leave blank to keep the current password. A reset signs the user out
            on all devices.
          </p>
        )}
      </fieldset>
      <fieldset>
        <legend>Email notifications</legend>
        <p className="muted">
          Choose the account notices this person receives. Reset emails confirm
          the change; share the new password separately.
        </p>
        {(
          [
            ["notify_welcome", "Account created"],
            ["notify_password_change", "Password changed by the user"],
            ["notify_password_reset", "Password reset by an administrator"],
          ] as const
        ).map(([key, label]) => (
          <label className="check-row" key={key}>
            <input
              type="checkbox"
              name={key}
              defaultChecked={user?.[key] ?? false}
            />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
      <SubmitButton>{user ? "Save user" : "Create user"}</SubmitButton>
    </form>
  );
}
