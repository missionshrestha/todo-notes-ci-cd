import { api } from "../../api/client.js";

export async function fetchNotes() {
  const { data } = await api.get("/notes/");
  return data; // expect: [{id, title, content, status?, created_at?, updated_at?}, ...]
}

export async function createNote(payload) {
  // payload: { title, content?, status? }
  const { data } = await api.post("/notes/", payload);
  return data;
}

export async function getNote(id) {
  const { data } = await api.get(`/notes/${id}/`);
  return data;
}

export async function updateNote(id, payload) {
  const { data } = await api.put(`/notes/${id}/`, payload);
  return data;
}

export async function deleteNote(id) {
  await api.delete(`/notes/${id}/`);
}
