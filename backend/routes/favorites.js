import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Every favourites route needs a valid login token
router.use(requireAuth);

const listFor = async (userId) =>
  (await query("SELECT meal_id AS id, name, image FROM favorites WHERE user_id = $1 ORDER BY created_at", [userId])).rows;

// GET /api/favorites
router.get("/", async (req, res, next) => {
  try {
    res.json(await listFor(req.user.id));
  } catch (err) { next(err); }
});

// POST /api/favorites   body: { id, name, image }
router.post("/", async (req, res, next) => {
  try {
    const { id, name, image } = req.body;
    if (!id || !name) return res.status(400).json({ error: "id and name are required" });
    await query(
      "INSERT INTO favorites (user_id, meal_id, name, image) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING",
      [req.user.id, String(id), name, image || ""]
    );
    res.status(201).json(await listFor(req.user.id));
  } catch (err) { next(err); }
});

// DELETE /api/favorites/:id
router.delete("/:id", async (req, res, next) => {
  try {
    await query("DELETE FROM favorites WHERE user_id = $1 AND meal_id = $2", [req.user.id, req.params.id]);
    res.json(await listFor(req.user.id));
  } catch (err) { next(err); }
});

export default router;
