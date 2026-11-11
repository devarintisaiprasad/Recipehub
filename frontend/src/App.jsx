import { useAuth } from "./components/AuthContext.jsx";
import AuthForm from "./components/AuthForm.jsx";
import Shell from "./Shell.jsx";

// Not logged in -> login screen. Logged in -> the app.
export default function App() {
  const { user } = useAuth();
  return user ? <Shell /> : <AuthForm />;
}
