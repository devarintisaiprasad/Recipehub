export default function RecipeCard({ meal, isSaved, onOpen, onToggleSave }) {
  return (
    <article className="card">
      <button className="card-img" onClick={onOpen} aria-label={`View ${meal.name}`}>
        <img src={meal.image} alt={meal.name} loading="lazy" />
      </button>
      <div className="card-body">
        <h3>{meal.name}</h3>
        <button
          className={isSaved ? "heart on" : "heart"}
          onClick={onToggleSave}
          aria-pressed={isSaved}
          aria-label={isSaved ? "Remove from saved" : "Save recipe"}
        >
          {isSaved ? "♥" : "♡"}
        </button>
      </div>
    </article>
  );
}
