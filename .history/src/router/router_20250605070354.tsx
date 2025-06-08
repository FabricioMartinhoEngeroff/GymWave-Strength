import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthPage } from "../pages/loginPages/AuthPages";
import App from "../App";
import GraphicsContainer from "../components/graphics"; // ← IMPORT CORRETO: default
import Report from "../pages/Report";
import { PrivateRoute } from "./PrivateRoute";

// 1) Criamos o “router” e exportamos como named export
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
        <Report />
      </PrivateRoute>
    ),
  },
]);