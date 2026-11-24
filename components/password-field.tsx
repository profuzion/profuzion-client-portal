"use client";
import { useState } from "react";
export function PasswordField({ required = true }: { required?: boolean }) {
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  function generate() {
    const alphabet =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    const limit = 256 - (256 % alphabet.length);
    let generated = "";
    while (generated.length < 24) {
      for (const byte of crypto.getRandomValues(new Uint8Array(32))) {
        if (byte < limit) generated += alphabet[byte % alphabet.length];
        if (generated.length === 24) break;
      }
    }
    setPassword(generated);
    setVisible(true);
  }

  return (
    <div className="password-control">
      <label>
        {required ? "Password" : "New password (optional)"}
        <input
          name="password"
          type={visible ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required={required}
          minLength={12}
          maxLength={512}
          autoComplete="new-password"
        />
        <small>
          At least 12 characters. Share securely; passwords are never emailed.
        </small>
      </label>
      <div className="page-actions">
        <button type="button" className="btn btn-outline" onClick={generate}>
          Generate password
        </button>
        <button
          type="button"
          className="btn btn-outline"
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          {visible ? "Hide" : "Show"} password
        </button>
      </div>
    </div>
  );
}
