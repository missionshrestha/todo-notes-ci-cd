import { useState } from "react";
import { loginLocal } from "./useAuth";
import { useLocation, useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [username, setUser] = useState("");
  const [password, setPass] = useState("");
  const [err, setErr] = useState(null);
  const nav = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/notes";

  function onSubmit(e) {
    e.preventDefault();
    if (username && password) {
      // TEMP: set fake token so ProtectedRoute works; real JWT in 2.3
      loginLocal("FAKE_ACCESS", "FAKE_REFRESH");
      nav(from, { replace: true });
      // Let Navbar re-render (storage event trick)
      window.dispatchEvent(new StorageEvent("storage", { key: "accessToken" }));
    } else {
      setErr("Enter username and password");
    }
  }

  return (
    <section>
      <h2>Login</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, maxWidth: 360 }}>
        <input placeholder="username" value={username} onChange={(e) => setUser(e.target.value)} />
        <input placeholder="password" type="password" value={password} onChange={(e) => setPass(e.target.value)} />
        <button type="submit">Login</button>
        {err && <p style={{ color: "tomato" }}>{err}</p>}
      </form>
      <p style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
        Temporary stub; we’ll wire JWT in <strong>2.3</strong>.
      </p>
    </section>
  );
}
