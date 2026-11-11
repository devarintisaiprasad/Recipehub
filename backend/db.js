import "dotenv/config";
import fs from "fs";
import path from "path";
import pg from "pg";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  console.error("\nDATABASE_URL is missing. Check the file backend/.env\n");
  process.exit(1);
}

// A pool keeps a few database connections open and reuses them
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export const query = (text, params) => pool.query(text, params);

// If the database "recipehub" does not exist yet, create it automatically
async function ensureDatabase() {
  try {
    await pool.query("SELECT 1");
    return;
  } catch (err) {
    if (err.code !== "3D000") throw err; // 3D000 = database does not exist
  }
  const url = new URL(process.env.DATABASE_URL);
  const dbName = decodeURIComponent(url.pathname.slice(1));
  if (!/^[A-Za-z0-9_]+$/.test(dbName)) throw new Error("Database name can only use letters, numbers and _");
  url.pathname = "/postgres"; // connect to the default database to create ours
  const admin = new pg.Client({ connectionString: url.toString() });
  await admin.connect();
  try {
    await admin.query(`CREATE DATABASE ${dbName}`);
    console.log(`Database "${dbName}" created.`);
  } finally {
    await admin.end();
  }
}

// Create the database (if needed) and the tables from schema.sql
export async function initDb() {
  await ensureDatabase();
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
  await pool.query(sql);
}
