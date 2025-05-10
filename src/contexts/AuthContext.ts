import { createContext } from "react";
import { User } from "../types/User";

// Interface do contexto de autenticação
export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Criação do contexto
export const AuthContext = createContext<AuthContextType | undefined>(undefined);