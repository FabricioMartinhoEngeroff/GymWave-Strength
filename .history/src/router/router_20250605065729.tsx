import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthPage } from "../pages/loginPages/AuthPages";
import App from "../App";
import { GraphicsContainer } from "../components/graphics"; // importa direto
import Report from "../pages/Report";
import { PrivateRoute } from "./PrivateRoute";

const router = createBrowserRouter([
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
        <Report />
      </PrivateRoute>
    ),
  },
]);

export default function RoutesProvider() {
  return <RouterProvider router={router} />;
}