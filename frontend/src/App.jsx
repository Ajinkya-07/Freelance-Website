import "./App.css";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProjectDetails from "./pages/ProjectDetails";
import Signup from "./pages/Signup";
import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";
import CreateJob from "./pages/CreateJob";
import JobProposals from "./pages/JobProposals";
import Editors from "./pages/Editors";
import EditorProfile from "./pages/EditorProfile";
import MyPortfolio from "./pages/MyPortfolio";
import Wallet from "./pages/Wallet";
import AdminPanel from "./pages/AdminPanel";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs"
          element={
            <ProtectedRoute>
              <Jobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/create"
          element={
            <ProtectedRoute requireRole="client">
              <CreateJob />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/:id"
          element={
            <ProtectedRoute>
              <JobDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/:id/proposals"
          element={
            <ProtectedRoute requireRole="client">
              <JobProposals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute>
              <ProjectDetails />
            </ProtectedRoute>
          }
        />
        {/* Editor Pages */}
        <Route
          path="/editors"
          element={
            <ProtectedRoute>
              <Editors />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editors/:editorId"
          element={
            <ProtectedRoute>
              <EditorProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-portfolio"
          element={
            <ProtectedRoute requireRole="editor">
              <MyPortfolio />
            </ProtectedRoute>
          }
        />
        {/* Wallet & Payments */}
        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <Wallet />
            </ProtectedRoute>
          }
        />
        {/* Admin Panel - Accessible only via URL */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireRole="admin">
              <AdminPanel />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;