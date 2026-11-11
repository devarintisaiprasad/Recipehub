import "dotenv/config";
import express from "express";
import cors from "cors";
import { initDb, query } from "./db.js";
import { seedUsers } from "./seed.js";
import { indexRecipes } from "./rag.js";
import authRouter from "./routes/auth.js";
import recipesRouter from "./routes/recipes.js";
import favoritesRouter from "./routes/favorites.js";
import adminRouter from "./routes/admin.js";
import assistantRouter from "./routes/assistant.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Devarinti Saiprasad Recipe Hub backend is running",
    endpoints: [
      "POST /api/auth/register",
      "POST /api/auth/login",
      "GET /api/auth/me (login)",
      "GET /api/categories",
      "GET /api/recipes?search=pasta",
      "GET, POST, DELETE /api/favorites (login)",
      "POST /api/assistant/ask (login) - Chef AI (RAG)",
      "GET /api/admin/stats, /api/admin/users (admin only)",
    ],
  });
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRouter);
app.use("/api", recipesRouter);
app.use("/api/favorites", favoritesRouter);
app.use("/api/assistant", assistantRouter);
app.use("/api/admin", adminRouter);

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// Any error thrown inside a route ends up here
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Server error. Check the backend terminal for details." });
});

try {
  await initDb();     // connect to PostgreSQL, create the database and tables
  await seedUsers();  // create the demo admin and employee accounts (first run only)
  app.listen(PORT, () => console.log(`Devarinti Saiprasad Recipe Hub backend running at http://localhost:${PORT}`));

  // Fill the Chef AI knowledge base in the background on the first run
  query("SELECT COUNT(*)::int AS n FROM recipes")
    .then(({ rows }) => {
      if (rows[0].n > 0) return;
      console.log("Loading recipes for Chef AI in the background...");
      return indexRecipes().then((n) => console.log(`Chef AI ready: ${n} recipes indexed.`));
    })
    .catch((e) => console.log("Auto-index skipped (use Admin > Index recipes later):", e.message));
} catch (err) {
  const refused = err.code === "ECONNREFUSED" || err.errors?.some((e) => e.code === "ECONNREFUSED");
  console.error("\nCould not start the backend.");
  if (err.code === "28P01") console.error("Wrong PostgreSQL password. Edit DATABASE_URL in backend/.env (the text after postgres:).");
  else if (refused) console.error("PostgreSQL is not running or not installed. Install it and keep the default port 5432.");
  else console.error(err.message);
  console.error("");
  process.exit(1);
}
