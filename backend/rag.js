// RAG = Retrieval-Augmented Generation
//   1. RETRIEVE: find the recipes in our PostgreSQL database that match the question
//   2. AUGMENT : put those recipes into the prompt as context
//   3. GENERATE: an AI model (Claude) writes an answer using ONLY that context
// If no ANTHROPIC_API_KEY is set, step 3 uses a simple built-in answer so the feature still works.
import { query } from "./db.js";

const MEAL_API = "https://www.themealdb.com/api/json/v1/1";

const STOP_WORDS = new Set((
  "the and for with have has had can could would should what which who how why when where " +
  "from this that these those you your our any some give tell show want need make cook cooking " +
  "recipe recipes dish dishes something anything please using use are was were will into about " +
  "like just got get its not but then than them they there here out all one"
).split(" "));

// Turn a question into important keywords: "I have chicken and rice" -> ["chicken", "rice"]
export function extractKeywords(question) {
  const words = question.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/);
  return [...new Set(words.filter((w) => w.length > 2 && !STOP_WORDS.has(w)))].slice(0, 12);
}

// ---------- Indexing: copy recipes from TheMealDB into PostgreSQL ----------
export async function indexRecipes() {
  const letters = "abcdefghijklmnopqrstuvwxyz".split("");
  const pages = await Promise.all(
    letters.map((l) =>
      fetch(`${MEAL_API}/search.php?f=${l}`).then((r) => r.json()).catch(() => ({ meals: null }))
    )
  );
  const meals = pages.flatMap((p) => p.meals || []);

  for (const m of meals) {
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const name = m[`strIngredient${i}`];
      if (name && name.trim()) ingredients.push(`${m[`strMeasure${i}`] || ""} ${name}`.trim());
    }
    await query(
      `INSERT INTO recipes (meal_id, name, category, area, ingredients, instructions, image, youtube)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (meal_id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category,
         area = EXCLUDED.area, ingredients = EXCLUDED.ingredients, instructions = EXCLUDED.instructions,
         image = EXCLUDED.image, youtube = EXCLUDED.youtube`,
      [m.idMeal, m.strMeal, m.strCategory, m.strArea, ingredients.join(", "), m.strInstructions, m.strMealThumb, m.strYoutube]
    );
  }
  return meals.length;
}

// ---------- Step 1: RETRIEVE ----------
export async function retrieve(question, limit = 4) {
  const words = extractKeywords(question);
  if (words.length === 0) return [];
  // Words contain only letters, so this is safe. "|" means OR.
  const { rows } = await query(
    `SELECT meal_id AS id, name, category, area, ingredients, instructions, image,
            ts_rank(search, q) AS rank
     FROM recipes, to_tsquery('english', $1) q
     WHERE search @@ q
     ORDER BY rank DESC
     LIMIT $2`,
    [words.join(" | "), limit]
  );
  return rows;
}

// ---------- Step 2: AUGMENT ----------
function buildContext(recipes) {
  return recipes
    .map((r, i) =>
      `[${i + 1}] ${r.name} (${r.category}, ${r.area})\nIngredients: ${r.ingredients}\nMethod: ${(r.instructions || "").slice(0, 600)}`
    )
    .join("\n\n");
}

// ---------- Step 3: GENERATE ----------
async function askClaude(question, context) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
      max_tokens: 700,
      system:
        "You are Chef AI, the cooking assistant of Devarinti Saiprasad Recipe Hub. Answer the user's question using ONLY " +
        "the recipes given in CONTEXT. Mention recipe names. If the context does not answer the question, say so. " +
        "Keep the answer short, friendly and easy to read.",
      messages: [{ role: "user", content: `CONTEXT:\n${context}\n\nQUESTION: ${question}` }],
    }),
  });
  if (!res.ok) throw new Error("AI request failed");
  const data = await res.json();
  return data.content.map((b) => b.text || "").join("").trim();
}

// Simple answer used when there is no AI key
function basicAnswer(recipes) {
  const lines = recipes.map((r, i) => {
    const first = r.ingredients.split(", ").slice(0, 5).join(", ");
    return `${i + 1}. ${r.name} (${r.category}, ${r.area}). Main ingredients: ${first}.`;
  });
  return `These recipes from our collection match your question:\n${lines.join("\n")}\nTap a recipe below to see the full method.`;
}

// Main function used by the route
export async function answerQuestion(question) {
  const { rows } = await query("SELECT COUNT(*)::int AS n FROM recipes");
  if (rows[0].n === 0) return { indexed: false };

  const recipes = await retrieve(question);
  if (recipes.length === 0) {
    return {
      indexed: true,
      mode: "basic",
      answer: "I could not find a matching recipe. Try using ingredient names, like 'chicken rice' or 'chocolate'.",
      sources: [],
    };
  }

  let answer, mode = "basic";
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      answer = await askClaude(question, buildContext(recipes));
      mode = "ai";
    } catch {
      answer = basicAnswer(recipes); // AI failed: fall back so the user still gets help
    }
  } else {
    answer = basicAnswer(recipes);
  }
  return { indexed: true, mode, answer, sources: recipes.map(({ id, name, image }) => ({ id, name, image })) };
}
