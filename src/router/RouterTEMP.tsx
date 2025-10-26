import { createBrowserRouter } from "react-router-dom";
import { AuthPage } from "../pages/loginPages/AuthPages";
import App from "../App";
import GraphicsContainer from "../components/graphic";
import ReportPage from "../components/report";
import { PrivateRoute } from "../router/PrivateRoute";
import { PowerliftingChart } from "../components/PowerliftChart"; // ✅ novo import

export const router = createBrowserRouter([
  { path: "/", element: <AuthPage /> },

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
