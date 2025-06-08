// src/router/PrivateRoute.tsx
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface Props {
  children: ReactNode;
}

const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

export function PrivateRoute({ children }: Props) {
  return isAuthenticated() ? (
    <>{children}</>
  ) : (
    <Navigate to="/" replace />
  );
}
