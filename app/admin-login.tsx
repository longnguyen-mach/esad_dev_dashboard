"use client";

import { useState, type FormEvent } from "react";
import {
  setAdminAuthenticated,
  useAdminAuthenticated,
} from "./admin-auth";

type AdminLoginProps = {
  username: string;
  password: string;
};

export function AdminLogin({ username, password }: AdminLoginProps) {
  const authenticated = useAdminAuthenticated();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (user.trim() === username && pass === password) {
      setAdminAuthenticated(true);
      setError(null);
      setPass("");
      setOpen(false);
      return;
    }
    setError("Invalid credentials");
  }

  function handleLogout() {
    setAdminAuthenticated(false);
    setOpen(false);
    setUser("");
    setPass("");
    setError(null);
  }

  return (
    <div className="admin-login">
      {authenticated ? (
        <div className="admin-login-status">
          <span className="admin-login-badge">Admin</span>
          <button
            type="button"
            className="admin-login-button"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            className="admin-login-button"
            aria-expanded={open}
            onClick={() => {
              setOpen((value) => !value);
              setError(null);
            }}
          >
            Admin login
          </button>
          {open ? (
            <form className="admin-login-panel" onSubmit={handleSubmit}>
              <p className="admin-login-title">Admin credentials</p>
              <label className="admin-login-field">
                <span>Username</span>
                <input
                  name="username"
                  autoComplete="username"
                  value={user}
                  onChange={(event) => setUser(event.target.value)}
                />
              </label>
              <label className="admin-login-field">
                <span>Password</span>
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={pass}
                  onChange={(event) => setPass(event.target.value)}
                />
              </label>
              {error ? <p className="admin-login-error">{error}</p> : null}
              <button type="submit" className="admin-login-submit">
                Sign in
              </button>
            </form>
          ) : null}
        </>
      )}
    </div>
  );
}
