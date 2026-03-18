import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/register"
            element={<div className="text-white">Register</div>}
          />
          <Route
            path="/boards"
            element={<div className="text-white">Boards</div>}
          />
          <Route
            path="/board/:id"
            element={<div className="text-white">Board</div>}
          />
          <Route path="*" element={<Navigate to="/boards" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
