import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { RequireAdmin } from "./components/RequireAdmin";
import { RequireAuth } from "./components/RequireAuth";
import { AuthProvider } from "./context/AuthContext";
import { HomePage } from "./pages/HomePage";
import { CatalogPage } from "./pages/CatalogPage";
import { EquipmentPage } from "./pages/EquipmentPage";
import { OrdersPage } from "./pages/OrdersPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { AdminPage } from "./pages/AdminPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="catalog" element={<CatalogPage />} />
          <Route path="equipment/:id" element={<EquipmentPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route
            path="orders"
            element={
              <RequireAuth>
                <OrdersPage />
              </RequireAuth>
            }
          />
          <Route
            path="admin"
            element={
              <RequireAdmin>
                <AdminPage />
              </RequireAdmin>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
