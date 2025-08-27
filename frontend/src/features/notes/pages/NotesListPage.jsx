import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchNotes, createNote, deleteNote } from "../api.js";

export default function NotesListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  async function load() {
    try {
      setLoading(true);
      setErr("");
      const data = await fetchNotes();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to load notes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e) {
    e.preventDefault();
    if (!title.trim()) {
      setErr("Title is required.");
      return;
    }
    try {
      setErr("");
      await createNote({ title: title.trim(), content: content.trim() });
      setTitle("");
      setContent("");
      await load();
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to create note.");
    }
  }

  async function onDelete(id) {
    if (!confirm("Delete this note?")) return;
    try {
      await deleteNote(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to delete note.");
    }
  }

  return (
    <section>
      <h2>Notes</h2>

      <form onSubmit={onCreate} style={{ display: "grid", gap: 8, maxWidth: 520, marginBottom: 16 }}>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Content (optional)"
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button type="submit">Add Note</button>
        {err && <p style={{ color: "tomato", margin: 0 }}>{err}</p>}
      </form>

      {loading ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <p>No notes yet. Create your first one above.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 12 }}>
          {items.map((n) => (
            <li key={n.id} style={{ border: "1px solid #444", borderRadius: 8, padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <strong style={{ fontSize: 16 }}>{n.title ?? "(untitled)"}</strong>
                {n.status ? (
                  <span style={{ fontSize: 12, opacity: 0.8, border: "1px solid #666", padding: "2px 6px", borderRadius: 999 }}>
                    {n.status}
                  </span>
                ) : null}
                <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  <Link to={`/notes/${n.id}`}>Edit</Link>
                  <button onClick={() => onDelete(n.id)} type="button">Delete</button>
                </span>
              </div>
              {n.content ? <p style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>{n.content}</p> : null}
              {n.created_at || n.updated_at ? (
                <p style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
                  {n.created_at ? `Created: ${new Date(n.created_at).toLocaleString()}` : ""}
                  {n.updated_at ? ` | Updated: ${new Date(n.updated_at).toLocaleString()}` : ""}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
