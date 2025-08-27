import { useEffect, useState } from "react";

export default function ApiErrorBanner() {
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let hideTimer = null;
    const onErr = (e) => {
      const m = e?.detail?.message || "An error occurred.";
      setMsg(m);
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setMsg(""), 4000); // auto-hide
    };
    window.addEventListener("api:error", onErr);
    return () => {
      window.removeEventListener("api:error", onErr);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!msg) return null;
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        padding: "8px 12px",
        background: "rgba(255, 99, 71, 0.15)",
        borderBottom: "1px solid tomato",
        color: "tomato",
        fontSize: 14,
      }}
      role="alert"
      aria-live="polite"
    >
      {msg}
    </div>
  );
}
