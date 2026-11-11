import bcrypt from "bcryptjs";
import { query } from "./db.js";

// Optional accounts, read from backend/.env (nothing is hard-coded in the source code)
export async function seedUsers() {
  const accounts = [
    { name: "Administrator", email: process.env.SEED_ADMIN_EMAIL, password: process.env.SEED_ADMIN_PASSWORD, role: "admin" },
    { name: "Demo Employee", email: process.env.SEED_EMPLOYEE_EMAIL, password: process.env.SEED_EMPLOYEE_PASSWORD, role: "employee" },
  ].filter((a) => a.email?.trim() && a.password);

  if (accounts.length === 0) {
    console.log("No seed accounts set in .env. The first person who signs up becomes admin.");
    return;
  }

  for (const a of accounts) {
    const { rowCount } = await query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      [a.name, a.email.trim().toLowerCase(), await bcrypt.hash(a.password, 10), a.role]
    );
    if (rowCount) console.log(`Seed account created: ${a.role} (${a.email.trim().toLowerCase()})`);
  }
}
