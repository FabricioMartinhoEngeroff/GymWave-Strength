import { useState, ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import { login as authLogin } from "../services/authService";
import { fetchAuthenticatedUser } from "../services/userService";
import { User } from "../types/User";
import { setCurrentUser } from "../utils/storage";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  async function login(email: string, password: string) {
    const data = await authLogin(email, password);

    if (data?.token) {
      localStorage.setItem("token", data.token);

      try {
        const userData = await fetchAuthenticatedUser();
        if (userData) {
          setUser(userData);
          setCurrentUser(userData.id);
        }
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
      }
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    setCurrentUser(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}