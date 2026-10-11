import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Spinner from "./components/ui/Spinner";
import ProtectedRoute from "./routes/ProtectedRoute";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Join from "./pages/auth/Join";
import OwnerLayout from "./pages/owner/OwnerLayout";
import Dashboard from "./pages/owner/Dashboard";
import Rooms from "./pages/owner/Rooms";
import Tenants from "./pages/owner/Tenants";
import Rent from "./pages/owner/Rent";
import Settings from "./pages/owner/Settings";
import { TenantLayout, TenantHome } from "./pages/tenant/Tenant";
import MyRent from "./pages/tenant/MyRent";

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "owner" ? "/owner" : "/app"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/join/:token" element={<Join />} />
      <Route path="/owner" element={<ProtectedRoute role="owner"><OwnerLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="tenants" element={<Tenants />} />
        <Route path="rent" element={<Rent />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="/app" element={<ProtectedRoute role="tenant"><TenantLayout /></ProtectedRoute>}>
        <Route index element={<TenantHome />} />
        <Route path="rent" element={<MyRent />} />
      </Route>
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}