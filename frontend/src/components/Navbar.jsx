import { Link, useLocation, useNavigate } from "react-router-dom";
import { isAuthenticated, logoutLocal } from "../features/auth/useAuth";
import { useSyncExternalStore } from "react";

// Quick store to re-render nav on login/logout
function useAuthStore() {
  const subscribe = (cb) => {
    window.addEventListener("storage", cb);
    return () => window.removeEventListener("storage", cb);
  };
  const getSnapshot = () => (isAuthenticated() ? "in" : "out");
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export default function Navbar() {
  const state = useAuthStore();
  const nav = useNavigate();
  const { pathname } = useLocation();

  return (
    <header style={{ borderBottom: "1px solid #444", marginBottom: 16 }}>
      <nav
        className="container"
        style={{ display: "flex", gap: 16, alignItems: "center", padding: "0.75rem 0" }}
      >
        <strong>Notes</strong>
        <Link to="/notes">Notes</Link>
        <Link to="/health">Health</Link>
        <span style={{ marginLeft: "auto" }}>
          {state === "in" ? (
            <button
              onClick={() => {
                logoutLocal();
                if (pathname !== "/login") nav("/login");
              }}
            >
              Logout
            </button>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </span>
      </nav>
    </header>
  );
}
