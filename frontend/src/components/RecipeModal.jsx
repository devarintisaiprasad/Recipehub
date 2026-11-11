import { useEffect, useState } from "react";
import { getRecipe } from "../api.js";

export default function RecipeModal({ id, onClose }) {
  const [meal, setMeal] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getRecipe(id).then(setMeal).catch(() => setError(true));
  }, [id]);

  // Close with the Escape key
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">×</button>
        {error && <p className="status error">Could not load this recipe.</p>}
        {!meal && !error && <p className="status">Loading…</p>}
        {meal && (
          <>
            <img src={meal.image} alt={meal.name} />
            <div className="modal-body">
              <h2>{meal.name}</h2>
              <p className="meta">{meal.category} · {meal.area}</p>
              <h4>Ingredients</h4>
              <ul>
                {meal.ingredients.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <h4>Method</h4>
              <p className="method">{meal.instructions}</p>
              {meal.youtube && (
                <a href={meal.youtube} target="_blank" rel="noreferrer">Watch on YouTube</a>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
