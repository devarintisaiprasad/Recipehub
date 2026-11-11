import { Router } from "express";

const router = Router();
const MEAL_API = "https://www.themealdb.com/api/json/v1/1";

// Get JSON from TheMealDB
async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("External API error");
  return res.json();
}

// Turn the messy TheMealDB format into a clean, simple shape
function cleanMeal(m) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name = m[`strIngredient${i}`];
    if (name && name.trim()) {
      ingredients.push(`${m[`strMeasure${i}`] || ""} ${name}`.trim());
    }
  }
  return {
    id: m.idMeal,
    name: m.strMeal,
    image: m.strMealThumb,
    category: m.strCategory || "",
    area: m.strArea || "",
    instructions: m.strInstructions || "",
    youtube: m.strYoutube || "",
    ingredients,
  };
}

// GET /api/categories  -> ["Beef", "Chicken", ...]
router.get("/categories", async (req, res) => {
  try {
    const data = await getJson(`${MEAL_API}/list.php?c=list`);
    res.json((data.meals || []).map((c) => c.strCategory));
  } catch {
    res.status(502).json({ error: "Could not load categories" });
  }
});

// GET /api/recipes?search=pasta   or   /api/recipes?category=Seafood
router.get("/recipes", async (req, res) => {
  const { search, category } = req.query;
  try {
    const url = category
      ? `${MEAL_API}/filter.php?c=${encodeURIComponent(category)}`
      : `${MEAL_API}/search.php?s=${encodeURIComponent(search || "chicken")}`;
    const data = await getJson(url);
    res.json((data.meals || []).map(cleanMeal));
  } catch {
    res.status(502).json({ error: "Could not load recipes" });
  }
});

// GET /api/recipes/52772  -> one full recipe
router.get("/recipes/:id", async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(400).json({ error: "Invalid recipe id" });
  }
  try {
    const data = await getJson(`${MEAL_API}/lookup.php?i=${req.params.id}`);
    if (!data.meals) return res.status(404).json({ error: "Recipe not found" });
    res.json(cleanMeal(data.meals[0]));
  } catch {
    res.status(502).json({ error: "Could not load recipe" });
  }
});

export default router;
