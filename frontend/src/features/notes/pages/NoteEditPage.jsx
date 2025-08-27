import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getNote, updateNote, deleteNote } from "../api.js";

const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "DONE"]; // adjust to your backend choices or remove entirely

export default function NoteEditPage() {
  const { id } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState(""); // optional

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const n = await getNote(id);
        setTitle(n?.title || "");
        setContent(n?.content || "");
        setStatus(n?.status || "");
      } catch (e) {
        setErr(e?.response?.data?.detail || e?.message || "Failed to load note.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function onSave(e) {
    e.preventDefault();
    if (!title.trim()) {
      setErr("Title is required.");
      return;
    }
    try {
      setErr("");
      const payload = { title: title.trim(), content: content.trim() };
      if (status) payload.status = status; // only send if set
      await updateNote(id, payload);
      nav("/notes");
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to save note.");
    }
  }

  async function onDelete() {
    if (!confirm("Delete this note?")) return;
    try {
      await deleteNote(id);
      nav("/notes");
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to delete note.");
    }
  }

  if (loading) return <p>Loading…</p>;

  return (
    <section>
      <h2>Edit Note</h2>
      <form onSubmit={onSave} style={{ display: "grid", gap: 8, maxWidth: 520 }}>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Content"
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label>Status:</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">(not set)</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit">Save</button>
          <button type="button" onClick={onDelete}>Delete</button>
          <Link to="/notes" style={{ marginLeft: "auto" }}>Back to list</Link>
        </div>
        {err && <p style={{ color: "tomato", margin: 0 }}>{err}</p>}
      </form>
    </section>
  );
}
