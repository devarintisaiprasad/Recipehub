import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { answerQuestion } from "../rag.js";

const router = Router();

// POST /api/assistant/ask   body: { question }   (any logged-in user)
router.post("/ask", requireAuth, async (req, res, next) => {
  try {
    const question = String(req.body.question || "").trim();
    if (!question) return res.status(400).json({ error: "Please type a question" });
    if (question.length > 300) return res.status(400).json({ error: "Question is too long (max 300 characters)" });
    res.json(await answerQuestion(question));
  } catch (err) { next(err); }
});

export default router;
