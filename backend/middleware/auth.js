import crypto from "crypto";
import jwt from "jsonwebtoken";
import { query } from "../db.js";

// The secret signs every login token. Set JWT_SECRET in backend/.env.
// If it is missing, a random one is used (everyone is logged out whenever the server restarts).
export const SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");
if (!process.env.JWT_SECRET) console.warn("Warning: JWT_SECRET is not set in backend/.env. Using a temporary random secret.");

// Step 1: is the user logged in? Checks the JWT, then loads the user from the database
// (so a deleted user, or a changed role, takes effect immediately).
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Please log in" });

  let payload;
  try {
    payload = jwt.verify(token, SECRET);
  } catch {
    return res.status(401).json({ error: "Session expired. Please log in again" });
  }

  try {
    const { rows } = await query("SELECT id, name, email, role FROM users WHERE id = $1", [payload.id]);
    if (!rows[0]) return res.status(401).json({ error: "This account no longer exists" });
    req.user = rows[0];
    next();
  } catch (err) {
    next(err);
  }
}

// Step 2: does the user have the right role? Use after requireAuth.
export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role)
    ? next()
    : res.status(403).json({ error: "You do not have permission to do this" });
