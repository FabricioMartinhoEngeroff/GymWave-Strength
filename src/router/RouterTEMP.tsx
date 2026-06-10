import { createBrowserRouter } from "react-router-dom";
import { AuthPage } from "../pages/loginPages/AuthPages";
import App from "../App";
import GraphicsContainer from "../components/graphic";
import ReportPage from "../components/report";
import { PrivateRoute } from "../router/PrivateRoute";
import { PowerliftingChart } from "../components/PowerliftChart"; // ✅ novo import
import AdminImport from "../components/adminImport/AdminImport";

export const router = createBrowserRouter([
  { path: "/", element: <AuthPage /> },

  // Rota oculta (não aparece na BottomNav) — uso pessoal, sem autenticação
  { path: "/admin", element: <AdminImport /> },

  {
    path: "/app",
    element: (
      <PrivateRoute>
        <App />
      </PrivateRoute>
    ),
  },

  {
    path: "/graficos",
    element: (
      <PrivateRoute>
        <GraphicsContainer />
      </PrivateRoute>
    ),
  },

  {
    path: "/relatorio",
    element: (
      <PrivateRoute>
        <ReportPage />
      </PrivateRoute>
    ),
  },

  {
    path: "/grafico-powerlifter",
    element: (
      <PrivateRoute>
        <PowerliftingChart />
      </PrivateRoute>
    ),
  },
]);
