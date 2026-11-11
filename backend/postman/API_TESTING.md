# Testing the API with Postman

1. Start PostgreSQL and the backend (`npm run dev` in the backend folder). It must say "running at http://localhost:5000".
2. Open Postman, click **Import**, and choose `Saiprasad_Recipe_Hub.postman_collection.json`.
3. Open the collection, go to the **Variables** tab and set `adminEmail` and `adminPassword` to an admin account
   of your own database (for example the SEED_ADMIN_* values in your backend/.env). Click **Save**.
4. Run the requests in order (folders 1 to 6), or right-click the collection and choose **Run collection**.
5. Each request has built-in tests. The **Test Results** tab shows green passes.

## What the tests prove
| Folder | What it checks |
|---|---|
| Auth | Register, login, wrong password gives 401, /me needs a token |
| Recipes | Public routes work, a bad id gives 400 |
| Favourites | No token gives 401, add and remove work per user |
| Chef AI | RAG endpoint answers, empty question gives 400 |
| Admin | Admin routes work, an employee gets 403 Forbidden, admin cannot change own role |

## Important status codes
- 200 OK, 201 Created
- 400 Bad request (invalid data)
- 401 Unauthorized (no token or wrong password)
- 403 Forbidden (logged in but the role is not allowed)
- 404 Not found, 409 Conflict (email already exists)

Login requests save the token automatically (a test script stores it in a variable), so you never copy it by hand.
