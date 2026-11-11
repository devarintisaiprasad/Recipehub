import { useEffect, useState } from "react";
import RecipeCard from "./components/RecipeCard.jsx";
import RecipeModal from "./components/RecipeModal.jsx";
import * as api from "./api.js";

// Recipes tab: search, categories, favourites
export default function RecipeHub() {
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [saved, setSaved] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  async function load(params) {
    setLoading(true);
    setError("");
    try {
      setRecipes(await api.getRecipes(params));
    } catch {
      setError("Could not load recipes. Make sure the backend is running.");
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
    api.getFavorites().then(setSaved).catch(() => {});
    load({ search: "chicken" });
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setShowSaved(false);
    setActiveCategory("");
    load({ search: query.trim() });
  }

  function pickCategory(cat) {
    setShowSaved(false);
    setQuery("");
    setActiveCategory(cat);
    load({ category: cat });
  }

  async function toggleSave(meal) {
    try {
      const isSaved = saved.some((m) => m.id === meal.id);
      setSaved(isSaved ? await api.removeFavorite(meal.id) : await api.addFavorite(meal));
    } catch {
      setError("Could not update favourites.");
    }
  }

  const shown = showSaved ? saved : recipes;

  return (
    <>
      <form className="search light" onSubmit={handleSearch}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by dish, e.g. pasta, curry, cake"
          aria-label="Search recipes"
        />
        <button type="submit">Search</button>
      </form>

      <nav className="filters" aria-label="Recipe categories">
        <button className={showSaved ? "chip active" : "chip"} onClick={() => setShowSaved(!showSaved)}>
          Saved ({saved.length})
        </button>
        {categories.map((c) => (
          <button
            key={c}
            className={!showSaved && activeCategory === c ? "chip active" : "chip"}
            onClick={() => pickCategory(c)}
          >
            {c}
          </button>
        ))}
      </nav>

      <main>
        {loading && <p className="status">Loading recipes…</p>}
        {error && <p className="status error">{error}</p>}
        {!loading && !error && shown.length === 0 && (
          <p className="status">
            {showSaved ? "No saved recipes yet. Tap the heart on a recipe to save it." : "No recipes found. Try a different dish name."}
          </p>
        )}
        <div className="grid">
          {shown.map((meal) => (
            <RecipeCard
              key={meal.id}
              meal={meal}
              isSaved={saved.some((m) => m.id === meal.id)}
              onOpen={() => setSelectedId(meal.id)}
              onToggleSave={() => toggleSave(meal)}
            />
          ))}
        </div>
      </main>

      {selectedId && <RecipeModal id={selectedId} onClose={() => setSelectedId(null)} />}
    </>
  );
}
