import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Graficos from "./pages/Graphics";
import Report from "./pages/Report"; // 👈 importa a página do relatório

export const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/graficos", element: <Graficos /> },
  { path: "/relatorio", element: <Report /> }, // 👈 adiciona a rota para o relatório
]);
