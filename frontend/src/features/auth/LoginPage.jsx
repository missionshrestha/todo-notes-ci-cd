import { useEffect, useState } from "react";
import { loginLocal, getRefreshToken, isAuthenticated } from "./useAuth.js";
import { loginRequest, refreshRequest } from "./authService.js";
import { useLocation, useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [username, setUser] = useState("");
  const [password, setPass] = useState("");
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/notes";

  // If we already have a refresh token, try to restore session automatically.
  useEffect(() => {
    if (isAuthenticated()) return; // have access already
    const refresh = getRefreshToken();
    if (!refresh) return;

    (async () => {
      try {
        setLoading(true);
        const { access } = await refreshRequest(refresh);
        if (access) {
          loginLocal(access, refresh);
          nav(from, { replace: true });
        }
      } catch {
        // ignore; user can log in manually
      } finally {
        setLoading(false);
      }
    })();
  }, [from, nav]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const { access, refresh } = await loginRequest(username, password);
      if (!access || !refresh) throw new Error("Invalid token response");
      loginLocal(access, refresh);
      nav(from, { replace: true });
    } catch (e2) {
      const msg =
        e2?.response?.data?.detail ||
        e2?.message ||
        "Login failed. Check username/password.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h2>Login</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, maxWidth: 360 }}>
        <input
          placeholder="username"
          value={username}
          onChange={(e) => setUser(e.target.value)}
          autoComplete="username"
        />
        <input
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPass(e.target.value)}
          autoComplete="current-password"
        />
        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
        {err && <p style={{ color: "tomato" }}>{err}</p>}
      </form>
      <p style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
        Uses DRF SimpleJWT: <code>POST /api/auth/token/</code> and <code>/api/auth/refresh/</code>
      </p>
    </section>
  );
}
