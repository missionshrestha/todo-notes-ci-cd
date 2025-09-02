import { useState } from "react";

export default function HealthPage() {
  const [out, setOut] = useState("");

  async function check() {
    try {
      const base = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
      const res = await fetch(base + "/health/");
      setOut(await res.text());
    } catch (e) {
      setOut(String(e));
    }
  }

  return (
    <section>
      <h2>Health Check</h2>
      <p>
        Backend: <code>{import.meta.env.VITE_API_URL}</code>
      </p>
      <button onClick={check}>Call /health</button>
      <pre style={{ whiteSpace: "pre-wrap" }}>{out}</pre>
    </section>
  );
}
