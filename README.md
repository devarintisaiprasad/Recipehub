# Devarinti Saiprasad Recipe Hub

A full-stack recipe web application. Users sign up and log in, search recipes, save favourites and ask
**Chef AI** for recipe ideas. Admins manage users and roles.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12%2B-4169E1?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

## Screenshots
> Add your screenshots to `docs/screenshots/` and link them here, for example:
> `![Recipes](docs/screenshots/recipes.png)`

## Features
- **Authentication:** registration and login with **JWT** tokens and **bcrypt** password hashing
- **Role-based access:** `admin` and `employee` roles. Admin routes return `403 Forbidden` for employees
- **Recipe search:** search and browse categories using the free [TheMealDB](https://www.themealdb.com/api.php) API
- **Favourites:** saved per user in PostgreSQL
- **Chef AI (RAG):** retrieves matching recipes with PostgreSQL full-text search, then generates an answer
  from them. Uses the Claude API if a key is set, otherwise a built-in basic answer
- **Admin panel:** view users, change roles, delete users, index recipes for Chef AI
- **API tests:** a Postman collection with automated checks
- **Responsive** layout for phones and desktops

## Tech stack
| Layer | Technology |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Node.js, Express.js, REST API |
| Database | PostgreSQL (`pg`) |
| Security | JWT (`jsonwebtoken`), bcrypt (`bcryptjs`) |
| AI | RAG: PostgreSQL full-text search + Claude API (optional) |
| Testing | Postman |

## How it works
1. **Login:** the backend checks the bcrypt hash and returns a signed JWT. The frontend sends it as
   `Authorization: Bearer <token>` on every request.
2. **Protected routes:** the `requireAuth` middleware verifies the token and loads the user from the database.
   The `requireRole("admin")` middleware then checks the role.
3. **Chef AI (RAG):**
   - *Retrieve:* the question is reduced to keywords and matched against indexed recipes with full-text search
   - *Augment:* the best recipes are placed in the prompt as context
   - *Generate:* the model answers using only that context

## Project structure
```
backend/
  server.js            Express app and start-up
  db.js                PostgreSQL pool, creates the database and tables
  schema.sql           Table definitions
  seed.js              Optional accounts from .env
  rag.js               Indexing, retrieval and answer generation
  middleware/auth.js   JWT check and role check
  routes/              auth, recipes, favorites, assistant, admin
  postman/             API test collection
frontend/
  src/                 React app (login, recipes, Chef AI, admin panel)
```

## Getting started

### Requirements
- Node.js 18 or newer
- PostgreSQL 12 or newer, running on the default port 5432

### 1. Clone
```bash
git clone https://github.com/YOUR-USERNAME/devarinti-saiprasad-recipe-hub.git
cd devarinti-saiprasad-recipe-hub
```

### 2. Backend
```bash
cd backend
cp .env.example .env        # Windows: copy .env.example .env
```
Edit `backend/.env` and set at least `DATABASE_URL` (your PostgreSQL password) and `JWT_SECRET`.
```bash
npm install
npm run dev
```
The database and tables are created automatically. The backend runs at http://localhost:5000.

### 3. Frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173.

### 4. First admin account
Either:
- leave the `SEED_*` values empty and **sign up**. The first account becomes admin, or
- set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `backend/.env` before the first start.

Later sign-ups are employees. Admins can change roles in the Admin tab.

### 5. Chef AI
Chef AI loads recipes automatically on the first run. You can refresh them from **Admin > Index recipes**.
For AI-written answers, add `ANTHROPIC_API_KEY` to `backend/.env`.

## Environment variables (`backend/.env`)
| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | `postgresql://postgres:YOUR_PASSWORD@localhost:5432/recipehub` |
| `JWT_SECRET` | Yes | Long random text for signing tokens |
| `PORT` | No | Default 5000 |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | No | Creates an admin at start-up |
| `SEED_EMPLOYEE_EMAIL`, `SEED_EMPLOYEE_PASSWORD` | No | Creates an employee at start-up |
| `ADMIN_EMAIL` | No | This email becomes admin when it signs up |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | No | Enables AI answers in Chef AI |

Optional local demo buttons on the login page: see `frontend/.env.example`.

## API overview
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | Public |
| GET | `/api/auth/me` | Logged in |
| GET | `/api/categories`, `/api/recipes`, `/api/recipes/:id` | Public |
| GET, POST, DELETE | `/api/favorites` | Logged in |
| POST | `/api/assistant/ask` | Logged in |
| GET | `/api/admin/stats`, `/api/admin/users` | Admin |
| PATCH | `/api/admin/users/:id/role` | Admin |
| DELETE | `/api/admin/users/:id` | Admin |
| POST | `/api/admin/index-recipes` | Admin |

Import `backend/postman/Saiprasad_Recipe_Hub.postman_collection.json` into Postman to run the API tests
(see `backend/postman/API_TESTING.md`).

## Security notes
- Never commit `backend/.env`. It is listed in `.gitignore`.
- Passwords are stored only as bcrypt hashes.
- Use a strong, unique `JWT_SECRET` and strong seed passwords. Do not set `VITE_DEMO_*` on a public site.
- This is a learning project. Add rate limiting and HTTPS before using it in production.

## Roadmap
- Password reset by email
- Recipe ratings and comments
- Embedding-based (vector) search for Chef AI
- Docker setup

## License
MIT. See [LICENSE](LICENSE).

## Author
**Devarinti Saiprasad**
