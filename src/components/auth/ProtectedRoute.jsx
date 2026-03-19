import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
  // Se l'utente è autenticato, renderizza i figli (la route protetta)
  // Altrimenti, reindirizza alla pagina di login
}
