
import { createBrowserRouter } from "react-router-dom";
import { AuthPage } from "../pages/loginPages/AuthPages";
import App from "../App";
import GraphicsContainer from "../components/graphic"; 
import Report from "../components/report";
import { PrivateRoute } from "../router/PrivateRoute";

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