import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "../features/auth/useAuth";

export default function ProtectedRoute({ children }) {
  const authed = isAuthenticated();
  const location = useLocation();
  if (!authed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}
