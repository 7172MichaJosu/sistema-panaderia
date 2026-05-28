"use client";

import { useState } from "react";

export default function AdminLogin() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo iniciar sesion.");
      window.location.href = "/admin";
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-hero">
        <div className="brand-mark">
          <span className="brand-icon">PA</span>
          <span className="brand-copy">
            <strong>Panaderia Pasteleria Alarcón Fuente De Soda</strong>
            <span>Administracion</span>
          </span>
        </div>
        <h1>Panel privado para productos y pedidos.</h1>
      </section>
      <section className="login-panel">
        <h2>Acceso administrador</h2>
        <form className="form-grid" onSubmit={submit}>
          <label className="field full">
            <span>Usuario</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required />
          </label>
          <label className="field full">
            <span>Contrasena</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
          </label>
          <button className="button full" type="submit" disabled={saving}>
            {saving ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
        {error ? <div className="error">{error}</div> : null}
      </section>
    </main>
  );
}
