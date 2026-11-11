import { useState } from "react";
import * as api from "../api.js";
import { useAuth } from "./AuthContext.jsx";

// Optional one-click demo buttons. They appear only if you set VITE_DEMO_* in frontend/.env.local
const DEMOS = [
  ["Admin", import.meta.env.VITE_DEMO_ADMIN_EMAIL, import.meta.env.VITE_DEMO_ADMIN_PASSWORD],
  ["Employee", import.meta.env.VITE_DEMO_USER_EMAIL, import.meta.env.VITE_DEMO_USER_PASSWORD],
].filter(([, email, password]) => email && password);

// Login / Sign up screen shown before the user is logged in
export default function AuthForm() {
  const { login } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = mode === "login" ? await api.login(form) : await api.register(form);
      login(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <header className="hero">
        <h1>Devarinti Saiprasad Recipe Hub</h1>
        <p className="tagline">Log in to search recipes and save your favourites</p>
      </header>

      <form className="auth-card" onSubmit={submit}>
        <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
        {mode === "register" && (
          <label>Name<input value={form.name} onChange={set("name")} required /></label>
        )}
        <label>Email<input type="email" value={form.email} onChange={set("email")} required /></label>
        <label>
          Password{mode === "register" && " (6+ characters)"}
          <input type="password" value={form.password} onChange={set("password")} minLength={mode === "register" ? 6 : undefined} required />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="auth-submit" disabled={busy}>
          {busy ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
        </button>
        <button
          type="button"
          className="auth-switch"
          onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
        >
          {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
        </button>
      </form>

      {DEMOS.length > 0 && (
        <div className="demo">
          <strong>Local demo logins</strong>
          {DEMOS.map(([label, email, password]) => (
            <button key={label} type="button" onClick={() => { setMode("login"); setError(""); setForm({ name: "", email, password }); }}>
              {label}: {email}
            </button>
          ))}
          <small>Click one to fill the form, then press Log in.</small>
        </div>
      )}
    </div>
  );
}
