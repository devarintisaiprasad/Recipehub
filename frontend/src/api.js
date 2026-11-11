// All calls to our own backend live here. The login token is added automatically.
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

async function request(url, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Token expired or invalid: log the user out
    if (res.status === 401 && token) onUnauthorized();
    throw new Error(data.error || "Request failed");
  }
  return data;
}

const send = (method, body) => ({ method, body: JSON.stringify(body) });

// Auth
export const register = (body) => request("/api/auth/register", send("POST", body));
export const login = (body) => request("/api/auth/login", send("POST", body));
export const getMe = () => request("/api/auth/me");

// Recipes
export const getCategories = () => request("/api/categories");
export const getRecipes = (params) => request(`/api/recipes?${new URLSearchParams(params)}`);
export const getRecipe = (id) => request(`/api/recipes/${id}`);

// Favourites (need login)
export const getFavorites = () => request("/api/favorites");
export const addFavorite = (meal) =>
  request("/api/favorites", send("POST", { id: meal.id, name: meal.name, image: meal.image }));
export const removeFavorite = (id) => request(`/api/favorites/${id}`, { method: "DELETE" });

// Chef AI (RAG)
export const askAssistant = (question) => request("/api/assistant/ask", send("POST", { question }));

// Admin only
export const adminStats = () => request("/api/admin/stats");
export const adminUsers = () => request("/api/admin/users");
export const adminSetRole = (id, role) => request(`/api/admin/users/${id}/role`, send("PATCH", { role }));
export const adminDeleteUser = (id) => request(`/api/admin/users/${id}`, { method: "DELETE" });
export const adminIndexRecipes = () => request("/api/admin/index-recipes", { method: "POST" });
