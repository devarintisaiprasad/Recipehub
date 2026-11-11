import { Router } from "express";
import { query } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { indexRecipes } from "../rag.js";

const router = Router();

// Only logged-in ADMINS can use anything below (employees get 403 Forbidden)
router.use(requireAuth, requireRole("admin"));

// GET /api/admin/stats
router.get("/stats", async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT (SELECT COUNT(*) FROM users)::int AS users,
             (SELECT COUNT(*) FROM users WHERE role = 'admin')::int AS admins,
             (SELECT COUNT(*) FROM favorites)::int AS favorites,
             (SELECT COUNT(*) FROM recipes)::int AS "indexedRecipes"`);
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// GET /api/admin/users
router.get("/users", async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT u.id, u.name, u.email, u.role, u.created_at AS "createdAt",
             (SELECT COUNT(*) FROM favorites f WHERE f.user_id = u.id)::int AS favorites
      FROM users u ORDER BY u.id`);
    res.json(rows);
  } catch (err) { next(err); }
});

// PATCH /api/admin/users/:id/role   body: { role: "admin" | "employee" }
router.patch("/users/:id/role", async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!["admin", "employee"].includes(role)) return res.status(400).json({ error: "Role must be admin or employee" });
    if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: "You cannot change your own role" });
    const { rows } = await query(
      "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role",
      [role, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", async (req, res, next) => {
  try {
    if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: "You cannot delete your own account" });
    const { rowCount } = await query("DELETE FROM users WHERE id = $1", [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: "User not found" });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// POST /api/admin/index-recipes   fills the Chef AI knowledge base
router.post("/index-recipes", async (req, res, next) => {
  try {
    res.json({ indexed: await indexRecipes() });
  } catch (err) { next(err); }
});

export default router;
