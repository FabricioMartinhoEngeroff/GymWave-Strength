import { User } from "../types/User";
import { handleApiError } from "../utils/handleApiError";

interface JwtPayload {
    email: string;
    role: string;
    exp: number;
    [key: string]: unknown; 
  }
  
  // Decodifica o token JWT e retorna o payload fortemente tipado
  function parseJWT(token: string): JwtPayload | null {
    try {
      const payload = token.split(".")[1];
      const decoded: JwtPayload = JSON.parse(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
      );
      return decoded;
    } catch {
      return null;
    }
  }

// Busca o usuário autenticado com base no token salvo localmente
export async function fetchAuthenticatedUser(): Promise<User | null> {
  const token = localStorage.getItem("token");
  const email = localStorage.getItem("email");

  if (!token || !email) {
    alert("Sessão expirada. Faça login novamente.");
    window.location.href = "/login";
    return null;
  }

  try {
    const payload = parseJWT(token);
    if (!payload || Date.now() / 1000 > payload.exp) {
      throw new Error("Token expirado.");
    }

    const usersJSON = localStorage.getItem("mock-users");
    const users: MockUser[] = usersJSON ? JSON.parse(usersJSON) : [];

    const user = users.find((u) => u.email === email);

    if (!user) throw new Error("Usuário não encontrado.");

    return {
      id: user.email, 
      name: user.name,
      email: user.email,
      role: user.role,
      telefone: user.telefone,
      cpf: user.cpf,
      endereco: user.endereco,
    };
  } catch (error) {
    handleApiError(error, "Erro ao buscar usuário autenticado.");
    return null;
  }
}

// Reutiliza o tipo local
interface MockUser {
  name: string;
  email: string;
  password: string;
  role: string;
  cpf: string;
  telefone: string;
  endereco: {
    rua: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
}