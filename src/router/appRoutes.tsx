import { Navigate, type RouteObject } from "react-router-dom";
import App from "../App";
import AdminImport from "../components/adminImport/AdminImport";
import GraphicsContainer from "../components/graphic";
import { RequireAuth } from "../components/login/routes/RequireAuth";
import { RequireRole } from "../components/login/routes/RequireRole";
import { AuthPage } from "../components/login/ui/AuthPage";
import { PowerliftingChart } from "../components/PowerliftChart";
import ReportPage from "../components/report";

export const appRoutes: RouteObject[] = [
  { path: "/", element: <AuthPage /> },
  {
    path: "/admin",
    element: (
      <RequireRole role="admin">
        <AdminImport />
      </RequireRole>
    ),
  },
  { path: "/app", element: <RequireAuth><App /></RequireAuth> },
  { path: "/graficos", element: <RequireAuth><GraphicsContainer /></RequireAuth> },
  { path: "/relatorio", element: <RequireAuth><ReportPage /></RequireAuth> },
  { path: "/grafico-powerlifter", element: <RequireAuth><PowerliftingChart /></RequireAuth> },
  { path: "*", element: <Navigate to="/" replace /> },
];
