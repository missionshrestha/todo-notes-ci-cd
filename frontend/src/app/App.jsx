import { Routes, Route, Navigate } from "react-router-dom";
import ApiErrorBanner from "../components/ApiErrorBanner.jsx";
import Navbar from "../components/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";
import HealthPage from "../pages/HealthPage";
import LoginPage from "../features/auth/LoginPage";
import NotesListPage from "../features/notes/pages/NotesListPage";
import NoteEditPage from "../features/notes/pages/NoteEditPage";

export default function App() {
  return (
    <>
      <Navbar />
      <ApiErrorBanner />
      <main className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/notes" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/health" element={<HealthPage />} />
          <Route
            path="/notes"
            element={
              <ProtectedRoute>
                <NotesListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notes/:id"
            element={
              <ProtectedRoute>
                <NoteEditPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<p>Not Found</p>} />
        </Routes>
      </main>
    </>
  );
}
