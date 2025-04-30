import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Graficos from "./pages/Graphics";

export const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/graficos", element: <Graficos /> },
]);