import { useCallback, useEffect, useState } from "react";
import * as api from "../api.js";
import { useAuth } from "./AuthContext.jsx";

// Admin tab: manage users and roles, fill the Chef AI knowledge base
export default function Admin() {
  const { user: me } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [indexing, setIndexing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, u] = await Promise.all([api.adminStats(), api.adminUsers()]);
      setStats(s);
      setUsers(u);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function changeRole(id, role) {
    try {
      await api.adminSetRole(id, role);
      setNote("Role updated");
      load();
    } catch (err) { setNote(err.message); }
  }

  async function remove(u) {
    if (!window.confirm(`Delete ${u.name}? Their favourites will also be deleted.`)) return;
    try {
      await api.adminDeleteUser(u.id);
      setNote("User deleted");
      load();
    } catch (err) { setNote(err.message); }
  }

  async function indexRecipes() {
    setIndexing(true);
    setNote("Indexing recipes… this takes about 20 seconds");
    try {
      const res = await api.adminIndexRecipes();
      setNote(`Done. ${res.indexed} recipes are now in the Chef AI knowledge base.`);
      load();
    } catch (err) { setNote(err.message); }
    finally { setIndexing(false); }
  }

  if (error) return <p className="status error">{error}</p>;
  if (!stats) return <p className="status">Loading admin panel…</p>;

  return (
    <section className="admin">
      <div className="stat-row">
        <div className="stat"><span>Users</span><strong>{stats.users}</strong></div>
        <div className="stat"><span>Admins</span><strong>{stats.admins}</strong></div>
        <div className="stat"><span>Saved favourites</span><strong>{stats.favorites}</strong></div>
        <div className="stat"><span>Recipes for Chef AI</span><strong>{stats.indexedRecipes}</strong></div>
      </div>

      <div className="admin-card">
        <h3>Chef AI knowledge base</h3>
        <p>Copies recipes into PostgreSQL so Chef AI can search them. Run this once, and again any time you want to refresh.</p>
        <button className="auth-submit" onClick={indexRecipes} disabled={indexing}>
          {indexing ? "Indexing…" : "Index recipes"}
        </button>
      </div>

      {note && <p className="note" role="status">{note}</p>}

      <div className="admin-card">
        <h3>Users</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Saved</th><th></th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}{u.id === me.id && " (you)"}</td>
                  <td>{u.email}</td>
                  <td>
                    <select value={u.role} disabled={u.id === me.id} onChange={(e) => changeRole(u.id, e.target.value)} aria-label={`Role for ${u.name}`}>
                      <option value="admin">admin</option>
                      <option value="employee">employee</option>
                    </select>
                  </td>
                  <td>{u.favorites}</td>
                  <td><button className="danger" disabled={u.id === me.id} onClick={() => remove(u)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
