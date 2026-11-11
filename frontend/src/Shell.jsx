import { useState } from "react";
import { useAuth } from "./components/AuthContext.jsx";
import RecipeHub from "./RecipeHub.jsx";
import ChefAI from "./components/ChefAI.jsx";
import Admin from "./components/Admin.jsx";

// Header + tabs shown after login. The Admin tab is only for admins.
export default function Shell() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("recipes");
  const isAdmin = user.role === "admin";

  const tabs = [
    ["recipes", "Recipes"],
    ["chef", "Chef AI"],
    ...(isAdmin ? [["admin", "Admin"]] : []),
  ];

  return (
    <div className="app">
      <header className="hero">
        <div className="userbar">
          <span>Hi, {user.name} <em className={`role ${user.role}`}>{user.role}</em></span>
          <button onClick={logout}>Logout</button>
        </div>
        <h1>Devarinti Saiprasad Recipe Hub</h1>
        <p className="tagline">Search recipes, save favourites and ask Chef AI</p>
      </header>

      <nav className="tabs" aria-label="Main sections">
        {tabs.map(([key, label]) => (
          <button key={key} className={tab === key ? "tab on" : "tab"} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </nav>

      {tab === "recipes" && <RecipeHub />}
      {tab === "chef" && <ChefAI />}
      {tab === "admin" && isAdmin && <Admin />}
    </div>
  );
}
